/**
 * Wandelt die Generator-Konfiguration in die DAVe-Backend-DTOs um, die zum
 * Anlegen einer Zählung mit Zeitintervallen nötig sind.
 *
 * Die fachliche Zuordnung der Dimensionsfelder (nach / Strassenseite / Richtung)
 * je Zählart folgt denselben Regeln wie die CSV-Erzeugung (siehe
 * {@link feldRegeln}) und dem Upload-Mapping des Selfservice-Portals
 * (ZaehlungDialog.vue → transformCsvDataToVerkehrsbeziehung).
 */
import type { GeneratorConfig, Kategorie } from "@/types/GeneratorConfig";
import type {
  BearbeiteZaehlstelleDTO,
  BearbeiteZaehlungDTO,
  GeoPoint,
  KnotenarmDTO,
  LaengsverkehrDTO,
  QuerungsverkehrDTO,
  VerkehrsbeziehungDTO,
  ZeitintervallDTO,
} from "@/types/dave";

import { Status } from "@/types/dave";
import { KATEGORIEN } from "@/types/GeneratorConfig";
import Zaehlart, { feldRegeln } from "@/types/Zaehlart";
import { valueForInterval } from "@/util/valueProfiles";

/** Default-Koordinate (Stadtzentrum München) für angelegte Testdaten. */
const DEFAULT_LAT = 48.137154;
const DEFAULT_LNG = 11.576124;
const DEFAULT_STADTBEZIRK_NUMMER = 1;
const DEFAULT_STADTBEZIRK = "Altstadt-Lehel";

/**
 * Dienstleisterkennung der angelegten Testzählungen. Bewusst LEER: Das
 * Selfservice-Portal zeigt einem Dienstleister nur Zählungen, deren
 * `dienstleisterkennung` dem angemeldeten Benutzernamen entspricht. Im
 * `no-security`-Profil des Backends ist dieser Name leer (kein JWT), daher muss
 * auch die Kennung leer sein, damit die Zählung im Selfservice-Portal erscheint.
 */
export const DIENSTLEISTERKENNUNG = "";

/** Volltagszählung (96 Intervalle) – gültiger Wert des Backend-Enums Zaehldauer. */
const ZAEHLDAUER = "DAUER_24_STUNDEN";

/** Numerische (kategoriebezogene) Felder des ZeitintervallDTO. */
type ZeitintervallKategorieFeld = {
  [K in keyof ZeitintervallDTO]-?: ZeitintervallDTO[K] extends number | undefined
    ? K
    : never;
}[keyof ZeitintervallDTO];

/** Zuordnung Generator-Kategorie → Feld im ZeitintervallDTO des Backends. */
const KATEGORIE_TO_DTO: Record<Kategorie, ZeitintervallKategorieFeld> = {
  pkw: "pkw",
  lkw: "lkw",
  lz: "lastzuege",
  bus: "busse",
  krad: "kraftraeder",
  rad: "fahrradfahrer",
  fuss: "fussgaenger",
};

function geoPoint(lat: number, lng: number): GeoPoint {
  return { lat: String(lat), lon: String(lng) };
}

