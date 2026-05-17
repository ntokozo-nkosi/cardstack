'use client'

import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useColorTheme } from '@/components/theme-color-provider'
import { COLOR_THEMES, type ColorThemeId } from '@/lib/themes'
import { cn } from '@/lib/utils'

const MODE_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export default function SettingsPage() {
  const { colorTheme, setColorTheme } = useColorTheme()
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Customize your CardStack experience
        </p>
      </div>

      {/* Appearance Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred color theme and display mode
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Color Theme */}
          <div>
            <h3 className="text-sm font-medium mb-3">Color Theme</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COLOR_THEMES.map((t) => {
                const isActive = colorTheme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setColorTheme(t.id as ColorThemeId)}
                    className={cn(
                      "relative flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-muted-foreground/30",
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                    )}
                  >
                    {/* Color swatches */}
                    <div className="flex gap-1.5 shrink-0 pt-0.5">
                      <div
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: t.previewColors.primary }}
                      />
                      <div
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: t.previewColors.accent }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t.description}
                      </div>
                    </div>

                    {isActive && (
                      <div className="absolute top-3 right-3">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode */}
          <div>
            <h3 className="text-sm font-medium mb-3">Display Mode</h3>
            <div className="flex gap-2">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all hover:border-muted-foreground/30",
                      isActive
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
