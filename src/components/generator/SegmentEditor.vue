<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
      <v-icon
        start
        icon="mdi-directions"
      />
      Segmente (Verkehrsbeziehungen / Richtungen)
      <v-spacer />
      <v-btn
        size="small"
        prepend-icon="mdi-plus"
        color="secondary"
        @click="store.addSegment()"
      >
        Segment
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-alert
        v-if="!hatRelevanteFelder"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        Für die Zählart <strong>{{ config.zaehlart }}</strong> sind die Felder
        „nach“, „Strassenseite“ und „Richtung“ leer. Jedes Segment erzeugt einen
        eigenen Block mit den Intervallzeilen.
      </v-alert>
      <v-alert
        v-else
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        Pro Segment wird ein vollständiger Block der Intervallzeilen erzeugt.
        {{ feldHinweis }}
      </v-alert>

      <v-table density="compact">
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th v-if="regeln.nach">nach (Zielknotenarm)</th>
            <th v-if="regeln.strassenseite">Strassenseite</th>
            <th v-if="regeln.richtung !== 'keine'">Richtung</th>
            <th style="width: 56px" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(segment, index) in config.segmente"
            :key="index"
          >
            <td>{{ index + 1 }}</td>
            <td v-if="regeln.nach">
              <v-select
                v-model="segment.nach"
                :items="knotenarme"
                hide-details
                style="min-width: 90px"
              />
            </td>
            <td v-if="regeln.strassenseite">
              <v-select
                v-model="segment.strassenseite"
                :items="himmelsrichtungen"
                hide-details
                style="min-width: 90px"
              />
            </td>
            <td v-if="regeln.richtung !== 'keine'">
              <v-select
                v-model="segment.richtung"
                :items="richtungsItems"
                hide-details
                style="min-width: 100px"
              />
            </td>
            <td>
              <v-btn
                icon="mdi-delete-outline"
                size="x-small"
                variant="text"
                color="error"
                :disabled="config.segmente.length === 1 && !hatRelevanteFelder"
                @click="store.removeSegment(index)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useGeneratorStore } from "@/store/GeneratorStore";
import {
  BEWEGUNGSRICHTUNGEN,
  HIMMELSRICHTUNGEN,
  feldRegeln,
} from "@/types/Zaehlart";

const store = useGeneratorStore();
const config = computed(() => store.config);

const knotenarme: string[] = ["1", "2", "3", "4", "5", "6", "7", "8"];
const himmelsrichtungen: string[] = [...HIMMELSRICHTUNGEN];

const regeln = computed(() => feldRegeln(config.value.zaehlart));

const richtungsItems = computed<string[]>(() =>
  regeln.value.richtung === "einaus"
    ? [...BEWEGUNGSRICHTUNGEN]
    : [...HIMMELSRICHTUNGEN]
);

const hatRelevanteFelder = computed(
  () =>
    regeln.value.nach ||
    regeln.value.strassenseite ||
    regeln.value.richtung !== "keine"
);

const feldHinweis = computed(() => {
  const teile: string[] = [];
  if (regeln.value.nach) teile.push("„nach“ = Zielknotenarm");
  if (regeln.value.strassenseite) teile.push("„Strassenseite“ = Himmelsrichtung");
  if (regeln.value.richtung === "einaus") teile.push("„Richtung“ = EIN/AUS");
  if (regeln.value.richtung === "himmelsrichtung")
    teile.push("„Richtung“ = Himmelsrichtung");
  return teile.length ? `Relevant: ${teile.join(", ")}.` : "";
});
</script>
