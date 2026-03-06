import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Schadensmeldung, Schadenskategorien, Bearbeitungsstatus } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [schadensmeldung, setSchadensmeldung] = useState<Schadensmeldung[]>([]);
  const [schadenskategorien, setSchadenskategorien] = useState<Schadenskategorien[]>([]);
  const [bearbeitungsstatus, setBearbeitungsstatus] = useState<Bearbeitungsstatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [schadensmeldungData, schadenskategorienData, bearbeitungsstatusData] = await Promise.all([
        LivingAppsService.getSchadensmeldung(),
        LivingAppsService.getSchadenskategorien(),
        LivingAppsService.getBearbeitungsstatus(),
      ]);
      setSchadensmeldung(schadensmeldungData);
      setSchadenskategorien(schadenskategorienData);
      setBearbeitungsstatus(bearbeitungsstatusData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const schadensmeldungMap = useMemo(() => {
    const m = new Map<string, Schadensmeldung>();
    schadensmeldung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schadensmeldung]);

  const schadenskategorienMap = useMemo(() => {
    const m = new Map<string, Schadenskategorien>();
    schadenskategorien.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schadenskategorien]);

  return { schadensmeldung, setSchadensmeldung, schadenskategorien, setSchadenskategorien, bearbeitungsstatus, setBearbeitungsstatus, loading, error, fetchAll, schadensmeldungMap, schadenskategorienMap };
}