import { defineStore } from "pinia";

import type {
  GeneratorConfig,
  Kategorie,
  KategorieConfig,
  Segment,
} from "@/types/GeneratorConfig";

import { KATEGORIEN } from "@/types/GeneratorConfig";
import Zaehlart, { feldRegeln } from "@/types/Zaehlart";
import { emptySegment } from "@/util/csvGenerator";

function defaultKategorie(mode: KategorieConfig["mode"]): KategorieConfig {
  return { mode, fest: 0, min: 0, max: 10, peak: 100 };
}

function defaultKategorien(): Record<Kategorie, KategorieConfig> {
  // Sinnvolle Voreinstellung: Pkw als Tageskurve, Rad/Fuß als Zufall, Rest aus.
  const map = {} as Record<Kategorie, KategorieConfig>;
  for (const k of KATEGORIEN) {
    map[k] = defaultKategorie("aus");
  }
  map.pkw = { mode: "kurve", fest: 0, min: 0, max: 50, peak: 300 };
  map.rad = { mode: "zufall", fest: 0, min: 0, max: 20, peak: 50 };
  map.fuss = { mode: "zufall", fest: 0, min: 0, max: 15, peak: 40 };
  return map;
}

function defaultConfig(): GeneratorConfig {
  return {
    zaehlstellennummer: "111310",
    zaehlart: Zaehlart.N,
    datum: "2026-03-13",
    knotenarmnummer: "1",
    vonIntervall: 1,
    bisIntervall: 96,
    segmente: [emptySegment()],
    kategorien: defaultKategorien(),
    bom: false,
  };
}

export const useGeneratorStore = defineStore("generator", {
  state: (): { config: GeneratorConfig } => ({
    config: defaultConfig(),
  }),
  actions: {
    setZaehlart(zaehlart: Zaehlart) {
      this.config.zaehlart = zaehlart;
      // Beim Wechsel der Zählart die nicht mehr relevanten Felder bereinigen.
      const regeln = feldRegeln(zaehlart);
      this.config.segmente.forEach((seg) => {
        if (!regeln.nach) seg.nach = "";
        if (!regeln.strassenseite) seg.strassenseite = "";
        if (regeln.richtung === "keine") seg.richtung = "";
      });
    },
    addSegment() {
      const last = this.config.segmente[this.config.segmente.length - 1];
      this.config.segmente.push(
        last ? { ...last } : emptySegment()
      );
    },
    removeSegment(index: number) {
      this.config.segmente.splice(index, 1);
      if (this.config.segmente.length === 0) {
        this.config.segmente.push(emptySegment());
      }
    },
    setZeitbereich(von: number, bis: number) {
      this.config.vonIntervall = von;
      this.config.bisIntervall = bis;
    },
    addSegmentValue(segment: Segment) {
      this.config.segmente.push(segment);
    },
    reset() {
      this.config = defaultConfig();
    },
  },
});
