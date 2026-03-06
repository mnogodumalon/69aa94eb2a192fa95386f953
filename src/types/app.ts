// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Schadensmeldung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    standort?: GeoLocation; // { lat, long, info }
    strassenname?: string;
    hausnummer?: string;
    postleitzahl?: string;
    stadt?: string;
    schadenskategorie?: string; // applookup -> URL zu 'Schadenskategorien' Record
    schadensbeschreibung?: string;
    dringlichkeit?: LookupValue;
    fotos?: string;
    melder_vorname?: string;
    melder_nachname?: string;
    melder_email?: string;
    melder_telefon?: string;
    meldedatum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Schadenskategorien {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kategoriename?: string;
    beschreibung?: string;
    prioritaetsstufe?: LookupValue;
  };
}

export interface Bearbeitungsstatus {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schadensmeldung_referenz?: string; // applookup -> URL zu 'Schadensmeldung' Record
    aktueller_status?: LookupValue;
    statusdatum?: string; // Format: YYYY-MM-DD oder ISO String
    bearbeitungskommentar?: string;
    bearbeiter_vorname?: string;
    bearbeiter_nachname?: string;
  };
}

export const APP_IDS = {
  SCHADENSMELDUNG: '69aa94d22b55ea916c62c4ee',
  SCHADENSKATEGORIEN: '69aa94cd14f0020132b9f814',
  BEARBEITUNGSSTATUS: '69aa94d3f77fafbb89eff8ad',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  schadensmeldung: {
    dringlichkeit: [{ key: "niedrig", label: "Niedrig - keine unmittelbare Gefahr" }, { key: "mittel", label: "Mittel - sollte zeitnah behoben werden" }, { key: "hoch", label: "Hoch - stellt eine Gefahr dar" }, { key: "sehr_hoch", label: "Sehr hoch - akute Gefährdung" }],
  },
  schadenskategorien: {
    prioritaetsstufe: [{ key: "niedrig", label: "Niedrig" }, { key: "mittel", label: "Mittel" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
  },
  bearbeitungsstatus: {
    aktueller_status: [{ key: "gemeldet", label: "Gemeldet - noch nicht bearbeitet" }, { key: "in_pruefung", label: "In Prüfung - wird begutachtet" }, { key: "in_bearbeitung", label: "In Bearbeitung - Reparatur läuft" }, { key: "behoben", label: "Behoben - Schaden wurde repariert" }, { key: "abgelehnt", label: "Abgelehnt - keine Maßnahme erforderlich" }, { key: "zurueckgestellt", label: "Zurückgestellt - wird später bearbeitet" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'schadensmeldung': {
    'standort': 'geo',
    'strassenname': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'stadt': 'string/text',
    'schadenskategorie': 'applookup/select',
    'schadensbeschreibung': 'string/textarea',
    'dringlichkeit': 'lookup/radio',
    'fotos': 'file',
    'melder_vorname': 'string/text',
    'melder_nachname': 'string/text',
    'melder_email': 'string/email',
    'melder_telefon': 'string/tel',
    'meldedatum': 'date/date',
  },
  'schadenskategorien': {
    'kategoriename': 'string/text',
    'beschreibung': 'string/textarea',
    'prioritaetsstufe': 'lookup/select',
  },
  'bearbeitungsstatus': {
    'schadensmeldung_referenz': 'applookup/select',
    'aktueller_status': 'lookup/select',
    'statusdatum': 'date/date',
    'bearbeitungskommentar': 'string/textarea',
    'bearbeiter_vorname': 'string/text',
    'bearbeiter_nachname': 'string/text',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateSchadensmeldung = StripLookup<Schadensmeldung['fields']>;
export type CreateSchadenskategorien = StripLookup<Schadenskategorien['fields']>;
export type CreateBearbeitungsstatus = StripLookup<Bearbeitungsstatus['fields']>;