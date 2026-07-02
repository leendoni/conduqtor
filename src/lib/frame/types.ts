/**
 * FRAME — data layer type contracts.
 *
 * These types are the wire-format between the registry, the Zustand store,
 * the code generator and the Task ID 2 UI. They are intentionally narrow and
 * explicit so that a stray prop cannot slip through.
 */

/** Node-level skeleton toggle. "normal" renders the real component, "skeleton" emits `<Skeleton />`. */
export type Variant = "normal" | "skeleton";

/** Allowed scalar prop values. Arrays/objects are intentionally excluded — components stay flat. */
export type PropValue = string | number | boolean | null;

/**
 * A single node in the FRAME tree.
 * - `id`           stable identity (nanoid)
 * - `component`    registry key (e.g. "button", "input", "card", "flex-row", "icon") OR the magic "root" key
 * - `variant`      node-level skeleton toggle (NOT the shadcn `variant` prop, which lives in `props`)
 * - `props`        flat key→value map of the component's editable props
 * - `children`     ordered child nodes (empty for leaf components)
 */
export interface FrameNode {
  id: string;
  component: string;
  variant: Variant;
  props: Record<string, PropValue>;
  children: FrameNode[];
}

export type ThemeName = "light" | "dark";
export type AccentName = "zinc" | "rose" | "green" | "orange";

/** A complete FRAME document — one tree + theme/accent + metadata. Persisted to localStorage. */
export interface FrameDocument {
  id: string;
  name: string;
  tree: FrameNode;
  theme: ThemeName;
  accent: AccentName;
  updatedAt: number;
}

/** Editor-side property input control kinds. */
export type PropType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "icon"
  | "color";

/** Logical grouping of props in the inspector panel (Task ID 2). */
export type PropGroup = "content" | "appearance" | "state" | "advanced";

/** Schema describing a single editable prop of a component. */
export interface PropSchema {
  key: string;
  label: string;
  type: PropType;
  group: PropGroup;
  options?: { label: string; value: string }[];
  default?: PropValue;
  placeholder?: string;
  help?: string;
}

/** Palette (left-rail) grouping for component entries. */
export type PaletteGroup =
  | "inputs"
  | "actions"
  | "navigation"
  | "data"
  | "notifications"
  | "charts"
  | "icons"
  | "containers-tailwind"
  | "containers-shadcn";

/** Full schema for one registry entry. */
export interface ComponentSchema {
  /** Unique registry key, also stored on `FrameNode.component`. */
  key: string;
  /** Human-readable display name. */
  name: string;
  /** Which palette group this component appears in. */
  group: PaletteGroup;
  /** lucide-react icon name (string) used in the palette tile. */
  icon: string;
  /** Whether the canvas allows dropping children into this node. */
  acceptsChildren: boolean;
  /** Default prop values applied by `createNode`. */
  defaultProps: Record<string, PropValue>;
  /** Editable prop schemas shown in the inspector. */
  props: PropSchema[];
  /**
   * Codegen metadata.
   * `svelteImport`: full Svelte import statement(s) joined by "; " (or "" for plain HTML elements).
   * `svelteTag`:    tag name used in markup (e.g. "Button", "div", "BarChart").
   * `isHtmlElement`: true for plain div-based containers (flex-row, flex-col, grid, box, stack).
   */
  svelteImport: string;
  svelteTag: string;
  isHtmlElement?: boolean;
  description?: string;
}

/** Metadata for a palette group (label + lucide icon). */
export interface PaletteGroupMeta {
  key: PaletteGroup;
  label: string;
  icon: string;
}
