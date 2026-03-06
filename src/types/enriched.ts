import type { Bearbeitungsstatus, Schadensmeldung } from './app';

export type EnrichedSchadensmeldung = Schadensmeldung & {
  schadenskategorieName: string;
};

export type EnrichedBearbeitungsstatus = Bearbeitungsstatus & {
  schadensmeldung_referenzName: string;
};
