import type { KategorieConfig } from "@/types/GeneratorConfig";

import { INTERVALLE_PRO_TAG } from "@/util/intervals";

/**
 * Normierte Tageskurve (Gewichte 0..1) für die 96 Intervalle eines Tages.
 * Modelliert einen typischen Verkehrsverlauf mit Morgen- und Abendspitze
 * sowie einem Mittagsplateau. Index 0 entspricht Intervall 1.
 */
export function buildDayCurve(): number[] {
  const peaks = [
    { center: 33, height: 1.0, width: 6 }, // ~08:00 Morgenspitze
    { center: 69, height: 0.95, width: 7 }, // ~17:00 Abendspitze
    { center: 50, height: 0.55, width: 12 }, // Mittagsplateau
  ];
  const base = 0.04;
  const raw: number[] = [];
  for (let i = 1; i <= INTERVALLE_PRO_TAG; i++) {
    let v = base;
    for (const p of peaks) {
      v += p.height * Math.exp(-((i - p.center) ** 2) / (2 * p.width ** 2));
    }
    raw.push(v);
  }
  const max = Math.max(...raw);
  return raw.map((v) => v / max);
}

const DAY_CURVE = buildDayCurve();

/**
 * Liefert eine Zufallszahl aus dem geschlossenen Intervall [min, max].
 * Tausch von min/max wird toleriert.
 */
function randomInt(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/**
 * Erzeugt den Zellwert einer Kategorie für ein konkretes Intervall (1..96).
 * Gibt den leeren String zurück, wenn die Kategorie nicht gezählt wird ("aus").
 */
export function valueForInterval(
  config: KategorieConfig,
  intervallNummer: number
): string {
  switch (config.mode) {
    case "aus":
      return "";
    case "fest":
      return String(Math.max(0, Math.round(config.fest)));
    case "zufall":
      return String(Math.max(0, randomInt(config.min, config.max)));
    case "kurve": {
      const weight = DAY_CURVE[intervallNummer - 1] ?? 0;
      return String(Math.max(0, Math.round(weight * config.peak)));
    }
    default:
      return "";
  }
}
