/**
 * Die in DAVe unterstützten Zählarten.
 * Quelle: dave/docs/src/de/documentation-csv-for-upload.md (Abschnitt "Zählarten")
 */
enum Zaehlart {
  /** Standardzählung – im CSV-Header bleibt das Feld "Zählart" leer */
  N = "N",
  /** Hauptverkehrsrichtung/Oberfläche/Hoch */
  H = "H",
  /** Querschnitt */
  Q = "Q",
  /** Querschnitt/Sonderzählung */
  Q_ = "Q_",
  /** Bahnschnitt */
  QB = "QB",
  /** Querschnitt/Hauptverkehrsrichtung/Oberfläche/Hoch */
  QH = "QH",
  /** Isarschnitt */
  QI = "QI",
  /** Stadtgrenzenzählung */
  QS = "QS",
  /** Querschnitt Tunnel/Unterführung/Tief */
  QT = "QT",
  /** Querschnitt Radverkehr */
  QR = "QR",
  /** Radverkehrszählung */
  R = "R",
  /** Querschnitt je Straßenseite */
  QJS = "QJS",
  /** Fuß & Rad je Straßenseite */
  FJS = "FJS",
  /** Querung */
  QU = "QU",
  /** Tunnel / Unterführung / Tief */
  T = "T",
  /** Teilknoten */
  TK = "TK",
}

export default Zaehlart;

/** Anzeigetext je Zählart. */
export const zaehlartText: Record<Zaehlart, string> = {
  [Zaehlart.N]: "Standardzählung",
  [Zaehlart.H]: "Hauptverkehrsrichtung/Oberfläche/Hoch",
  [Zaehlart.Q]: "Querschnitt",
  [Zaehlart.Q_]: "Querschnitt/Sonderzählung",
  [Zaehlart.QB]: "Bahnschnitt",
  [Zaehlart.QH]: "Querschnitt/Hauptverkehrsrichtung/Oberfläche/Hoch",
  [Zaehlart.QI]: "Isarschnitt",
  [Zaehlart.QS]: "Stadtgrenzenzählung",
  [Zaehlart.QT]: "Querschnitt Tunnel/Unterführung/Tief",
  [Zaehlart.QR]: "Querschnitt Radverkehr",
  [Zaehlart.R]: "Radverkehrszählung",
  [Zaehlart.QJS]: "Querschnitt je Straßenseite",
  [Zaehlart.FJS]: "Fuß & Rad je Straßenseite",
  [Zaehlart.QU]: "Querung",
  [Zaehlart.T]: "Tunnel / Unterführung / Tief",
  [Zaehlart.TK]: "Teilknoten",
};

/**
 * Das Kürzel, das in den CSV-Header (Zeile 2) geschrieben wird.
 * Bei der Standardzählung "N" bleibt das Feld laut Spezifikation leer.
 */
export function zaehlartHeaderValue(zaehlart: Zaehlart): string {
  return zaehlart === Zaehlart.N ? "" : zaehlart;
}

/** Mögliche Himmelsrichtungen für Strassenseite/Richtung. */
export const HIMMELSRICHTUNGEN = [
  "N",
  "NO",
  "O",
  "SO",
  "S",
  "SW",
  "W",
  "NW",
] as const;

/** Bewegungsrichtungen für die Zählart FjS. */
export const BEWEGUNGSRICHTUNGEN = ["EIN", "AUS"] as const;

/**
 * Beschreibt, welche der Dimensionsfelder (nach / Strassenseite / Richtung)
 * für eine Zählart relevant sind und wie das jeweilige Feld zu füllen ist.
 * Quelle: dave/docs/src/de/documentation-csv-for-upload.md (Spaltenfeld-Tabelle).
 */
export interface FeldRegeln {
  /** "nach" = Zielknotenarm. Leer bei FjS und Qu, sonst befüllt. */
  nach: boolean;
  /** "Strassenseite" = Himmelsrichtung. Nur bei QjS und FjS. */
  strassenseite: boolean;
  /** Art des Richtungsfeldes. */
  richtung: "keine" | "einaus" | "himmelsrichtung";
}

export function feldRegeln(zaehlart: Zaehlart): FeldRegeln {
  switch (zaehlart) {
    case Zaehlart.FJS:
      // Fuß & Rad je Straßenseite: keine Verkehrsbeziehung, Strassenseite + EIN/AUS
      return { nach: false, strassenseite: true, richtung: "einaus" };
    case Zaehlart.QU:
      // Querung: keine Verkehrsbeziehung, Richtung als Himmelsrichtung
      return { nach: false, strassenseite: false, richtung: "himmelsrichtung" };
    case Zaehlart.QJS:
      // Querschnitt je Straßenseite: Verkehrsbeziehung + Strassenseite
      return { nach: true, strassenseite: true, richtung: "keine" };
    default:
      // Alle übrigen Zählarten: Verkehrsbeziehung (Zielknotenarm), sonst leer
      return { nach: true, strassenseite: false, richtung: "keine" };
  }
}
