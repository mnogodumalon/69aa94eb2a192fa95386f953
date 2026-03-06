import type { EnrichedBearbeitungsstatus, EnrichedSchadensmeldung } from '@/types/enriched';
import type { Bearbeitungsstatus, Schadenskategorien, Schadensmeldung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SchadensmeldungMaps {
  schadenskategorienMap: Map<string, Schadenskategorien>;
}

export function enrichSchadensmeldung(
  schadensmeldung: Schadensmeldung[],
  maps: SchadensmeldungMaps
): EnrichedSchadensmeldung[] {
  return schadensmeldung.map(r => ({
    ...r,
    schadenskategorieName: resolveDisplay(r.fields.schadenskategorie, maps.schadenskategorienMap, 'kategoriename'),
  }));
}

interface BearbeitungsstatusMaps {
  schadensmeldungMap: Map<string, Schadensmeldung>;
}

export function enrichBearbeitungsstatus(
  bearbeitungsstatus: Bearbeitungsstatus[],
  maps: BearbeitungsstatusMaps
): EnrichedBearbeitungsstatus[] {
  return bearbeitungsstatus.map(r => ({
    ...r,
    schadensmeldung_referenzName: resolveDisplay(r.fields.schadensmeldung_referenz, maps.schadensmeldungMap, 'strassenname'),
  }));
}
