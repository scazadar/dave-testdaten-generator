import { describe, expect, it } from "vitest";

import type { GeneratorConfig } from "@/types/GeneratorConfig";

import { KATEGORIEN } from "@/types/GeneratorConfig";
import Zaehlart from "@/types/Zaehlart";
import {
  buildFileName,
  generateCsv,
  validateConfig,
} from "@/util/csvGenerator";

function baseConfig(overrides: Partial<GeneratorConfig> = {}): GeneratorConfig {
  const kategorien = {} as GeneratorConfig["kategorien"];
  for (const k of KATEGORIEN) {
    kategorien[k] = { mode: "aus", fest: 0, min: 0, max: 0, peak: 0 };
  }
  kategorien.rad = { mode: "fest", fest: 5, min: 0, max: 0, peak: 0 };
  kategorien.fuss = { mode: "fest", fest: 7, min: 0, max: 0, peak: 0 };
  return {
    zaehlstellennummer: "111310",
    zaehlart: Zaehlart.FJS,
    datum: "2026-03-13",
    knotenarmnummer: "1",
    vonIntervall: 1,
    bisIntervall: 96,
    segmente: [{ nach: "", strassenseite: "O", richtung: "EIN" }],
    kategorien,
    bom: false,
    ...overrides,
  };
}

describe("buildFileName", () => {
  it("folgt der Namenskonvention", () => {
    expect(buildFileName(baseConfig())).toBe(
      "111310_2026-03-13_Knotenarm_1.csv"
    );
  });
});

describe("generateCsv", () => {
  it("schreibt den korrekten zweizeiligen Meta-Header und Spaltenkopf", () => {
    const lines = generateCsv(baseConfig()).split("\n");
    expect(lines[0]).toBe(
      "Zählstellennummer;Zählart;Datum;Knotenarmnummer;;;;;;;"
    );
    expect(lines[1]).toBe("111310;FJS;2026-03-13;1;;;;;;;");
    expect(lines[2]).toBe(
      "Intervallnummer;nach;Strassenseite;Richtung;Pkw;Lkw;Lz;Bus;Krad;Rad;Fuss"
    );
  });

  it("lässt das Zählart-Feld bei Standardzählung N leer", () => {
    const lines = generateCsv(
      baseConfig({ zaehlart: Zaehlart.N, segmente: [{ nach: "2", strassenseite: "", richtung: "" }] })
    ).split("\n");
    expect(lines[1]).toBe("111310;;2026-03-13;1;;;;;;;");
  });

  it("erzeugt eine Datenzeile pro Intervall im Zeitbereich", () => {
    const csv = generateCsv(baseConfig({ vonIntervall: 25, bisIntervall: 76 }));
    const lines = csv.trim().split("\n");
    // 3 Headerzeilen + 52 Intervalle (25..76)
    expect(lines.length).toBe(3 + 52);
    expect(lines[3]).toBe("25;;O;EIN;;;;;;5;7");
  });

  it("setzt nach/Strassenseite/Richtung gemäß Zählart-Regeln (FJS: nur Strassenseite+Richtung)", () => {
    // nach wird gesetzt, darf aber bei FJS nicht in die Ausgabe gelangen
    const csv = generateCsv(
      baseConfig({ segmente: [{ nach: "4", strassenseite: "W", richtung: "AUS" }] })
    );
    const firstData = csv.split("\n")[3];
    expect(firstData).toBe("1;;W;AUS;;;;;;5;7");
  });

  it("QU: nur Richtung als Himmelsrichtung, nach + Strassenseite leer", () => {
    const csv = generateCsv(
      baseConfig({
        zaehlart: Zaehlart.QU,
        segmente: [{ nach: "3", strassenseite: "N", richtung: "S" }],
        vonIntervall: 1,
        bisIntervall: 1,
      })
    );
    expect(csv.split("\n")[3]).toBe("1;;;S;;;;;;5;7");
  });

  it("QJS: nach + Strassenseite, Richtung leer", () => {
    const csv = generateCsv(
      baseConfig({
        zaehlart: Zaehlart.QJS,
        segmente: [{ nach: "4", strassenseite: "N", richtung: "EIN" }],
        vonIntervall: 1,
        bisIntervall: 1,
      })
    );
    expect(csv.split("\n")[3]).toBe("1;4;N;;;;;;;5;7");
  });

  it("erzeugt mehrere Segmente als aufeinanderfolgende Blöcke", () => {
    const csv = generateCsv(
      baseConfig({
        vonIntervall: 1,
        bisIntervall: 2,
        segmente: [
          { nach: "", strassenseite: "O", richtung: "EIN" },
          { nach: "", strassenseite: "W", richtung: "AUS" },
        ],
      })
    );
    const lines = csv.trim().split("\n");
    // 3 Header + 2 Segmente * 2 Intervalle
    expect(lines.length).toBe(3 + 4);
    expect(lines[3]).toContain(";O;EIN;");
    expect(lines[5]).toContain(";W;AUS;");
  });

  it("stellt ein BOM voran, wenn aktiviert", () => {
    expect(generateCsv(baseConfig({ bom: true })).charCodeAt(0)).toBe(0xfeff);
    expect(generateCsv(baseConfig({ bom: false })).charCodeAt(0)).not.toBe(
      0xfeff
    );
  });

  it("Kategorien im Modus 'aus' bleiben leer, 'fest' schreibt den Wert", () => {
    const csv = generateCsv(baseConfig({ vonIntervall: 1, bisIntervall: 1 }));
    // Pkw;Lkw;Lz;Bus;Krad => leer, Rad=5, Fuss=7
    expect(csv.split("\n")[3]).toBe("1;;O;EIN;;;;;;5;7");
  });
});

describe("validateConfig", () => {
  it("akzeptiert eine gültige Konfiguration", () => {
    expect(validateConfig(baseConfig()).ok).toBe(true);
  });

  it("meldet fehlende Zählstellennummer", () => {
    const result = validateConfig(baseConfig({ zaehlstellennummer: " " }));
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain("Zählstellennummer");
  });

  it("meldet ungültiges Datum", () => {
    expect(validateConfig(baseConfig({ datum: "13.03.2026" })).ok).toBe(false);
  });

  it("meldet fehlende Pflichtfelder je Zählart (QJS ohne nach)", () => {
    const result = validateConfig(
      baseConfig({
        zaehlart: Zaehlart.QJS,
        segmente: [{ nach: "", strassenseite: "N", richtung: "" }],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain("nach");
  });

  it("meldet, wenn keine Kategorie gezählt wird", () => {
    const cfg = baseConfig();
    for (const k of KATEGORIEN) cfg.kategorien[k].mode = "aus";
    expect(validateConfig(cfg).ok).toBe(false);
  });
});
