"use client";

import { Check, Moon, Palette, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFrameStore, useActiveDocument } from "@/lib/frame/store";
import type { AccentName, ThemeName } from "@/lib/frame/types";
import { ACCENT_ORDER, ACCENTS } from "./theme";

/**
 * ThemeMenu — simple sun/moon ghost icon button. Dropdown still exposes
 * light/dark mode + accent presets (zinc/rose/green/orange).
 *
 * Spec: trigger is just a sun/moon ghost icon (no text label).
 */
export function ThemeMenu() {
  const activeDoc = useActiveDocument();
  const setTheme = useFrameStore((s) => s.setTheme);
  const setAccent = useFrameStore((s) => s.setAccent);

  const theme = activeDoc?.theme ?? "light";
  const accent = activeDoc?.accent ?? "zinc";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Theme menu"
        >
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="eyebrow">Mode</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light" as ThemeName)} className="gap-2 text-sm">
          <Sun className="size-3.5" />
          Light
          {theme === "light" && <Check className="size-3.5 ml-auto text-blue-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark" as ThemeName)} className="gap-2 text-sm">
          <Moon className="size-3.5" />
          Dark
          {theme === "dark" && <Check className="size-3.5 ml-auto text-blue-500" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="eyebrow flex items-center gap-1.5">
          <Palette className="size-3" />
          Accent
        </DropdownMenuLabel>
        {ACCENT_ORDER.map((a) => {
          const tokens = ACCENTS[a];
          const swatch = tokens?.swatch ?? "var(--primary)";
          const active = accent === a;
          return (
            <DropdownMenuItem
              key={a}
              onClick={() => setAccent(a as AccentName)}
              className="gap-2 text-sm capitalize"
            >
              <span
                className={cn("size-3.5 rounded-full border border-zinc-200 dark:border-zinc-800")}
                style={{ background: swatch }}
              />
              {a}
              {active && <Check className="size-3.5 ml-auto text-blue-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
