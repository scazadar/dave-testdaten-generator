/**
 * TypeScript-Abbilder der DAVe-Backend-DTOs, soweit sie zum Anlegen einer
 * Zählung mit Zeitintervallen benötigt werden.
 *
 * Quellen (dave-backend):
 *   domain/dtos/bearbeiten/BearbeiteZaehlstelleDTO.java
 *   domain/dtos/bearbeiten/BearbeiteZaehlungDTO.java
 *   domain/dtos/bearbeiten/Bearbeite{Verkehrsbeziehung,Laengsverkehr,Querungsverkehr,Knotenarm}DTO.java
 *   domain/dtos/ZeitintervallDTO.java
 *   domain/dtos/bearbeiten/{UpdateStatusDTO,BackendIdDTO}.java
 */

/**
 * Geokoordinate (Elasticsearch GeoPoint). Im DAVe-Wire-Format sind lat/lon
 * Strings (siehe dave-admin-portal frontend/src/types/common/GeoPoint.ts).
 */
export interface GeoPoint {
  lat: string;
  lon: string;
}

/** Ein Zeitintervall mit Start/Ende (HH:MM) und den sieben Fahrzeugkategorien. */
export interface ZeitintervallDTO {
  startUhrzeit: string;
  endeUhrzeit: string;
  pkw?: number;
  lkw?: number;
  lastzuege?: number;
  busse?: number;
  kraftraeder?: number;
  fahrradfahrer?: number;
  fussgaenger?: number;
}

/** Verkehrsbeziehung (Kreuzung: von→nach), für die meisten Zählarten. */
export interface VerkehrsbeziehungDTO {
  isKreuzung: boolean;
  von?: number;
  nach?: number;
  strassenseite?: string;
  zeitintervalle: ZeitintervallDTO[];
}

/** Längsverkehr (Zählart FJS): je Knotenarm, Bewegungsrichtung und Straßenseite. */
export interface LaengsverkehrDTO {
  knotenarm: number;
  richtung: string; // Bewegungsrichtung EIN | AUS
  strassenseite?: string; // Himmelsrichtung
  zeitintervalle: ZeitintervallDTO[];
}

/** Querungsverkehr (Zählart QU): je Knotenarm und Himmelsrichtung. */
export interface QuerungsverkehrDTO {
  knotenarm: number;
  richtung?: string; // Himmelsrichtung
  zeitintervalle: ZeitintervallDTO[];
}

export interface KnotenarmDTO {
  nummer: number;
  /** Achtung: Feldname im Backend-DTO ist großgeschrieben. */
  Strassenname: string;
}

export interface BearbeiteZaehlungDTO {
  datum: string; // YYYY-MM-DD
  zaehlart: string;
  status: string;
  zaehldauer: string;
  zaehlIntervall: number;
  kreisverkehr: boolean;
  sonderzaehlung: boolean;
  kreuzungsname?: string;
  dienstleisterkennung?: string;
  lat: number;
  lng: number;
  punkt: GeoPoint;
  knotenarme: KnotenarmDTO[];
  verkehrsbeziehungen?: VerkehrsbeziehungDTO[];
  laengsverkehr?: LaengsverkehrDTO[];
  querungsverkehr?: QuerungsverkehrDTO[];
}

export interface BearbeiteZaehlstelleDTO {
  nummer: string;
  stadtbezirkNummer: number;
  stadtbezirk: string;
  lat: number;
  lng: number;
  punkt: GeoPoint;
  sichtbarDatenportal: boolean;
}

export interface UpdateStatusDTO {
  zaehlungId: string;
  status: string;
  dienstleisterkennung?: string;
}

export interface BackendIdDTO {
  id: string;
}

/** Status-Werte aus domain/enums/Status.java. */
export const Status = {
  CREATED: "CREATED",
  INSTRUCTED: "INSTRUCTED",
  COUNTING: "COUNTING",
  ACCOMPLISHED: "ACCOMPLISHED",
  CORRECTION: "CORRECTION",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
