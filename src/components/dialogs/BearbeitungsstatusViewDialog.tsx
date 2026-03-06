import type { Bearbeitungsstatus, Schadensmeldung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface BearbeitungsstatusViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Bearbeitungsstatus | null;
  onEdit: (record: Bearbeitungsstatus) => void;
  schadensmeldungList: Schadensmeldung[];
}

export function BearbeitungsstatusViewDialog({ open, onClose, record, onEdit, schadensmeldungList }: BearbeitungsstatusViewDialogProps) {
  function getSchadensmeldungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return schadensmeldungList.find(r => r.record_id === id)?.fields.strassenname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bearbeitungsstatus anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schadensmeldung</Label>
            <p className="text-sm">{getSchadensmeldungDisplayName(record.fields.schadensmeldung_referenz)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aktueller Status</Label>
            <Badge variant="secondary">{record.fields.aktueller_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Statusdatum</Label>
            <p className="text-sm">{formatDate(record.fields.statusdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kommentar zur Bearbeitung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bearbeitungskommentar ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bearbeiter Vorname</Label>
            <p className="text-sm">{record.fields.bearbeiter_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bearbeiter Nachname</Label>
            <p className="text-sm">{record.fields.bearbeiter_nachname ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}