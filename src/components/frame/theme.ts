/**
 * FRAME — theme + accent application helpers.
 *
 * The store holds per-document `theme` ("light" | "dark") and `accent`
 * ("zinc" | "rose" | "green" | "orange"). The Builder mounts a single
 * effect that calls `applyTheme()` whenever the active document's theme
 * or accent changes, toggling the `.dark` class on <html> and overriding
 * the `--primary` / `--primary-foreground` / `--ring` CSS variables for
 * non-zinc accents.
 */

import type { AccentName, ThemeName } from "@/lib/frame/types";

export interface AccentTokens {
  primary: string;
  primaryForeground: string;
  ring: string;
  /** Used for the swatch chip in the menu. */
  swatch: string;
}

/**
 * oklch tokens for each accent. `zinc` is null so the stylesheet defaults
 * (neutral) are preserved — we simply remove any inline overrides.
 */
export const ACCENTS: Record<AccentName, AccentTokens | null> = {
  zinc: null,
  rose: {
    primary: "oklch(0.62 0.24 16)",
    primaryForeground: "oklch(0.98 0.01 15)",
    ring: "oklch(0.62 0.24 16)",
    swatch: "oklch(0.62 0.24 16)",
  },
  green: {
    primary: "oklch(0.55 0.16 150)",
    primaryForeground: "oklch(0.98 0.02 150)",
    ring: "oklch(0.55 0.16 150)",
    swatch: "oklch(0.55 0.16 150)",
  },
  orange: {
    primary: "oklch(0.68 0.19 55)",
    primaryForeground: "oklch(0.15 0.01 55)",
    ring: "oklch(0.68 0.19 55)",
    swatch: "oklch(0.68 0.19 55)",
  },
};

export const ACCENT_ORDER: AccentName[] = ["zinc", "rose", "green", "orange"];

/**
 * Apply theme + accent to the document root.
 * Safe to call on every render — it's idempotent.
 */
export function applyTheme(theme: ThemeName, accent: AccentName): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  const tokens = ACCENTS[accent];
  if (tokens) {
    root.style.setProperty("--primary", tokens.primary);
    root.style.setProperty("--primary-foreground", tokens.primaryForeground);
    root.style.setProperty("--ring", tokens.ring);
    root.style.setProperty("--sidebar-primary", tokens.primary);
    root.style.setProperty("--sidebar-primary-foreground", tokens.primaryForeground);
  } else {
    // zinc — clear inline overrides so the stylesheet defaults win.
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-primary-foreground");
  }
}
