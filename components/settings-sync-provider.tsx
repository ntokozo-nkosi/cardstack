"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useColorTheme } from "@/components/theme-color-provider";
import type { ColorThemeId } from "@/lib/themes";

export function SettingsSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { colorTheme, setColorTheme } = useColorTheme();
  const { theme, setTheme } = useTheme();
  const hasFetched = useRef(false);
  const isReconciling = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch settings from DB on mount and reconcile with local state
  useEffect(() => {
    if (!isSignedIn || hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const { settings } = await res.json();
        if (!settings) return;

        isReconciling.current = true;

        if (settings.color_theme && settings.color_theme !== colorTheme) {
          setColorTheme(settings.color_theme as ColorThemeId);
        }
        if (settings.mode && settings.mode !== theme) {
          setTheme(settings.mode);
        }

        // Allow reconciliation effects to settle before enabling sync
        setTimeout(() => {
          isReconciling.current = false;
        }, 100);
      } catch {
        // Silently fail — localStorage values remain as fallback
      }
    })();
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncToApi = useCallback(
    (updates: Record<string, string>) => {
      if (!isSignedIn) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(async () => {
        try {
          await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch {
          // Silently fail — change is already applied locally
        }
      }, 500);
    },
    [isSignedIn]
  );

  // Sync color theme changes to DB
  useEffect(() => {
    if (!isSignedIn || !hasFetched.current || isReconciling.current) return;
    syncToApi({ color_theme: colorTheme });
  }, [colorTheme, isSignedIn, syncToApi]);

  // Sync mode changes to DB
  useEffect(() => {
    if (!isSignedIn || !hasFetched.current || isReconciling.current || !theme) return;
    syncToApi({ mode: theme });
  }, [theme, isSignedIn, syncToApi]);

  return <>{children}</>;
}
