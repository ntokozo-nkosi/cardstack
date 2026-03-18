"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  type ColorThemeId,
  DEFAULT_COLOR_THEME,
  COLOR_THEME_STORAGE_KEY,
} from "@/lib/themes";

interface ColorThemeContextValue {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
}

const ColorThemeContext = createContext<ColorThemeContextValue | undefined>(
  undefined
);

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(DEFAULT_COLOR_THEME);

  useEffect(() => {
    const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY) as ColorThemeId | null;
    if (stored && stored !== DEFAULT_COLOR_THEME) {
      setColorThemeState(stored);
    }
  }, []);

  const setColorTheme = useCallback((theme: ColorThemeId) => {
    setColorThemeState(theme);

    if (theme === DEFAULT_COLOR_THEME) {
      localStorage.removeItem(COLOR_THEME_STORAGE_KEY);
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, []);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
}
