/**
 * FRAME — lucide-react icon lookup helpers.
 *
 * Used by the palette, layers, NodeRenderer (the `icon` component), and
 * the IconPicker. The full icon set (~1500) is enumerated once at module
 * load; lookups are cached.
 */

import { createElement } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const all = LucideIcons as unknown as Record<string, unknown>;

/** Stable, sorted list of all available PascalCase icon component names. */
export const ALL_ICON_NAMES: string[] = Object.keys(all)
  .filter(
    (k) =>
      /^[A-Z]/.test(k) &&
      typeof all[k] === "function" &&
      // skip non-component exports
      !["default", "createLucideIcon", "icons", "IconBase"].includes(k),
  )
  .sort((a, b) => a.localeCompare(b));

const cache = new Map<string, LucideIcon>();

/** Resolve a PascalCase icon name to its component, falling back to HelpCircle. */
export function getLucideIcon(name: string): LucideIcon {
  if (!name) return LucideIcons.HelpCircle;
  const hit = cache.get(name);
  if (hit) return hit;
  const Cmp = (all as Record<string, LucideIcon>)[name];
  const resolved = Cmp ?? LucideIcons.HelpCircle;
  cache.set(name, resolved);
  return resolved;
}

/**
 * Stable wrapper component for rendering a lucide icon by name.
 * Uses `createElement` internally to avoid the `react-hooks/static-components`
 * lint rule (which flags capital-letter variables holding components inside
 * render). Use this everywhere you'd otherwise write
 * `const Icon = getLucideIcon(name); <Icon />`.
 */
export type DynamicIconProps = {
  name: string;
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
};

export function DynamicIcon({ name, ...rest }: DynamicIconProps) {
  return createElement(getLucideIcon(name), rest);
}

