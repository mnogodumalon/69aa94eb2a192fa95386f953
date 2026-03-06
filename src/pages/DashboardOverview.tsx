import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSchadensmeldung, enrichBearbeitungsstatus } from '@/lib/enrich';
import type { Schadensmeldung, Bearbeitungsstatus } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { SchadensmeldungDialog } from '@/components/dialogs/SchadensmeldungDialog';
import { BearbeitungsstatusDialog } from '@/components/dialogs/BearbeitungsstatusDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, MapPin, Calendar, AlertTriangle, Trash2, Pencil, ChevronRight, User, TriangleAlert } from 'lucide-react';

// Status pipeline definition
const STATUS_COLUMNS = [
  { key: 'gemeldet', label: 'Gemeldet', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', border: 'border-slate-200' },
  { key: 'in_pruefung', label: 'In Prüfung', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', border: 'border-blue-200' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' },
  { key: 'behoben', label: 'Behoben', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', border: 'border-emerald-200' },
  { key: 'abgelehnt', label: 'Abgelehnt', color: 'bg-red-100 text-red-700', dot: 'bg-red-400', border: 'border-red-200' },
  { key: 'zurueckgestellt', label: 'Zurückgestellt', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400', border: 'border-purple-200' },
] as const;

type StatusKey = typeof STATUS_COLUMNS[number]['key'];

const DRINGLICHKEIT_BADGE: Record<string, string> = {
  niedrig: 'bg-slate-100 text-slate-600',
  mittel: 'bg-yellow-100 text-yellow-700',
  hoch: 'bg-orange-100 text-orange-700',
  sehr_hoch: 'bg-red-100 text-red-700',
};

const DRINGLICHKEIT_LABEL: Record<string, string> = {
  niedrig: 'Niedrig',
  mittel: 'Mittel',
  hoch: 'Hoch',
  sehr_hoch: 'Sehr hoch',
};

export default function DashboardOverview() {
  const {
    schadensmeldung, schadenskategorien, bearbeitungsstatus,
    schadensmeldungMap, schadenskategorienMap,
    loading, error, fetchAll,
  } = useDashboardData();

  // All hooks before early returns
  const [createMeldungOpen, setCreateMeldungOpen] = useState(false);
  const [editMeldung, setEditMeldung] = useState<Schadensmeldung | null>(null);
  const [createStatusFor, setCreateStatusFor] = useState<{ meldungId: string; statusKey: StatusKey } | null>(null);
  const [editStatus, setEditStatus] = useState<Bearbeitungsstatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'meldung' | 'status'; id: string } | null>(null);
  const [selectedMeldungId, setSelectedMeldungId] = useState<string | null>(null);
  const [filterDringlichkeit, setFilterDringlichkeit] = useState<string>('all');

  const enrichedSchadensmeldung = useMemo(
    () => enrichSchadensmeldung(schadensmeldung, { schadenskategorienMap }),
    [schadensmeldung, schadenskategorienMap]
  );

  const enrichedBearbeitungsstatus = useMemo(
    () => enrichBearbeitungsstatus(bearbeitungsstatus, { schadensmeldungMap }),
    [bearbeitungsstatus, schadensmeldungMap]
  );

  // Map meldung → latest status
  const latestStatusByMeldung = useMemo(() => {
    const map = new Map<string, Bearbeitungsstatus>();
    for (const bs of bearbeitungsstatus) {
      const refId = extractRecordId(bs.fields.schadensmeldung_referenz);
      if (!refId) continue;
      const existing = map.get(refId);
      if (!existing || (bs.fields.statusdatum ?? '') > (existing.fields.statusdatum ?? '')) {
        map.set(refId, bs);
      }
    }
    return map;
  }, [bearbeitungsstatus]);

  // Filtered meldungen
  const filteredMeldungen = useMemo(() => {
    let list = enrichedSchadensmeldung;
    if (filterDringlichkeit !== 'all') {
      list = list.filter(m => m.fields.dringlichkeit?.key === filterDringlichkeit);
    }
    return list;
  }, [enrichedSchadensmeldung, filterDringlichkeit]);

  // Kanban columns: meldungen grouped by latest status
  const kanbanColumns = useMemo(() => {
    return STATUS_COLUMNS.map(col => {
      const cards = filteredMeldungen.filter(m => {
        const status = latestStatusByMeldung.get(m.record_id);
        const statusKey = status?.fields.aktueller_status?.key ?? 'gemeldet';
        return statusKey === col.key;
      });
      return { ...col, cards };
    });
  }, [filteredMeldungen, latestStatusByMeldung]);

  // KPI stats
  const totalMeldungen = schadensmeldung.length;
  const offenCount = schadensmeldung.filter(m => {
    const s = latestStatusByMeldung.get(m.record_id);
    const k = s?.fields.aktueller_status?.key ?? 'gemeldet';
    return k !== 'behoben' && k !== 'abgelehnt';
  }).length;
  const sehrHochCount = schadensmeldung.filter(m => m.fields.dringlichkeit?.key === 'sehr_hoch').length;
  const behobeneCount = schadensmeldung.filter(m => {
    const s = latestStatusByMeldung.get(m.record_id);
    return s?.fields.aktueller_status?.key === 'behoben';
  }).length;

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'meldung') {
      await LivingAppsService.deleteSchadensmeldungEntry(deleteTarget.id);
    } else {
      await LivingAppsService.deleteBearbeitungsstatu(deleteTarget.id);
    }
    fetchAll();
    setDeleteTarget(null);
  }, [deleteTarget, fetchAll]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const selectedMeldung = selectedMeldungId
    ? enrichedSchadensmeldung.find(m => m.record_id === selectedMeldungId) ?? null
    : null;

  const selectedMeldungStatuses = selectedMeldungId
    ? bearbeitungsstatus.filter(bs => extractRecordId(bs.fields.schadensmeldung_referenz) === selectedMeldungId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schadensmeldungen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alle gemeldeten Straßenschäden im Überblick</p>
        </div>
        <Button onClick={() => setCreateMeldungOpen(true)} className="shrink-0 gap-2">
          <Plus size={16} />
          Neue Meldung
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(totalMeldungen)}
          description="Schadensmeldungen"
          icon={<MapPin size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offen"
          value={String(offenCount)}
          description="Noch nicht behoben"
          icon={<AlertCircle size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Sehr hoch"
          value={String(sehrHochCount)}
          description="Akute Gefährdung"
          icon={<TriangleAlert size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Behoben"
          value={String(behobeneCount)}
          description="Erfolgreich repariert"
          icon={<AlertTriangle size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground mr-1">Dringlichkeit:</span>
        {[{ key: 'all', label: 'Alle' }, ...LOOKUP_OPTIONS.schadensmeldung.dringlichkeit.map(o => ({ key: o.key, label: DRINGLICHKEIT_LABEL[o.key] ?? o.label }))].map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilterDringlichkeit(opt.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterDringlichkeit === opt.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-1 px-1">
        <div className="flex gap-4 min-w-max">
          {kanbanColumns.map(col => (
            <div key={col.key} className="w-72 flex-shrink-0">
              {/* Column header */}
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-xl border ${col.border} bg-card`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold">{col.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                  {col.cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[200px]">
                {col.cards.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                    <p className="text-xs text-muted-foreground">Keine Meldungen</p>
                  </div>
                )}
                {col.cards.map(meldung => {
                  const status = latestStatusByMeldung.get(meldung.record_id);
                  const dringKey = meldung.fields.dringlichkeit?.key ?? '';
                  const adresse = [meldung.fields.strassenname, meldung.fields.hausnummer].filter(Boolean).join(' ');
                  const isSelected = selectedMeldungId === meldung.record_id;

                  return (
                    <div
                      key={meldung.record_id}
                      onClick={() => setSelectedMeldungId(isSelected ? null : meldung.record_id)}
                      className={`group relative rounded-xl border bg-card p-3.5 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${
                        isSelected ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border'
                      }`}
                    >
                      {/* Dringlichkeit indicator */}
                      {dringKey && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-2 ${DRINGLICHKEIT_BADGE[dringKey] ?? 'bg-muted text-muted-foreground'}`}>
                          {dringKey === 'sehr_hoch' && <TriangleAlert size={9} />}
                          {DRINGLICHKEIT_LABEL[dringKey] ?? dringKey}
                        </span>
                      )}

                      {/* Category */}
                      {meldung.schadenskategorieName && (
                        <p className="text-xs font-semibold text-primary truncate mb-1">{meldung.schadenskategorieName}</p>
                      )}

                      {/* Address */}
                      {adresse && (
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <MapPin size={11} className="text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground font-medium truncate">{adresse}</p>
                        </div>
                      )}
                      {meldung.fields.stadt && (
                        <p className="text-xs text-muted-foreground mb-1.5 ml-[19px] truncate">
                          {[meldung.fields.postleitzahl, meldung.fields.stadt].filter(Boolean).join(' ')}
                        </p>
                      )}

                      {/* Description snippet */}
                      {meldung.fields.schadensbeschreibung && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                          {meldung.fields.schadensbeschreibung}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar size={10} />
                          <span className="text-[10px]">{formatDate(meldung.fields.meldedatum)}</span>
                        </div>
                        {(meldung.fields.melder_vorname || meldung.fields.melder_nachname) && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User size={10} />
                            <span className="text-[10px] truncate max-w-[80px]">
                              {[meldung.fields.melder_vorname, meldung.fields.melder_nachname].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons (visible on hover or selected) */}
                      <div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                          onClick={e => { e.stopPropagation(); setEditMeldung(meldung); }}
                          className="p-1 rounded-md bg-background border border-border hover:bg-accent transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'meldung', id: meldung.record_id }); }}
                          className="p-1 rounded-md bg-background border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Status update shortcut */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setCreateStatusFor({ meldungId: meldung.record_id, statusKey: col.key });
                        }}
                        className={`w-full mt-2 flex items-center justify-center gap-1 text-[10px] font-medium py-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <Plus size={10} />
                        Status-Eintrag
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel for selected Meldung */}
      {selectedMeldung && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-base">
                {selectedMeldung.schadenskategorieName || 'Schadensmeldung'}
                {' — '}
                {[selectedMeldung.fields.strassenname, selectedMeldung.fields.hausnummer].filter(Boolean).join(' ')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {[selectedMeldung.fields.postleitzahl, selectedMeldung.fields.stadt].filter(Boolean).join(' ')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEditMeldung(selectedMeldung)}>
                <Pencil size={13} className="mr-1" /> Bearbeiten
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateStatusFor({ meldungId: selectedMeldung.record_id, statusKey: 'gemeldet' })}
              >
                <Plus size={13} className="mr-1" /> Status hinzufügen
              </Button>
            </div>
          </div>

          {selectedMeldung.fields.schadensbeschreibung && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-3">
              {selectedMeldung.fields.schadensbeschreibung}
            </p>
          )}

          {/* Status history */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bearbeitungsverlauf</h3>
            {selectedMeldungStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Noch keine Status-Einträge.</p>
            ) : (
              <div className="space-y-2">
                {[...selectedMeldungStatuses]
                  .sort((a, b) => (b.fields.statusdatum ?? '').localeCompare(a.fields.statusdatum ?? ''))
                  .map(bs => {
                    const statusCol = STATUS_COLUMNS.find(c => c.key === bs.fields.aktueller_status?.key);
                    return (
                      <div key={bs.record_id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 group">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusCol?.dot ?? 'bg-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCol?.color ?? 'bg-muted text-muted-foreground'}`}>
                              {bs.fields.aktueller_status?.label ?? bs.fields.aktueller_status?.key ?? '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(bs.fields.statusdatum)}</span>
                            {(bs.fields.bearbeiter_vorname || bs.fields.bearbeiter_nachname) && (
                              <span className="text-xs text-muted-foreground">
                                — {[bs.fields.bearbeiter_vorname, bs.fields.bearbeiter_nachname].filter(Boolean).join(' ')}
                              </span>
                            )}
                          </div>
                          {bs.fields.bearbeitungskommentar && (
                            <p className="text-xs text-muted-foreground mt-1">{bs.fields.bearbeitungskommentar}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditStatus(bs)}
                            className="p-1 rounded hover:bg-accent transition-colors"
                          >
                            <Pencil size={12} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'status', id: bs.record_id })}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={12} className="text-destructive" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SchadensmeldungDialog
        open={createMeldungOpen}
        onClose={() => setCreateMeldungOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createSchadensmeldungEntry(fields);
          fetchAll();
        }}
        schadenskategorienList={schadenskategorien}
        enablePhotoScan={AI_PHOTO_SCAN['Schadensmeldung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schadensmeldung']}
      />

      <SchadensmeldungDialog
        open={!!editMeldung}
        onClose={() => setEditMeldung(null)}
        onSubmit={async (fields) => {
          if (!editMeldung) return;
          await LivingAppsService.updateSchadensmeldungEntry(editMeldung.record_id, fields);
          fetchAll();
        }}
        defaultValues={editMeldung?.fields}
        schadenskategorienList={schadenskategorien}
        enablePhotoScan={AI_PHOTO_SCAN['Schadensmeldung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schadensmeldung']}
      />

      <BearbeitungsstatusDialog
        open={!!createStatusFor}
        onClose={() => setCreateStatusFor(null)}
        onSubmit={async (fields) => {
          await LivingAppsService.createBearbeitungsstatu({
            ...fields,
            schadensmeldung_referenz: createStatusFor
              ? createRecordUrl(APP_IDS.SCHADENSMELDUNG, createStatusFor.meldungId)
              : undefined,
          });
          fetchAll();
        }}
        defaultValues={createStatusFor ? {
          schadensmeldung_referenz: createRecordUrl(APP_IDS.SCHADENSMELDUNG, createStatusFor.meldungId),
          aktueller_status: createStatusFor.statusKey as any,
        } : undefined}
        schadensmeldungList={schadensmeldung}
        enablePhotoScan={AI_PHOTO_SCAN['Bearbeitungsstatus']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bearbeitungsstatus']}
      />

      <BearbeitungsstatusDialog
        open={!!editStatus}
        onClose={() => setEditStatus(null)}
        onSubmit={async (fields) => {
          if (!editStatus) return;
          await LivingAppsService.updateBearbeitungsstatu(editStatus.record_id, fields);
          fetchAll();
        }}
        defaultValues={editStatus?.fields}
        schadensmeldungList={schadensmeldung}
        enablePhotoScan={AI_PHOTO_SCAN['Bearbeitungsstatus']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bearbeitungsstatus']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={
          deleteTarget?.type === 'meldung'
            ? 'Soll diese Schadensmeldung wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.'
            : 'Soll dieser Status-Eintrag wirklich gelöscht werden?'
        }
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
