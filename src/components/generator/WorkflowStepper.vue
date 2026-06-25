<template>
  <v-card
    variant="tonal"
    color="secondary"
    class="mt-3"
  >
    <v-card-title class="text-subtitle-2 font-weight-bold d-flex align-center">
      <v-icon
        start
        icon="mdi-transit-connection-variant"
      />
      DAVe-Workflow durchklicken
    </v-card-title>

    <v-card-text>
      <div class="text-caption text-medium-emphasis mb-2">
        Zählung <code>{{ zaehlstellennummer }}</code> – Status weiterschalten und
        beobachten, in welchem Portal sie erscheint.
      </div>

      <!-- Status-Stepper: jeder Status ist anklickbar -->
      <div class="d-flex flex-wrap ga-1 mb-3">
        <template
          v-for="(stage, i) in stages"
          :key="stage.status"
        >
          <v-icon
            v-if="i > 0"
            icon="mdi-chevron-right"
            size="small"
            class="align-self-center text-medium-emphasis"
          />
          <v-btn
            :variant="stage.status === current ? 'flat' : 'outlined'"
            :color="stage.status === current ? 'primary' : undefined"
            size="small"
            :loading="busy === stage.status"
            :disabled="busy !== null"
            @click="setStatus(stage.status)"
          >
            {{ stage.label }}
          </v-btn>
        </template>
      </div>

      <!-- Aktueller Status: Beschreibung + wo sichtbar -->
      <v-alert
        :type="currentStage.visible.length ? 'info' : 'warning'"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        <div class="font-weight-medium">
          {{ currentStage.label }} – {{ currentStage.hint }}
        </div>
        <div class="mt-2 d-flex flex-wrap ga-2 align-center">
          <span class="text-caption">Sichtbar in:</span>
          <template v-if="currentStage.visible.length">
            <v-chip
              v-for="key in currentStage.visible"
              :key="key"
              :href="portals[key].url"
              target="_blank"
              size="small"
              color="primary"
              variant="elevated"
              append-icon="mdi-open-in-new"
            >
              {{ portals[key].label }}
            </v-chip>
          </template>
          <span
            v-else
            class="text-caption font-italic"
          >keinem Portal</span>
        </div>
      </v-alert>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
      >
        {{ error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { DaveApiError } from "@/services/daveApi";
import { updateStatus } from "@/services/daveUpload";

const props = defineProps<{
  zaehlungId: string;
  zaehlstellennummer: string;
}>();

/** Sichtbarkeitsziele (Portale). Ports gemäß compose.dave-stack.yml. */
const host =
  typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
const portals = {
  selfservice: { label: "Selfservice-Portal", url: `http://${host}:8084` },
  admin: { label: "Admin-Portal", url: `http://${host}:8083` },
  frontend: { label: "Frontend (Karte)", url: `http://${host}:8082` },
} as const;
type PortalKey = keyof typeof portals;

interface Stage {
  status: string;
  label: string;
  hint: string;
  visible: PortalKey[];
}

/**
 * DAVe-Statuslebenszyklus mit der jeweils sichtbarkeitsrelevanten Zuordnung.
 * Quelle: SucheService (Karte = nur ACTIVE), ZaehlstelleIndexService
 * (Selfservice: INSTRUCTED/COUNTING/CORRECTION; Admin offene Zählungen:
 * CREATED/INSTRUCTED/COUNTING/ACCOMPLISHED/CORRECTION).
 */
const stages: Stage[] = [
  {
    status: "CREATED",
    label: "Angelegt",
    hint: "Neu angelegt, noch keinem Dienstleister zugewiesen.",
    visible: ["admin"],
  },
  {
    status: "INSTRUCTED",
    label: "Beauftragt",
    hint: "An den Dienstleister beauftragt. (Liegt das Zähldatum in der Vergangenheit, schaltet das Backend automatisch auf 'Wird gezählt'.)",
    visible: ["selfservice", "admin"],
  },
  {
    status: "COUNTING",
    label: "Wird gezählt",
    hint: "In Bearbeitung beim Dienstleister – Standardstatus nach dem Senden.",
    visible: ["selfservice", "admin"],
  },
  {
    status: "ACCOMPLISHED",
    label: "Abgeschlossen",
    hint: "Vom Dienstleister abgeschlossen, beim Auftraggeber zur Freigabe. Achtung: Bei Generator-Daten scheitert dieser Schritt an der Plausibilitätsprüfung des Backends (HTTP 400).",
    visible: ["admin"],
  },
  {
    status: "ACTIVE",
    label: "Freigegeben",
    hint: "Freigegeben und öffentlich auf der Karte im Frontend sichtbar.",
    visible: ["frontend"],
  },
  {
    status: "CORRECTION",
    label: "Korrektur",
    hint: "Vom Auftraggeber zur Korrektur an den Dienstleister zurückgegeben.",
    visible: ["selfservice", "admin"],
  },
  {
    status: "INACTIVE",
    label: "Inaktiv",
    hint: "Deaktiviert – in keinem Portal sichtbar.",
    visible: [],
  },
];

// Der Generator legt die Zählung mit Status COUNTING an.
const current = ref<string>("COUNTING");
const busy = ref<string | null>(null);
const error = ref<string | null>(null);

const currentStage = computed(
  () => stages.find((s) => s.status === current.value) ?? stages[2]
);

async function setStatus(status: string) {
  if (busy.value || status === current.value) return;
  busy.value = status;
  error.value = null;
  try {
    await updateStatus(props.zaehlungId, status);
    // Vergangenes Zähldatum + INSTRUCTED -> Backend setzt automatisch COUNTING.
    current.value = status === "INSTRUCTED" ? "COUNTING" : status;
  } catch (err) {
    if (err instanceof DaveApiError && err.status === 400 && status === "ACCOMPLISHED") {
      error.value =
        "'Abgeschlossen' abgelehnt: Die Plausibilitätsprüfung des Backends erwartet exakt die Roh-Zeitintervalle. Generator-Daten enthalten zusätzlich vorberechnete Aggregate – dieser Schritt funktioniert nur über den CSV-Upload im Selfservice-Portal. Du kannst direkt auf 'Freigegeben' schalten.";
    } else if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = "Statusänderung fehlgeschlagen.";
    }
  } finally {
    busy.value = null;
  }
}
</script>
