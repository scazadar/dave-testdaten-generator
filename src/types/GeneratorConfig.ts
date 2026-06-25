import type Zaehlart from "@/types/Zaehlart";

/** Die sieben Fahrzeugkategorien einer Zähldaten-CSV (in Spaltenreihenfolge). */
export const KATEGORIEN = [
  "pkw",
  "lkw",
  "lz",
  "bus",
  "krad",
  "rad",
  "fuss",
] as const;

export type Kategorie = (typeof KATEGORIEN)[number];

/** Anzeigename + CSV-Spaltenkopf je Kategorie. */
export const KATEGORIE_LABELS: Record<
  Kategorie,
  { csv: string; label: string }
> = {
  pkw: { csv: "Pkw", label: "Pkw (Auto)" },
  lkw: { csv: "Lkw", label: "Lkw" },
  lz: { csv: "Lz", label: "Lastzüge" },
  bus: { csv: "Bus", label: "Bus" },
  krad: { csv: "Krad", label: "Krad (Motorrad)" },
  rad: { csv: "Rad", label: "Rad (Fahrrad)" },
  fuss: { csv: "Fuss", label: "Fuß (Fußgänger)" },
};

/** Art, wie die Werte je Intervall einer Kategorie erzeugt werden. */
export type ValueMode = "aus" | "fest" | "zufall" | "kurve";

export const VALUE_MODE_LABELS: Record<ValueMode, string> = {
  aus: "Nicht gezählt (leer)",
  fest: "Fester Wert",
  zufall: "Zufall (min–max)",
  kurve: "Tageskurve (Spitzenwert)",
};

/** Konfiguration einer einzelnen Fahrzeugkategorie. */
export interface KategorieConfig {
  mode: ValueMode;
  fest: number;
  min: number;
  max: number;
  peak: number;
}

/**
 * Ein Segment beschreibt eine Kombination der Dimensionsfelder
 * (nach / Strassenseite / Richtung). Für jedes Segment werden die
 * Intervallzeilen des gewählten Zeitbereichs erzeugt.
 */
export interface Segment {
  /** Zielknotenarm ("" wenn nicht relevant). */
  nach: string;
  /** Himmelsrichtung der Straßenseite ("" wenn nicht relevant). */
  strassenseite: string;
  /** Bewegungs-/Himmelsrichtung ("" wenn nicht relevant). */
  richtung: string;
}

/** Gesamte Konfiguration einer zu erzeugenden CSV-Datei. */
export interface GeneratorConfig {
  zaehlstellennummer: string;
  zaehlart: Zaehlart;
  datum: string; // YYYY-MM-DD
  knotenarmnummer: string;
  vonIntervall: number; // 1..96
  bisIntervall: number; // 1..96
  segmente: Segment[];
  kategorien: Record<Kategorie, KategorieConfig>;
  /** UTF-8 BOM voranstellen (manche Importe erwarten dies). */
  bom: boolean;
}
