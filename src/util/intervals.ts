/**
 * Hilfsfunktionen rund um die 96 15-minütigen Tagesintervalle.
 * Quelle: dave/docs/src/de/documentation-csv-for-upload.md (Abschnitt "Intervallnummer").
 */

export const INTERVALLE_PRO_TAG = 96;

/** Startuhrzeit (HH:MM) eines Intervalls (1..96). */
export function intervallStart(nummer: number): string {
  const minutes = (nummer - 1) * 15;
  return formatTime(minutes);
}

/** Endeuhrzeit (HH:MM) eines Intervalls (1..96). */
export function intervallEnde(nummer: number): string {
  const minutes = nummer * 15;
  return formatTime(minutes % (24 * 60));
}

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Anschauliches Label für ein Intervall, z. B. "25 (06:00–06:15)". */
export function intervallLabel(nummer: number): string {
  return `${nummer} (${intervallStart(nummer)}–${intervallEnde(nummer)})`;
}

export interface Zeitbereich {
  von: number;
  bis: number;
}

/**
 * Vordefinierte Zähldauer-Presets. Die Zähltage in DAVe beginnen
 * üblicherweise um 06:00 Uhr (Intervall 25).
 */
export const ZEITBEREICH_PRESETS: { titel: string; bereich: Zeitbereich }[] = [
  { titel: "24h (00:00–24:00)", bereich: { von: 1, bis: 96 } },
  { titel: "16h (06:00–22:00)", bereich: { von: 25, bis: 88 } },
  { titel: "13h (06:00–19:00)", bereich: { von: 25, bis: 76 } },
  { titel: "Vormittag 4h (06:00–10:00)", bereich: { von: 25, bis: 40 } },
];
