import type { GeneratorConfig, Segment } from "@/types/GeneratorConfig";

import { KATEGORIEN, KATEGORIE_LABELS } from "@/types/GeneratorConfig";
import { feldRegeln, zaehlartHeaderValue } from "@/types/Zaehlart";
import { valueForInterval } from "@/util/valueProfiles";

const SEP = ";";
const EOL = "\n";
const BOM = "﻿";

/** Spaltenkopf (Zeile 3) gemäß Upload-Spezifikation. */
export const SPALTEN_HEADER = [
  "Intervallnummer",
  "nach",
  "Strassenseite",
  "Richtung",
  ...KATEGORIEN.map((k) => KATEGORIE_LABELS[k].csv),
].join(SEP);

/**
 * Erzeugt den Dateinamen gemäß Namenskonvention:
 *   <ZAEHLSTELLENNUMMER>_<DATUM>_Knotenarm_<KNOTENARMNUMMER>.csv
 */
export function buildFileName(config: GeneratorConfig): string {
  return `${config.zaehlstellennummer}_${config.datum}_Knotenarm_${config.knotenarmnummer}.csv`;
}

/**
 * Reduziert ein Segment auf die für die gewählte Zählart erlaubten Felder.
 * Nicht relevante Felder werden – wie in der Spezifikation gefordert – leer
 * gelassen, auch wenn im UI versehentlich etwas gesetzt wurde.
 */
function effektivesSegment(config: GeneratorConfig, segment: Segment): Segment {
  const regeln = feldRegeln(config.zaehlart);
  return {
    nach: regeln.nach ? segment.nach.trim() : "",
    strassenseite: regeln.strassenseite ? segment.strassenseite.trim() : "",
    richtung: regeln.richtung === "keine" ? "" : segment.richtung.trim(),
  };
}

/** Baut die beiden Metainformations-Headerzeilen (11 Spalten). */
function buildMetaHeader(config: GeneratorConfig): string[] {
  const leer = SEP.repeat(7); // 11 Spalten => 7 leere Trennzeichen am Ende
  const zeile1 = `Zählstellennummer${SEP}Zählart${SEP}Datum${SEP}Knotenarmnummer${leer}`;
  const zeile2 =
    [
      config.zaehlstellennummer,
      zaehlartHeaderValue(config.zaehlart),
      config.datum,
      config.knotenarmnummer,
    ].join(SEP) + leer;
  return [zeile1, zeile2];
}

/** Erzeugt die Datenzeilen eines Segments für den gewählten Zeitbereich. */
function buildSegmentRows(config: GeneratorConfig, segment: Segment): string[] {
  const seg = effektivesSegment(config, segment);
  const von = Math.min(config.vonIntervall, config.bisIntervall);
  const bis = Math.max(config.vonIntervall, config.bisIntervall);
  const rows: string[] = [];
  for (let nr = von; nr <= bis; nr++) {
    const werte = KATEGORIEN.map((k) =>
      valueForInterval(config.kategorien[k], nr)
    );
    rows.push(
      [String(nr), seg.nach, seg.strassenseite, seg.richtung, ...werte].join(
        SEP
      )
    );
  }
  return rows;
}

/**
 * Erzeugt den vollständigen CSV-Inhalt (UTF-8, Semikolon-getrennt, LF).
 */
export function generateCsv(config: GeneratorConfig): string {
  const segmente = config.segmente.length > 0 ? config.segmente : [emptySegment()];
  const lines: string[] = [
    ...buildMetaHeader(config),
    SPALTEN_HEADER,
    ...segmente.flatMap((seg) => buildSegmentRows(config, seg)),
  ];
  const content = lines.join(EOL) + EOL;
  return config.bom ? BOM + content : content;
}

export function emptySegment(): Segment {
  return { nach: "", strassenseite: "", richtung: "" };
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Prüft die Pflichtangaben vor dem Erzeugen der Datei. */
export function validateConfig(config: GeneratorConfig): ValidationResult {
  const errors: string[] = [];
  if (!config.zaehlstellennummer.trim()) {
    errors.push("Zählstellennummer ist erforderlich.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.datum)) {
    errors.push("Datum muss im Format YYYY-MM-DD vorliegen.");
  }
  const ka = Number(config.knotenarmnummer);
  if (!Number.isInteger(ka) || ka < 1 || ka > 8) {
    errors.push("Knotenarmnummer muss zwischen 1 und 8 liegen.");
  }
  const regeln = feldRegeln(config.zaehlart);
  config.segmente.forEach((seg, idx) => {
    const n = idx + 1;
    if (regeln.nach && !seg.nach.trim()) {
      errors.push(`Segment ${n}: Zielknotenarm ("nach") ist erforderlich.`);
    }
    if (regeln.strassenseite && !seg.strassenseite.trim()) {
      errors.push(`Segment ${n}: Straßenseite ist erforderlich.`);
    }
    if (regeln.richtung !== "keine" && !seg.richtung.trim()) {
      errors.push(`Segment ${n}: Richtung ist erforderlich.`);
    }
  });
  const allInactive = KATEGORIEN.every(
    (k) => config.kategorien[k].mode === "aus"
  );
  if (allInactive) {
    errors.push(
      "Mindestens eine Fahrzeugkategorie muss gezählt werden (nicht alle auf „Nicht gezählt“)."
    );
  }
  return { ok: errors.length === 0, errors };
}
