<template>
  <v-container
    fluid
    class="pa-4"
  >
    <v-row>
      <!-- Konfiguration -->
      <v-col
        cols="12"
        md="7"
      >
        <div class="d-flex flex-column ga-4">
          <zaehlstelle-form />
          <zeitbereich-form />
          <segment-editor />
          <kategorien-form />
        </div>
      </v-col>

      <!-- Vorschau & Download -->
      <v-col
        cols="12"
        md="5"
      >
        <v-card
          variant="outlined"
          class="position-sticky"
          style="top: 66px"
        >
          <v-card-title class="text-subtitle-1 font-weight-bold">
            <v-icon
              start
              icon="mdi-file-delimited-outline"
            />
            Vorschau &amp; Download
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="!validation.ok"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              <ul class="ms-3">
                <li
                  v-for="(err, i) in validation.errors"
                  :key="i"
                >
                  {{ err }}
                </li>
              </ul>
            </v-alert>

            <div class="text-caption mb-1">
              Dateiname:
              <code>{{ fileName }}</code>
            </div>
            <div class="text-caption mb-2 text-medium-emphasis">
              {{ zeilenInfo }}
            </div>

            <v-switch
              v-model="config.bom"
              label="UTF-8 BOM voranstellen"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />

            <v-textarea
              :model-value="preview"
              label="CSV-Vorschau (gekürzt)"
              readonly
              variant="outlined"
              rows="14"
              class="csv-preview"
              auto-grow
              no-resize
            />

            <div class="d-flex ga-2 mt-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-download"
                :disabled="!validation.ok"
                @click="onDownload"
              >
                CSV herunterladen
              </v-btn>
              <v-btn
                variant="outlined"
                prepend-icon="mdi-content-copy"
                :disabled="!validation.ok"
                @click="onCopy"
              >
                Kopieren
              </v-btn>
              <v-spacer />
              <v-btn
                variant="text"
                prepend-icon="mdi-restore"
                @click="store.reset()"
              >
                Zurücksetzen
              </v-btn>
            </div>

            <v-divider class="my-3" />

            <v-btn
              color="secondary"
              prepend-icon="mdi-cloud-upload-outline"
              :disabled="!validation.ok || sending"
              :loading="sending"
              block
              @click="onSendToDave"
            >
              An DAVe senden
            </v-btn>
            <div class="text-caption text-medium-emphasis mt-1">
              Legt Zählstelle &amp; Zählung an und spielt die Daten ein – danach
              als offene Zählung in Admin- und Selfservice-Portal sichtbar.
            </div>

            <v-alert
              v-if="lastResult"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              Gesendet: Zählstelle <strong>{{ lastResult.zaehlstellennummer }}</strong>
              angelegt, Zählung-ID <code>{{ lastResult.zaehlungId }}</code>.
              Jetzt im Admin-Portal (offene Zählungen) und Selfservice-Portal
              sichtbar.
            </v-alert>

            <workflow-stepper
              v-if="lastResult"
              :key="lastResult.zaehlungId"
              :zaehlung-id="lastResult.zaehlungId"
              :zaehlstellennummer="lastResult.zaehlstellennummer"
            />
            <v-alert
              v-if="sendError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ sendError }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="2500"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import KategorienForm from "@/components/generator/KategorienForm.vue";
import SegmentEditor from "@/components/generator/SegmentEditor.vue";
import ZaehlstelleForm from "@/components/generator/ZaehlstelleForm.vue";
import ZeitbereichForm from "@/components/generator/ZeitbereichForm.vue";
import WorkflowStepper from "@/components/generator/WorkflowStepper.vue";
import { sendeAnDave, type UploadResult } from "@/services/daveUpload";
import { useGeneratorStore } from "@/store/GeneratorStore";
import {
  buildFileName,
  generateCsv,
  validateConfig,
} from "@/util/csvGenerator";
import { downloadTextFile } from "@/util/download";

const store = useGeneratorStore();
const config = computed(() => store.config);

const snackbar = reactive({ show: false, text: "", color: "success" });

const sending = ref(false);
const lastResult = ref<UploadResult | null>(null);
const sendError = ref<string | null>(null);

const validation = computed(() => validateConfig(config.value));
const fileName = computed(() => buildFileName(config.value));

const anzahlIntervalle = computed(
  () => Math.abs(config.value.bisIntervall - config.value.vonIntervall) + 1
);
const zeilenInfo = computed(() => {
  const segmente = Math.max(1, config.value.segmente.length);
  const datenzeilen = segmente * anzahlIntervalle.value;
  return `${segmente} Segment(e) × ${anzahlIntervalle.value} Intervalle = ${datenzeilen} Datenzeilen (+ 3 Headerzeilen)`;
});

const csv = computed(() => generateCsv(config.value));

const preview = computed(() => {
  const lines = csv.value.split("\n");
  if (lines.length <= 25) return csv.value;
  return [...lines.slice(0, 20), `… (${lines.length - 22} weitere Zeilen) …`, ...lines.slice(-2)].join(
    "\n"
  );
});

function notify(text: string, color = "success") {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

function onDownload() {
  if (!validation.value.ok) return;
  downloadTextFile(fileName.value, csv.value);
  notify(`Datei „${fileName.value}“ heruntergeladen.`);
}

async function onCopy() {
  if (!validation.value.ok) return;
  try {
    await navigator.clipboard.writeText(csv.value);
    notify("CSV in die Zwischenablage kopiert.");
  } catch {
    notify("Kopieren nicht möglich.", "error");
  }
}

async function onSendToDave() {
  if (!validation.value.ok || sending.value) return;
  sending.value = true;
  sendError.value = null;
  lastResult.value = null;
  try {
    lastResult.value = await sendeAnDave(config.value);
    notify(
      `An DAVe gesendet – Zählstelle ${lastResult.value.zaehlstellennummer} angelegt.`
    );
  } catch (err) {
    sendError.value =
      err instanceof Error ? err.message : "Senden an DAVe fehlgeschlagen.";
    notify("Senden an DAVe fehlgeschlagen.", "error");
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.csv-preview :deep(textarea) {
  font-family: "Roboto Mono", monospace;
  font-size: 12px;
  white-space: pre;
}
</style>
