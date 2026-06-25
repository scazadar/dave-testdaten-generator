<template>
  <v-app>
    <v-app-bar
      color="primary"
      height="50"
      class="px-4"
    >
      <v-toolbar-title class="text-white font-weight-medium">
        <span class="font-weight-medium">DAVe</span>
        <span class="font-weight-thin"> | Testdaten-Generator</span>
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        v-tooltip:bottom="'CSV-Format-Spezifikation (DAVe-Doku)'"
        density="compact"
        icon="mdi-help-circle-outline"
        href="https://github.com/it-at-m/dave/blob/main/docs/src/de/documentation-csv-for-upload.md"
        target="_blank"
      />
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts"></script>
