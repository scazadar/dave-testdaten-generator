import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import colors from "vuetify/util/colors";

import "vuetify/styles";

import { mdi, aliases as mdiAliases } from "vuetify/iconsets/mdi";
import { de } from "vuetify/locale";

const theme = {
  themes: {
    light: {
      colors: {
        primary: colors.blue.darken3,
        secondary: colors.orange.darken2,
        accent: colors.blue.darken4,
        success: colors.green.darken1,
        error: colors.red.darken1,
      },
    },
  },
};

export default createVuetify({
  theme: theme,
  icons: {
    defaultSet: "mdi",
    sets: { mdi },
    aliases: { ...mdiAliases },
  },
  locale: {
    locale: "de",
    messages: { de },
  },
  defaults: {
    VSelect: {
      density: "compact",
      variant: "outlined",
      itemColor: "primary",
    },
    VBtn: {
      class: "text-none",
      variant: "elevated",
    },
    VTextField: {
      density: "compact",
      variant: "outlined",
    },
    VAutocomplete: {
      density: "compact",
      variant: "outlined",
    },
    VCheckbox: {
      density: "compact",
    },
  },
});
