export const COLOR_THEMES = [
  {
    id: "default",
    label: "Ember",
    description: "Warm tones with sharp edges",
    previewColors: {
      primary: "oklch(0.646 0.222 41.116)",
      secondary: "oklch(0.967 0.001 286.375)",
      accent: "oklch(0.97 0.001 106.424)",
    },
  },
  {
    id: "rose",
    label: "Blossom",
    description: "Soft rose with rounded corners",
    previewColors: {
      primary: "oklch(0.514 0.222 16.935)",
      secondary: "oklch(0.967 0.001 286.375)",
      accent: "oklch(0.586 0.253 17.585)",
    },
  },
] as const;

export type ColorThemeId = (typeof COLOR_THEMES)[number]["id"];

export const DEFAULT_COLOR_THEME: ColorThemeId = "default";
export const COLOR_THEME_STORAGE_KEY = "cardstack-color-theme";
