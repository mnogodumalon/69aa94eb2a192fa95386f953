// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS, FIELD_TYPES } from '@/types/app';
import type { Schadensmeldung, Schadenskategorien, Bearbeitungsstatus } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

/** Normalize fields for API writes: strip lookup objects to keys, fix date formats. */
export function cleanFieldsForApi(
  fields: Record<string, unknown>,
  entityKey: string
): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...fields };
  for (const [k, v] of Object.entries(clean)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'key' in v) clean[k] = (v as any).key;
    if (Array.isArray(v)) clean[k] = v.map((item: any) => item && typeof item === 'object' && 'key' in item ? item.key : item);
  }
  const types = FIELD_TYPES[entityKey];
  if (types) {
    for (const [k, ft] of Object.entries(types)) {
      const val = clean[k];
      if (typeof val !== 'string' || !val) continue;
      if (ft === 'date/datetimeminute') clean[k] = val.slice(0, 16);
      else if (ft === 'date/date') clean[k] = val.slice(0, 10);
    }
  }
  return clean;
}

export class LivingAppsService {
  // --- SCHADENSMELDUNG ---
  static async getSchadensmeldung(): Promise<Schadensmeldung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHADENSMELDUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Schadensmeldung[];
    return enrichLookupFields(records, 'schadensmeldung');
  }
  static async getSchadensmeldungEntry(id: string): Promise<Schadensmeldung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHADENSMELDUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Schadensmeldung;
    return enrichLookupFields([record], 'schadensmeldung')[0];
  }
  static async createSchadensmeldungEntry(fields: Schadensmeldung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHADENSMELDUNG}/records`, { fields });
  }
  static async updateSchadensmeldungEntry(id: string, fields: Partial<Schadensmeldung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHADENSMELDUNG}/records/${id}`, { fields });
  }
  static async deleteSchadensmeldungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHADENSMELDUNG}/records/${id}`);
  }

  // --- SCHADENSKATEGORIEN ---
  static async getSchadenskategorien(): Promise<Schadenskategorien[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHADENSKATEGORIEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Schadenskategorien[];
    return enrichLookupFields(records, 'schadenskategorien');
  }
  static async getSchadenskategorienEntry(id: string): Promise<Schadenskategorien | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHADENSKATEGORIEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Schadenskategorien;
    return enrichLookupFields([record], 'schadenskategorien')[0];
  }
  static async createSchadenskategorienEntry(fields: Schadenskategorien['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHADENSKATEGORIEN}/records`, { fields });
  }
  static async updateSchadenskategorienEntry(id: string, fields: Partial<Schadenskategorien['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHADENSKATEGORIEN}/records/${id}`, { fields });
  }
  static async deleteSchadenskategorienEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHADENSKATEGORIEN}/records/${id}`);
  }

  // --- BEARBEITUNGSSTATUS ---
  static async getBearbeitungsstatus(): Promise<Bearbeitungsstatus[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.BEARBEITUNGSSTATUS}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Bearbeitungsstatus[];
    return enrichLookupFields(records, 'bearbeitungsstatus');
  }
  static async getBearbeitungsstatu(id: string): Promise<Bearbeitungsstatus | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.BEARBEITUNGSSTATUS}/records/${id}`);
    const record = { record_id: data.id, ...data } as Bearbeitungsstatus;
    return enrichLookupFields([record], 'bearbeitungsstatus')[0];
  }
  static async createBearbeitungsstatu(fields: Bearbeitungsstatus['fields']) {
    return callApi('POST', `/apps/${APP_IDS.BEARBEITUNGSSTATUS}/records`, { fields });
  }
  static async updateBearbeitungsstatu(id: string, fields: Partial<Bearbeitungsstatus['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.BEARBEITUNGSSTATUS}/records/${id}`, { fields });
  }
  static async deleteBearbeitungsstatu(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.BEARBEITUNGSSTATUS}/records/${id}`);
  }

}