<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 font-weight-bold">
      <v-icon
        start
        icon="mdi-clock-outline"
      />
      Zeitbereich (15-Minuten-Intervalle)
    </v-card-title>
    <v-card-text>
      <v-chip-group
        class="mb-2"
        selected-class="text-primary"
      >
        <v-chip
          v-for="preset in presets"
          :key="preset.titel"
          size="small"
          variant="outlined"
          @click="applyPreset(preset.bereich.von, preset.bereich.bis)"
        >
          {{ preset.titel }}
        </v-chip>
      </v-chip-group>
      <v-row dense>
        <v-col
          cols="6"
          sm="5"
        >
          <v-select
            v-model.number="config.vonIntervall"
            :items="intervallItems"
            item-title="label"
            item-value="value"
            label="Von Intervall"
          />
        </v-col>
        <v-col
          cols="6"
          sm="5"
        >
          <v-select
            v-model.number="config.bisIntervall"
            :items="intervallItems"
            item-title="label"
            item-value="value"
            label="Bis Intervall"
          />
        </v-col>
        <v-col
          cols="12"
          sm="2"
          class="d-flex align-center"
        >
          <span class="text-caption text-medium-emphasis">
            {{ anzahlIntervalle }} Intervalle
          </span>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useGeneratorStore } from "@/store/GeneratorStore";
import {
  INTERVALLE_PRO_TAG,
  ZEITBEREICH_PRESETS,
  intervallLabel,
} from "@/util/intervals";

const store = useGeneratorStore();
const config = computed(() => store.config);
const presets = ZEITBEREICH_PRESETS;

const intervallItems = Array.from({ length: INTERVALLE_PRO_TAG }, (_, i) => ({
  value: i + 1,
  label: intervallLabel(i + 1),
}));

const anzahlIntervalle = computed(
  () =>
    Math.abs(config.value.bisIntervall - config.value.vonIntervall) + 1
);

function applyPreset(von: number, bis: number) {
  store.setZeitbereich(von, bis);
}
</script>