/** Endeuhrzeit eines Intervalls (HH:MM); Intervall 96 endet auf "24:00". */
function endeUhrzeit(nummer: number): string {
  const minutes = nummer * 15;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function startUhrzeit(nummer: number): string {
  const minutes = (nummer - 1) * 15;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Erzeugt die Zeitintervalle des konfigurierten Zeitbereichs. Nur tatsächlich
 * gezählte Kategorien (Modus ≠ "aus") werden gesetzt – analog zur CSV, in der
 * nicht gezählte Kategorien leer bleiben.
 */
function buildZeitintervalle(config: GeneratorConfig): ZeitintervallDTO[] {
  const von = Math.min(config.vonIntervall, config.bisIntervall);
  const bis = Math.max(config.vonIntervall, config.bisIntervall);
  const intervalle: ZeitintervallDTO[] = [];
  for (let nr = von; nr <= bis; nr++) {
    const intervall: ZeitintervallDTO = {
      startUhrzeit: startUhrzeit(nr),
      endeUhrzeit: endeUhrzeit(nr),
    };
    for (const k of KATEGORIEN) {
      const wert = valueForInterval(config.kategorien[k], nr);
      if (wert !== "") {
        intervall[KATEGORIE_TO_DTO[k]] = Number(wert);
      }
    }
    intervalle.push(intervall);
  }
  return intervalle;
}

/** Sammelt die beteiligten Knotenarme (eigener + alle Ziel-Knotenarme). */
function buildKnotenarme(config: GeneratorConfig): KnotenarmDTO[] {
  const nummern = new Set<number>([Number(config.knotenarmnummer)]);
  const regeln = feldRegeln(config.zaehlart);
  if (regeln.nach) {
    config.segmente.forEach((seg) => {
      const nach = Number(seg.nach);
      if (Number.isInteger(nach) && nach > 0) nummern.add(nach);
    });
  }
  return [...nummern]
    .sort((a, b) => a - b)
    .map((nummer) => ({ nummer, Strassenname: `Knotenarm ${nummer}` }));
}

/**
 * Baut die Bewegungsbeziehungen (Verkehrs-/Längs-/Querungsverkehr) inkl.
 * Zeitintervallen je Segment, abhängig von der Zählart.
 */
function buildBewegungsbeziehungen(config: GeneratorConfig): {
  verkehrsbeziehungen?: VerkehrsbeziehungDTO[];
  laengsverkehr?: LaengsverkehrDTO[];
  querungsverkehr?: QuerungsverkehrDTO[];
} {
  const von = Number(config.knotenarmnummer);

  if (config.zaehlart === Zaehlart.FJS) {
    // Längsverkehr: Knotenarm + Bewegungsrichtung (EIN/AUS) + Straßenseite
    const laengsverkehr = config.segmente.map((seg) => ({
      knotenarm: von,
      richtung: seg.richtung.trim(),
      strassenseite: seg.strassenseite.trim() || undefined,
      zeitintervalle: buildZeitintervalle(config),
    }));
    return { laengsverkehr };
  }

  if (config.zaehlart === Zaehlart.QU) {
    // Querungsverkehr: Knotenarm + Himmelsrichtung
    const querungsverkehr = config.segmente.map((seg) => ({
      knotenarm: von,
      richtung: seg.richtung.trim() || undefined,
      zeitintervalle: buildZeitintervalle(config),
    }));
    return { querungsverkehr };
  }

  // Alle übrigen Zählarten: Verkehrsbeziehung von→nach (QjS zusätzlich Straßenseite)
  const istQjs = config.zaehlart === Zaehlart.QJS;
  const verkehrsbeziehungen = config.segmente.map((seg) => ({
    isKreuzung: !istQjs,
    von,
    nach: Number(seg.nach),
    strassenseite: istQjs ? seg.strassenseite.trim() || undefined : undefined,
    zeitintervalle: buildZeitintervalle(config),
  }));
  return { verkehrsbeziehungen };
}

/** Erzeugt das DTO zum Anlegen der (Test-)Zählstelle. */
export function buildZaehlstelleDto(
  config: GeneratorConfig
): BearbeiteZaehlstelleDTO {
  return {
    nummer: config.zaehlstellennummer.trim(),
    stadtbezirkNummer: DEFAULT_STADTBEZIRK_NUMMER,
    stadtbezirk: DEFAULT_STADTBEZIRK,
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    punkt: geoPoint(DEFAULT_LAT, DEFAULT_LNG),
    sichtbarDatenportal: true,
  };
}

/**
 * Erzeugt das DTO zum Anlegen der Zählung inkl. Zeitintervallen.
 * Der Status wird direkt auf COUNTING gesetzt, sodass die Zählung sowohl im
 * Admin- als auch im Selfservice-Portal als offene Zählung erscheint.
 */
export function buildZaehlungDto(config: GeneratorConfig): BearbeiteZaehlungDTO {
  return {
    datum: config.datum,
    zaehlart: config.zaehlart,
    status: Status.COUNTING,
    zaehldauer: ZAEHLDAUER,
    zaehlIntervall: 15,
    kreisverkehr: false,
    sonderzaehlung: false,
    kreuzungsname: `Testknoten ${config.zaehlstellennummer.trim()}`,
    dienstleisterkennung: DIENSTLEISTERKENNUNG,
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    punkt: geoPoint(DEFAULT_LAT, DEFAULT_LNG),
    knotenarme: buildKnotenarme(config),
    ...buildBewegungsbeziehungen(config),
  };
}
