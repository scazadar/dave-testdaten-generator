<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 font-weight-bold">
      <v-icon
        start
        icon="mdi-map-marker"
      />
      Zählstelle &amp; Zählung
    </v-card-title>
    <v-card-text>
      <v-row dense>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="config.zaehlstellennummer"
            label="Zählstellennummer"
            hint="Alphanumerische Nummer der Zählstelle"
            persistent-hint
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <v-autocomplete
            :model-value="config.zaehlart"
            :items="zaehlartItems"
            item-title="title"
            item-value="value"
            label="Zählart"
            @update:model-value="onZaehlartChange"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="config.datum"
            label="Datum (YYYY-MM-DD)"
            type="date"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <v-select
            v-model="config.knotenarmnummer"
            :items="['1', '2', '3', '4', '5', '6', '7', '8']"
            label="Knotenarmnummer"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useGeneratorStore } from "@/store/GeneratorStore";
import Zaehlart, { zaehlartText } from "@/types/Zaehlart";

const store = useGeneratorStore();
const config = computed(() => store.config);

const zaehlartItems = Object.values(Zaehlart).map((value) => ({
  value,
  title: `${value} – ${zaehlartText[value]}`,
}));

function onZaehlartChange(value: Zaehlart) {
  store.setZaehlart(value);
}
</script>
