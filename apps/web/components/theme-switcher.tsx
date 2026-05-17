"use client";

import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useColorTheme } from "@/components/theme-color-provider";
import { COLOR_THEMES, type ColorThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Palette className="size-[1.2rem]" />
          <span className="sr-only">Change color theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-56 p-2">
        <div className="flex flex-col gap-1">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Color Theme
          </p>
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setColorTheme(theme.id as ColorThemeId)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                colorTheme === theme.id && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex -space-x-1">
                {Object.values(theme.previewColors).map((color, i) => (
                  <div
                    key={i}
                    className="size-5 rounded-full border-2 border-background"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex flex-1 flex-col items-start">
                <span className="font-medium">{theme.label}</span>
                <span className="text-xs text-muted-foreground">
                  {theme.description}
                </span>
              </div>
              {colorTheme === theme.id && (
                <Check className="size-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
