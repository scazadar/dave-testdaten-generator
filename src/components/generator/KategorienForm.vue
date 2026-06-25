<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 font-weight-bold">
      <v-icon
        start
        icon="mdi-car-multiple"
      />
      Fahrzeugkategorien &amp; Werte
    </v-card-title>
    <v-card-text>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Kategorie</th>
            <th style="width: 230px">Modus</th>
            <th>Parameter</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="kategorie in kategorien"
            :key="kategorie"
          >
            <td class="font-weight-medium">
              {{ labels[kategorie].label }}
            </td>
            <td>
              <v-select
                v-model="config.kategorien[kategorie].mode"
                :items="modeItems"
                item-title="title"
                item-value="value"
                hide-details
              />
            </td>
            <td>
              <div
                v-if="config.kategorien[kategorie].mode === 'fest'"
                style="max-width: 160px"
              >
                <v-text-field
                  v-model.number="config.kategorien[kategorie].fest"
                  type="number"
                  min="0"
                  label="Wert je Intervall"
                  hide-details
                />
              </div>
              <div
                v-else-if="config.kategorien[kategorie].mode === 'zufall'"
                class="d-flex ga-2"
                style="max-width: 260px"
              >
                <v-text-field
                  v-model.number="config.kategorien[kategorie].min"
                  type="number"
                  min="0"
                  label="min"
                  hide-details
                />
                <v-text-field
                  v-model.number="config.kategorien[kategorie].max"
                  type="number"
                  min="0"
                  label="max"
                  hide-details
                />
              </div>
              <div
                v-else-if="config.kategorien[kategorie].mode === 'kurve'"
                style="max-width: 200px"
              >
                <v-text-field
                  v-model.number="config.kategorien[kategorie].peak"
                  type="number"
                  min="0"
                  label="Spitzenwert (max. Intervall)"
                  hide-details
                />
              </div>
              <span
                v-else
                class="text-caption text-medium-emphasis"
              >
                Spalte bleibt leer
              </span>
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
  KATEGORIEN,
  KATEGORIE_LABELS,
  VALUE_MODE_LABELS,
} from "@/types/GeneratorConfig";

const store = useGeneratorStore();
const config = computed(() => store.config);

const kategorien = KATEGORIEN;
const labels = KATEGORIE_LABELS;
const modeItems = (
  Object.keys(VALUE_MODE_LABELS) as Array<keyof typeof VALUE_MODE_LABELS>
).map((value) => ({ value, title: VALUE_MODE_LABELS[value] }));
</script>
