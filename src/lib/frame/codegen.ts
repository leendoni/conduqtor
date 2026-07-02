/**
 * FRAME — tree → Svelte source serializer + JSON helpers.
 *
 * Public API:
 *   - `generateSvelte(doc)`  serialize a FRAME document into a complete `.svelte` file string
 *   - `generateJSON(doc)`    pretty-printed JSON of the document
 *   - `parseJSON(raw)`       parse + minimally validate a JSON string back into a FrameDocument
 *
 * Codegen policy (Task ID 4 + Task ID 9 composite rework):
 *  - `<script lang="ts">` block collects imports from every used component's
 *    `svelteImport` field. Imports from the SAME module path are MERGED into a
 *    single `import { A, B, C } from "modulePath";` statement (Map<path,Set<name>>).
 *    Empty/comment-only svelteImports are skipped. Composite svelteImports
 *    (e.g. date-picker pulls calendar+popover+button) split on `;` and merge.
 *  - Icons get one default import per unique `props.name`:
 *    `import {Pascal} from "@lucide/svelte/icons/{kebab}";`
 *  - Charts get one `const chartDataN = [...]` per chart.
 *  - Skeleton-mode nodes (node.variant === "skeleton") emit `<Skeleton class="w-full h-6" />`
 *    instead of their normal markup, and force the Skeleton import to be present.
 *  - Attribute emission: emit `name` (bare) for `true` booleans; `name="value"`
 *    for strings; `name={value}` for numbers. Skip `false`, `null`, and "" strings.
 *    `className` is renamed to `class`. Prop is emitted if it differs from the
 *    component's `defaultProps` OR is in the ALWAYS_EMIT set (content/value/variant/etc.).
 *  - Composite containers (Card, Dialog, Sheet, Drawer, Popover, HoverCard,
 *    Tooltip, DropdownMenu, ContextMenu, Menubar, NavigationMenu, Tabs,
 *    Accordion, Carousel, Collapsible, ButtonGroup, ScrollArea, AspectRatio,
 *    Resizable, Sidebar, Command, Field, InputGroup, Empty, Table) emit their
 *    shadcn sub-part markup with `node.children` recursively serialized into
 *    the appropriate slot. List-style children (e.g. dropdown items) are
 *    wrapped in their per-item sub-part (DropdownMenuItem, AccordionItem,
 *    TabsTrigger+TabsContent, etc.).
 *  - Root node renders its children without a wrapping tag (the editor's
 *    `className` is canvas-only, not part of the export).
 *  - Every import path is the canonical shadcn/svelte barrel:
 *    `$lib/components/ui/<component>/index.js` — paste-ready into a real
 *    SvelteKit + shadcn/svelte project with zero edits.
 */

import { getComponent } from "./registry";
import type { FrameDocument, FrameNode, PropValue } from "./types";

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

/** Props whose value should always be emitted to markup even when default. */
const ALWAYS_EMIT = new Set<string>([
  // content / value
  "text", "value", "variant", "title", "description", "triggerText", "placeholder",
  "label", "items", "options", "tabs", "menus", "columns", "rows", "data", "color",
  "name", "href", "actionText", "cancelText", "fallback", "src", "alt", "page",
  "totalPages", "width", "height", "size", "strokeWidth", "side", "orientation",
  "type", "cols", "gap", "min", "max", "step", "length", "position", "richColors",
  "closeButton", "expand", "duration", "visibleToasts",
  "pressed", "checked", "open", "disabled", "readonly", "target", "htmlFor", "id",
  "rows", "ratio", "numberOfMonths", "direction", "caption", "leftAddon",
  "rightAddon", "start", "end", "error", "align", "decorative",
  "sideOffset", "delayDuration", "skipDelayDuration", "openDelay", "closeDelay",
  "defaultValue", "loop", "activateOn", "modal", "shouldScaleBackground",
  "withHandle", "viewport", "collapsible", "showFooter", "footerText",
  "defaultOpen", "disableHoverableContent",
  // DataTable feature flags
  "sortable", "filterable", "paginated", "selectable", "pageSize",
]);

function escapeAttr(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

/** Escape text content for Svelte — avoid HTML-injection issues. */
function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** PascalCase → kebab-case (used for @lucide/svelte icon import paths). */
function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/** Convert any-case to PascalCase (icon name → Svelte component name). */
function toPascal(name: string): string {
  if (!name) return "Check";
  const parts = name.replace(/[-_\s]+/g, " ").split(" ");
  return parts
    .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
    .join("");
}

/** Parse a CSV-ish textarea (first line = headers, rest = rows). */
function parseCSV(input: string): Record<string, string | number>[] {
  const lines = input.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string | number>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const row: Record<string, string | number> = {};
    headers.forEach((h, idx) => {
      const v = cells[idx] ?? "";
      const num = Number(v);
      row[h] = v !== "" && !isNaN(num) ? num : v;
    });
    rows.push(row);
  }
  return rows;
}

function dataToJSLiteral(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "[]";
  const items = rows.map((r) => {
    const pairs = Object.entries(r).map(
      ([k, v]) => `${JSON.stringify(k)}: ${typeof v === "number" ? v : JSON.stringify(v)}`,
    );
    return `  { ${pairs.join(", ")} }`;
  });
  return `[\n${items.join(",\n")}\n]`;
}

function indentBlock(text: string, levels: number): string {
  if (levels <= 0) return text;
  const pad = "  ".repeat(levels);
  return text
    .split("\n")
    .map((l) => (l.length > 0 ? pad + l : l))
    .join("\n");
}

function splitLines(s: string): string[] {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Get the label of a child node — used by list containers (Tabs, Accordion, etc.). */
function childLabel(node: FrameNode, fallback = "Item"): string {
  const t = node.props.text ?? node.props.title ?? node.props.label ?? node.props.name;
  return t ? String(t) : fallback;
}

// ---------------------------------------------------------------------------
// Codegen context
// ---------------------------------------------------------------------------

interface GenContext {
  /** Map of module path → set of named exports to import. */
  imports: Map<string, Set<string>>;
  /** chart variable declarations to inject into the script block */
  chartVars: { name: string; literal: string }[];
  /** unique icon kebab-name → pascal import name (one default import per icon) */
  usedIcons: Map<string, string>;
  /** top-level const declarations (e.g. data + columns for DataTable) */
  constDecls: string[];
  hasSkeleton: boolean;
  chartCounter: number;
}

function newCtx(): GenContext {
  return {
    imports: new Map<string, Set<string>>(),
    chartVars: [],
    usedIcons: new Map<string, string>(),
    constDecls: [],
    hasSkeleton: false,
    chartCounter: 0,
  };
}

/**
 * Parse one or more `import { A, B } from "mod";` statements out of an
 * arbitrary string (registry svelteImport field). Returns one entry per
 * named-import statement. Default-import lines (e.g. lucide icons) and
 * comment-only lines produce no entries here — they're handled elsewhere.
 */
function parseNamedImports(stmt: string): { names: string[]; modulePath: string }[] {
  const out: { names: string[]; modulePath: string }[] = [];
  const re = /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stmt)) !== null) {
    const names = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const modulePath = m[2];
    if (names.length > 0) out.push({ names, modulePath });
  }
  return out;
}

/** Merge a parsed import statement into the ctx.imports map. */
function ensureImport(ctx: GenContext, stmt: string): void {
  const trimmed = stmt.trim();
  if (!trimmed) return;
  if (trimmed.startsWith("//")) return;
  for (const { names, modulePath } of parseNamedImports(trimmed)) {
    let set = ctx.imports.get(modulePath);
    if (!set) {
      set = new Set<string>();
      ctx.imports.set(modulePath, set);
    }
    for (const n of names) set.add(n);
  }
}

// ---------------------------------------------------------------------------
// Attribute emission
// ---------------------------------------------------------------------------

interface AttrSpec {
  name: string; // already in kebab/camel as desired for Svelte (we keep camelCase)
  value: PropValue;
}

function attrsToString(attrs: AttrSpec[]): string {
  const parts: string[] = [];
  for (const a of attrs) {
    const { name, value } = a;
    if (value === null || value === undefined) continue;
    if (typeof value === "boolean") {
      if (value) parts.push(name);
      // false → omit
    } else if (typeof value === "number") {
      parts.push(`${name}={${value}}`);
    } else if (typeof value === "string") {
      if (value === "") continue;
      parts.push(`${name}="${escapeAttr(value)}"`);
    }
  }
  return parts.length ? " " + parts.join(" ") : "";
}

/**
 * Build the attribute list for a node, given its schema + always-emit policy.
 * `className` is renamed to `class` automatically.
 */
function buildAttrs(
  node: FrameNode,
  opts: { omit?: Set<string> } = {},
): AttrSpec[] {
  const schema = getComponent(node.component);
  const out: AttrSpec[] = [];
  for (const [key, value] of Object.entries(node.props)) {
    if (opts.omit?.has(key)) continue;
    const isAlways = ALWAYS_EMIT.has(key);
    const def = schema.defaultProps[key];
    const differs = value !== def;
    if (!isAlways && !differs) continue;

    if (key === "className") {
      if (value === "" || value == null) continue;
      out.push({ name: "class", value });
      continue;
    }
    out.push({ name: key, value });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Renderers — each returns a string (possibly multi-line) already indented
// to the requested `indent` level.
// ---------------------------------------------------------------------------

function renderChildren(ctx: GenContext, children: FrameNode[], indent: number): string {
  if (children.length === 0) return "";
  return children
    .map((c) => renderNode(ctx, c, indent))
    .join("\n\n");
}

function renderNode(ctx: GenContext, node: FrameNode, indent: number): string {
  // Root: render children without a wrapping tag.
  if (node.component === "root") {
    return renderChildren(ctx, node.children, indent);
  }

  // Skeleton-mode shortcut.
  if (node.variant === "skeleton") {
    ctx.hasSkeleton = true;
    ensureImport(ctx, 'import { Skeleton } from "$lib/components/ui/skeleton/index.js";');
    return `${"  ".repeat(indent)}<Skeleton class="w-full h-6" />`;
  }

  // Unknown component (defensive).
  if (!getComponentSafe(node.component)) {
    return `${"  ".repeat(indent)}<!-- unknown component: ${node.component} -->`;
  }

  switch (node.component) {
    // ── inputs ──
    case "input": return renderInput(ctx, node, indent);
    case "textarea": return renderSimple(ctx, node, indent, "Textarea");
    case "label": return renderLabel(ctx, node, indent);
    case "checkbox": return renderCheckbox(ctx, node, indent);
    case "radio-group": return renderRadioGroup(ctx, node, indent);
    case "switch": return renderSwitch(ctx, node, indent);
    case "slider": return renderSlider(ctx, node, indent);
    case "select": return renderSelect(ctx, node, indent);
    case "combobox": return renderCombobox(ctx, node, indent);
    case "date-picker": return renderDatePicker(ctx, node, indent);
    case "input-otp": return renderInputOTP(ctx, node, indent);
    case "toggle-group": return renderToggleGroup(ctx, node, indent);
    case "calendar": return renderCalendar(ctx, node, indent);
    case "range-calendar": return renderRangeCalendar(ctx, node, indent);
    case "native-select": return renderNativeSelect(ctx, node, indent);
    case "input-group": return renderInputGroup(ctx, node, indent);
    case "command": return renderCommand(ctx, node, indent);
    case "field": return renderField(ctx, node, indent);

    // ── actions ──
    case "button": return renderButton(ctx, node, indent);
    case "button-group": return renderButtonGroup(ctx, node, indent);
    case "dropdown-menu": return renderDropdownMenu(ctx, node, indent);
    case "link": return renderLink(ctx, node, indent);
    case "toggle": return renderToggle(ctx, node, indent);

    // ── navigation ──
    case "tabs": return renderTabs(ctx, node, indent);
    case "breadcrumb": return renderBreadcrumb(ctx, node, indent);
    case "pagination": return renderPagination(ctx, node, indent);
    case "menubar": return renderMenubar(ctx, node, indent);
    case "navigation-menu": return renderNavigationMenu(ctx, node, indent);
    case "sidebar": return renderSidebar(ctx, node, indent);

    // ── data ──
    case "data-table": return renderDataTable(ctx, node, indent);
    case "table": return renderTable(ctx, node, indent);
    case "accordion": return renderAccordion(ctx, node, indent);
    case "badge": return renderBadge(ctx, node, indent);
    case "collapsible": return renderCollapsible(ctx, node, indent);
    case "tooltip": return renderTooltip(ctx, node, indent);
    case "avatar": return renderAvatar(ctx, node, indent);
    case "progress": return renderProgress(ctx, node, indent);
    case "skeleton": return renderSkeletonNode(ctx, node, indent);
    case "carousel": return renderCarousel(ctx, node, indent);
    case "context-menu": return renderContextMenu(ctx, node, indent);
    case "hover-card": return renderHoverCard(ctx, node, indent);
    case "aspect-ratio": return renderAspectRatio(ctx, node, indent);
    case "empty": return renderEmpty(ctx, node, indent);
    case "item": return renderItem(ctx, node, indent);
    case "kbd": return renderKbd(ctx, node, indent);
    case "spinner": return renderSpinner(ctx, node, indent);
    case "typography": return renderTypography(ctx, node, indent);

    // ── notifications ──
    case "alert": return renderAlert(ctx, node, indent);
    case "dialog": return renderDialog(ctx, node, indent);
    case "alert-dialog": return renderAlertDialog(ctx, node, indent);
    case "sheet": return renderSheet(ctx, node, indent);
    case "popover": return renderPopover(ctx, node, indent);
    case "drawer": return renderDrawer(ctx, node, indent);
    case "sonner": return renderSonner(ctx, node, indent);

    // ── charts ──
    case "chart-bar": return renderChart(ctx, node, indent, "BarChart");
    case "chart-line": return renderChart(ctx, node, indent, "LineChart");
    case "chart-area": return renderChart(ctx, node, indent, "AreaChart");
    case "chart-pie": return renderChart(ctx, node, indent, "PieChart");
    case "chart-donut": return renderChart(ctx, node, indent, "Donut");

    // ── icons ──
    case "icon": return renderIcon(ctx, node, indent);

    // ── containers-tailwind ──
    case "flex-row":
    case "flex-col":
    case "grid":
    case "box":
    case "stack": return renderHtmlContainer(ctx, node, indent);

    // ── containers-shadcn ──
    case "card": return renderCard(ctx, node, indent);
    case "separator": return renderSeparator(ctx, node, indent);
    case "scroll-area": return renderScrollArea(ctx, node, indent);
    case "resizable": return renderResizable(ctx, node, indent);

    default:
      return `${"  ".repeat(indent)}<!-- unimplemented: ${node.component} -->`;
  }
}

function getComponentSafe(key: string): boolean {
  try {
    getComponent(key);
    return true;
  } catch {
    return false;
  }
}

function ensureComponentImport(ctx: GenContext, key: string): void {
  const schema = getComponent(key);
  if (schema.svelteImport) {
    schema.svelteImport.split(/\s*;\s*/).forEach((s) => ensureImport(ctx, s));
  }
}

// ── concrete renderers ──

function renderInput(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "input");
  const pad = "  ".repeat(indent);
  const attrs = buildAttrs(node, { omit: new Set(["label"]) });
  const label = String(node.props.label ?? "");
  const lines: string[] = [];
  if (label) {
    ensureComponentImport(ctx, "label");
    lines.push(`${pad}<label class="text-sm font-medium" for="${escapeAttr(node.id)}">${escapeText(label)}</label>`);
  }
  lines.push(`${pad}<Input${attrsToString(attrs)} id="${escapeAttr(node.id)}" />`);
  return lines.join("\n");
}

function renderSimple(ctx: GenContext, node: FrameNode, indent: number, tag: string, importKey?: string): string {
  ensureComponentImport(ctx, importKey ?? tag.toLowerCase());
  const pad = "  ".repeat(indent);
  const attrs = buildAttrs(node, { omit: new Set(["label"]) });
  return `${pad}<${tag}${attrsToString(attrs)} />`;
}

function renderLabel(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "label");
  const pad = "  ".repeat(indent);
  const text = String(node.props.text ?? "");
  const attrs = buildAttrs(node, { omit: new Set(["text"]) });
  return `${pad}<Label${attrsToString(attrs)}>${escapeText(text)}</Label>`;
}

function renderCheckbox(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "checkbox");
  const pad = "  ".repeat(indent);
  const attrs = buildAttrs(node, { omit: new Set(["label"]) });
  const label = String(node.props.label ?? "");
  const lines = [
    `${pad}<div class="flex items-center gap-2">`,
    `${pad}  <Checkbox${attrsToString(attrs)} id="${escapeAttr(node.id)}" />`,
  ];
  if (label) {
    ensureComponentImport(ctx, "label");
    lines.push(`${pad}  <Label for="${escapeAttr(node.id)}">${escapeText(label)}</Label>`);
  }
  lines.push(`${pad}</div>`);
  return lines.join("\n");
}

function renderRadioGroup(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "radio-group");
  const pad = "  ".repeat(indent);
  const items = splitLines(String(node.props.items ?? ""));
  const attrs = buildAttrs(node, { omit: new Set(["items", "disabled"]) });
  const disabled = node.props.disabled === true ? " disabled" : "";
  const lines = [`${pad}<RadioGroup${attrsToString(attrs)}>`];
  items.forEach((it, i) => {
    const id = `${node.id}-${i}`;
    lines.push(`${pad}  <div class="flex items-center gap-2">`);
    lines.push(`${pad}    <RadioGroupItem value="${escapeAttr(it)}" id="${escapeAttr(id)}"${disabled} />`);
    lines.push(`${pad}    <Label for="${escapeAttr(id)}">${escapeText(it)}</Label>`);
    lines.push(`${pad}  </div>`);
  });
  lines.push(`${pad}</RadioGroup>`);
  return lines.join("\n");
}

function renderSwitch(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "switch");
  const pad = "  ".repeat(indent);
  const attrs = buildAttrs(node, { omit: new Set(["label"]) });
  const label = String(node.props.label ?? "");
  const lines = [`${pad}<div class="flex items-center gap-2">`, `${pad}  <Switch${attrsToString(attrs)} id="${escapeAttr(node.id)}" />`];
  if (label) {
    ensureComponentImport(ctx, "label");
    lines.push(`${pad}  <Label for="${escapeAttr(node.id)}">${escapeText(label)}</Label>`);
  }
  lines.push(`${pad}</div>`);
  return lines.join("\n");
}

function renderSlider(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "slider");
  const pad = "  ".repeat(indent);
  const value = node.props.value;
  const attrs = buildAttrs(node, { omit: new Set(["value"]) });
  const valueAttr = typeof value === "number" ? ` value={[${value}]}` : "";
  return `${pad}<Slider${attrsToString(attrs)}${valueAttr} />`;
}

function renderSelect(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "select");
  const pad = "  ".repeat(indent);
  const options = splitLines(String(node.props.options ?? ""));
  const value = String(node.props.value ?? "");
  const placeholder = String(node.props.placeholder ?? "Select…");
  const disabled = node.props.disabled === true;
  const lines = [`${pad}<Select${disabled ? " disabled" : ""}${value ? ` value="${escapeAttr(value)}"` : ""}>`];
  lines.push(`${pad}  <SelectTrigger class="w-[180px]">`);
  lines.push(`${pad}    <SelectValue placeholder="${escapeAttr(placeholder)}" />`);
  lines.push(`${pad}  </SelectTrigger>`);
  lines.push(`${pad}  <SelectContent>`);
  options.forEach((o) => {
    lines.push(`${pad}    <SelectItem value="${escapeAttr(o)}">${escapeText(o)}</SelectItem>`);
  });
  lines.push(`${pad}  </SelectContent>`, `${pad}</Select>`);
  return lines.join("\n");
}

function renderCombobox(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "combobox");
  const pad = "  ".repeat(indent);
  const value = String(node.props.value ?? "");
  const placeholder = String(node.props.placeholder ?? "Search…");
  const options = splitLines(String(node.props.options ?? ""));
  const lines = [
    `${pad}<Popover>`,
    `${pad}  <PopoverTrigger asChild>`,
    `${pad}    <button class="inline-flex h-9 w-[200px] items-center justify-between rounded-md border px-3 py-2 text-sm">`,
    `${pad}      ${value ? escapeText(value) : escapeText(placeholder)}`,
    `${pad}    </button>`,
    `${pad}  </PopoverTrigger>`,
    `${pad}  <PopoverContent class="w-[200px] p-0">`,
    `${pad}    <Command>`,
    `${pad}      <CommandInput placeholder="${escapeAttr(placeholder)}" />`,
    `${pad}      <CommandList>`,
    `${pad}        <CommandEmpty>No result.</CommandEmpty>`,
    `${pad}        <CommandGroup>`,
  ];
  options.forEach((o) => {
    lines.push(`${pad}          <CommandItem value="${escapeAttr(o)}">${escapeText(o)}</CommandItem>`);
  });
  lines.push(
    `${pad}        </CommandGroup>`,
    `${pad}      </CommandList>`,
    `${pad}    </Command>`,
    `${pad}  </PopoverContent>`,
    `${pad}</Popover>`,
  );
  return lines.join("\n");
}

function renderDatePicker(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "date-picker");
  const pad = "  ".repeat(indent);
  const value = String(node.props.value ?? "");
  const placeholder = String(node.props.placeholder ?? "Pick a date");
  return [
    `${pad}<Popover>`,
    `${pad}  <PopoverTrigger asChild>`,
    `${pad}    <Button variant="outline">${value ? escapeText(value) : escapeText(placeholder)}</Button>`,
    `${pad}  </PopoverTrigger>`,
    `${pad}  <PopoverContent class="w-auto p-0">`,
    `${pad}    <Calendar />`,
    `${pad}  </PopoverContent>`,
    `${pad}</Popover>`,
  ].join("\n");
}

function renderInputOTP(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "input-otp");
  const pad = "  ".repeat(indent);
  const len = Math.max(1, Number(node.props.length ?? 6));
  const attrs = buildAttrs(node, { omit: new Set(["length"]) });
  const lines = [`${pad}<InputOTP maxlength={${len}}${attrsToString(attrs)}>`];
  lines.push(`${pad}  <InputOTPGroup>`);
  for (let i = 0; i < len; i++) {
    lines.push(`${pad}    <InputOTPSlot index={${i}} />`);
  }
  lines.push(`${pad}  </InputOTPGroup>`, `${pad}</InputOTP>`);
  return lines.join("\n");
}

function renderToggleGroup(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "toggle-group");
  const pad = "  ".repeat(indent);
  const items = splitLines(String(node.props.items ?? ""));
  const attrs = buildAttrs(node, { omit: new Set(["items"]) });
  const lines = [`${pad}<ToggleGroup${attrsToString(attrs)}>`];
  items.forEach((it) => {
    lines.push(`${pad}  <ToggleGroupItem value="${escapeAttr(it)}">${escapeText(it)}</ToggleGroupItem>`);
  });
  lines.push(`${pad}</ToggleGroup>`);
  return lines.join("\n");
}

function renderButton(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const text = String(node.props.text ?? "");
  const attrs = buildAttrs(node, { omit: new Set(["text"]) });
  return `${pad}<Button${attrsToString(attrs)}>${escapeText(text)}</Button>`;
}

/** Composite: ButtonGroup wraps children directly. */
function renderButtonGroup(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "button-group");
  const pad = "  ".repeat(indent);
  const attrs = buildAttrs(node, { omit: new Set([]) });
  const childStr = renderChildren(ctx, node.children, indent + 1);
  if (!childStr) {
    return `${pad}<ButtonGroup${attrsToString(attrs)} />`;
  }
  return `${pad}<ButtonGroup${attrsToString(attrs)}>\n${childStr}\n${pad}</ButtonGroup>`;
}

/** Composite: DropdownMenu with trigger button + DropdownMenuContent wrapping each child as DropdownMenuItem. */
function renderDropdownMenu(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "dropdown-menu");
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Open");
  const modal = node.props.modal === false ? " modal={false}" : "";
  const lines = [
    `${pad}<DropdownMenu${modal}>`,
    `${pad}  <DropdownMenuTrigger asChild>`,
    `${pad}    <Button variant="outline">${escapeText(triggerText)}</Button>`,
    `${pad}  </DropdownMenuTrigger>`,
    `${pad}  <DropdownMenuContent>`,
  ];
  node.children.forEach((c) => {
    const label = childLabel(c);
    // If the child is a simple text-bearing node (item, label, typography,
    // button), just emit its label as a DropdownMenuItem. Otherwise render
    // the child inside an item.
    if (isSimpleTextChild(c)) {
      lines.push(`${pad}    <DropdownMenuItem>${escapeText(label)}</DropdownMenuItem>`);
    } else {
      const inner = renderNode(ctx, c, indent + 2);
      lines.push(`${pad}    <DropdownMenuItem>`);
      lines.push(indentBlock(inner, indent + 2));
      lines.push(`${pad}    </DropdownMenuItem>`);
    }
  });
  lines.push(`${pad}  </DropdownMenuContent>`, `${pad}</DropdownMenu>`);
  return lines.join("\n");
}

function renderLink(ctx: GenContext, node: FrameNode, indent: number): string {
  const pad = "  ".repeat(indent);
  const href = String(node.props.href ?? "#");
  const text = String(node.props.text ?? "Link");
  const target = String(node.props.target ?? "_self");
  const cls = String(node.props.className ?? "");
  const classAttr = cls ? ` class="${escapeAttr(cls)}"` : "";
  return `${pad}<a href="${escapeAttr(href)}" target="${escapeAttr(target)}"${classAttr}>${escapeText(text)}</a>`;
}

function renderToggle(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "toggle");
  const pad = "  ".repeat(indent);
  const label = String(node.props.label ?? "");
  const attrs = buildAttrs(node, { omit: new Set(["label"]) });
  return `${pad}<Toggle${attrsToString(attrs)} aria-label="${escapeAttr(label)}">${escapeText(label)}</Toggle>`;
}

/** Composite: Tabs — each child becomes a TabsTrigger + a TabsContent with the child's children inside. */
function renderTabs(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "tabs");
  const pad = "  ".repeat(indent);
  const orientation = String(node.props.orientation ?? "horizontal");
  const loop = node.props.loop === false ? " loop={false}" : "";
  const activateOn = String(node.props.activateOn ?? "click");
  const activateAttr = activateOn !== "click" ? ` activateOn="${escapeAttr(activateOn)}"` : "";
  const orientationAttr = orientation !== "horizontal" ? ` orientation="${escapeAttr(orientation)}"` : "";
  const valueProp = String(node.props.value ?? "");
  const valueAttr = valueProp ? ` value="${escapeAttr(valueProp)}"` : "";

  const children = node.children;
  const lines = [`${pad}<Tabs${valueAttr}${orientationAttr}${loop}${activateAttr}>`];
  lines.push(`${pad}  <TabsList>`);
  children.forEach((c, i) => {
    const v = `tab${i + 1}`;
    lines.push(`${pad}    <TabsTrigger value="${escapeAttr(v)}">${escapeText(childLabel(c))}</TabsTrigger>`);
  });
  lines.push(`${pad}  </TabsList>`);
  children.forEach((c, i) => {
    const v = `tab${i + 1}`;
    lines.push(`${pad}  <TabsContent value="${escapeAttr(v)}">`);
    const inner = renderChildren(ctx, c.children, indent + 2);
    if (inner) lines.push(indentBlock(inner, indent + 2));
    lines.push(`${pad}  </TabsContent>`);
  });
  lines.push(`${pad}</Tabs>`);
  return lines.join("\n");
}

function renderBreadcrumb(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "breadcrumb");
  const pad = "  ".repeat(indent);
  const items = splitLines(String(node.props.items ?? ""));
  const separatorStr = String(node.props.separator ?? "");
  // If the separator is a lucide icon name (PascalCase identifier), emit an icon element.
  const isIconSep = /^[A-Z][A-Za-z0-9]*$/.test(separatorStr);
  const lines = [`${pad}<Breadcrumb>`, `${pad}  <BreadcrumbList>`];
  items.forEach((it, i) => {
    if (i > 0) {
      if (separatorStr) {
        lines.push(`${pad}    <BreadcrumbSeparator>${isIconSep ? `<${separatorStr} class="size-4" />` : escapeText(separatorStr)}</BreadcrumbSeparator>`);
      } else {
        lines.push(`${pad}    <BreadcrumbSeparator />`);
      }
    }
    const isLast = i === items.length - 1;
    if (isLast) {
      lines.push(`${pad}    <BreadcrumbItem><BreadcrumbPage>${escapeText(it)}</BreadcrumbPage></BreadcrumbItem>`);
    } else {
      lines.push(`${pad}    <BreadcrumbItem><BreadcrumbLink href="#">${escapeText(it)}</BreadcrumbLink></BreadcrumbItem>`);
    }
  });
  lines.push(`${pad}  </BreadcrumbList>`, `${pad}</Breadcrumb>`);
  if (isIconSep) {
    ctx.usedIcons.set(toKebab(separatorStr), separatorStr);
  }
  return lines.join("\n");
}

function renderPagination(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "pagination");
  const pad = "  ".repeat(indent);
  const page = Number(node.props.page ?? 1);
  const total = Number(node.props.totalPages ?? 10);
  const lines = [`${pad}<Pagination>`, `${pad}  <PaginationContent>`, `${pad}    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>`];
  const start = Math.max(1, page - 1);
  const end = Math.min(total, start + 2);
  for (let i = start; i <= end; i++) {
    const active = i === page ? ' class="bg-primary text-primary-foreground"' : "";
    lines.push(`${pad}    <PaginationItem><PaginationLink href="#"${active}>${i}</PaginationLink></PaginationItem>`);
  }
  lines.push(`${pad}    <PaginationItem><PaginationNext href="#" /></PaginationItem>`, `${pad}  </PaginationContent>`, `${pad}</Pagination>`);
  return lines.join("\n");
}

/** Composite: Menubar — each child becomes a MenubarMenu (trigger = child label) with its own children as MenubarItems. */
function renderMenubar(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "menubar");
  const pad = "  ".repeat(indent);
  const lines = [`${pad}<Menubar>`];
  node.children.forEach((c) => {
    const label = childLabel(c);
    lines.push(`${pad}  <MenubarMenu>`);
    lines.push(`${pad}    <MenubarTrigger>${escapeText(label)}</MenubarTrigger>`);
    if (c.children.length > 0) {
      lines.push(`${pad}    <MenubarContent>`);
      c.children.forEach((ci) => {
        const ciLabel = childLabel(ci);
        if (isSimpleTextChild(ci)) {
          lines.push(`${pad}      <MenubarItem>${escapeText(ciLabel)}</MenubarItem>`);
        } else {
          const inner = renderNode(ctx, ci, indent + 3);
          lines.push(`${pad}      <MenubarItem>`);
          lines.push(indentBlock(inner, indent + 3));
          lines.push(`${pad}      </MenubarItem>`);
        }
      });
      lines.push(`${pad}    </MenubarContent>`);
    }
    lines.push(`${pad}  </MenubarMenu>`);
  });
  lines.push(`${pad}</Menubar>`);
  return lines.join("\n");
}

/** Composite: NavigationMenu — each child becomes a NavigationMenuItem with a trigger + content (child's own children). */
function renderNavigationMenu(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "navigation-menu");
  const pad = "  ".repeat(indent);
  const viewport = node.props.viewport === false ? false : true;
  const viewportAttr = !viewport ? ` viewport={false}` : "";
  const lines = [
    `${pad}<NavigationMenuRoot${viewportAttr}>`,
    `${pad}  <NavigationMenuList>`,
  ];
  node.children.forEach((c) => {
    const label = childLabel(c);
    lines.push(`${pad}    <NavigationMenuItem>`);
    lines.push(`${pad}      <NavigationMenuTrigger>${escapeText(label)}</NavigationMenuTrigger>`);
    if (c.children.length > 0) {
      lines.push(`${pad}      <NavigationMenuContent>`);
      const inner = renderChildren(ctx, c.children, indent + 3);
      if (inner) lines.push(indentBlock(inner, indent + 3));
      lines.push(`${pad}      </NavigationMenuContent>`);
    }
    lines.push(`${pad}    </NavigationMenuItem>`);
  });
  lines.push(`${pad}  </NavigationMenuList>`, `${pad}</NavigationMenuRoot>`);
  return lines.join("\n");
}

/** DataTable — emit a real shadcn/svelte DataTable snippet using TanStack column defs. */
function renderDataTable(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "data-table"); // pulls Table* from the table barrel
  const pad = "  ".repeat(indent);
  const cols = splitLines(String(node.props.columns ?? ""));
  const rows = parseCSV(
    // build a CSV with header row
    [cols.join(",")].concat(splitLines(String(node.props.rows ?? ""))).join("\n"),
  );
  const sortable = node.props.sortable !== false; // default true
  const filterable = node.props.filterable === true;
  const paginated = node.props.paginated === true;
  const selectable = node.props.selectable === true;
  const pageSize = Number(node.props.pageSize ?? 10);

  // Register a unique const name for data + columns
  const dataVar = `dataTableData${node.id.replace(/-/g, "").slice(0, 6)}`;
  const colsVar = `dataTableColumns${node.id.replace(/-/g, "").slice(0, 6)}`;

  // Emit the data literal as a top-level const.
  ctx.constDecls.push(`const ${dataVar} = ${dataToJSLiteral(rows)};`);

  // Build column defs — accessorKey uses the original column header string
  // (matching the data object keys emitted by parseCSV) so TanStack can read
  // values out of each row.
  const colDefs = cols.map((c) => {
    return `  { accessorKey: ${JSON.stringify(c)}, header: ${JSON.stringify(c)} }`;
  });
  const colsLiteral = `[\n${colDefs.join(",\n")}\n]`;
  ctx.constDecls.push(`const ${colsVar} = ${colsLiteral};`);

  // Feature flags as a comment block above the DataTable usage.
  const features: string[] = [];
  if (sortable) features.push("sortable");
  if (filterable) features.push("filterable");
  if (paginated) features.push(`paginated (pageSize=${pageSize})`);
  if (selectable) features.push("rowSelection");
  const featComment = features.length
    ? `${pad}<!-- DataTable features: ${features.join(", ")} — install via 'npx shadcn-svelte add data-table' -->\n`
    : `${pad}<!-- DataTable — install via 'npx shadcn-svelte add data-table' -->\n`;

  // Emit a `<DataTable {data} {columns} />` usage. We also render an inline
  // fallback Table markup so the output is visually meaningful even before
  // the user installs the DataTable component.
  const headerCells = cols.map((c) => `${pad}        <TableHead>${escapeText(c)}</TableHead>`).join("\n");
  const bodyRows = rows.map((r) => {
    const cells = cols.map((c) => {
      const v = r[c];
      return `${pad}        <TableCell>${v == null ? "" : escapeText(String(v))}</TableCell>`;
    }).join("\n");
    return `${pad}      <TableRow>\n${cells}\n${pad}      </TableRow>`;
  }).join("\n");

  return (
    featComment +
    [
      `${pad}<div class="rounded-md border">`,
      `${pad}  <!-- DataTable usage: <DataTable data={${dataVar}} columns={${colsVar}} /> -->`,
      `${pad}  <Table>`,
      `${pad}    <TableHeader>`,
      `${pad}      <TableRow>`,
      headerCells,
      `${pad}      </TableRow>`,
      `${pad}    </TableHeader>`,
      `${pad}    <TableBody>`,
      bodyRows || `${pad}      <TableRow><TableCell colSpan={${cols.length}}>No rows</TableCell></TableRow>`,
      `${pad}    </TableBody>`,
      `${pad}  </Table>`,
      `${pad}</div>`,
    ].join("\n")
  );
}

/** Composite: Table — columns/rows textareas + optional child rows. */
function renderTable(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "table");
  const pad = "  ".repeat(indent);
  const cols = splitLines(String(node.props.columns ?? ""));
  const rowLines = splitLines(String(node.props.rows ?? ""));
  const rows = rowLines.map((r) => r.split(",").map((c) => c.trim()));
  const caption = String(node.props.caption ?? "");
  const lines = [`${pad}<Table>`];
  if (caption) lines.push(`${pad}  <TableCaption>${escapeText(caption)}</TableCaption>`);
  lines.push(`${pad}  <TableHeader>`, `${pad}    <TableRow>`);
  cols.forEach((c) => lines.push(`${pad}      <TableHead>${escapeText(c)}</TableHead>`));
  lines.push(`${pad}    </TableRow>`, `${pad}  </TableHeader>`, `${pad}  <TableBody>`);
  rows.forEach((r) => {
    lines.push(`${pad}    <TableRow>`);
    cols.forEach((_, i) => lines.push(`${pad}      <TableCell>${escapeText(r[i] ?? "")}</TableCell>`));
    lines.push(`${pad}    </TableRow>`);
  });
  // Optional child rows: each child rendered as a TableRow; child's text or
  // its children become the cell content.
  node.children.forEach((c) => {
    lines.push(`${pad}    <TableRow>`);
    if (c.children.length > 0) {
      // spread each grandchild into its own cell
      c.children.forEach((gc) => {
        const inner = renderNode(ctx, gc, indent + 3);
        lines.push(`${pad}      <TableCell>`);
        lines.push(indentBlock(inner, indent + 3));
        lines.push(`${pad}      </TableCell>`);
      });
    } else {
      // single cell spanning all columns with the child's label
      lines.push(`${pad}      <TableCell colSpan={${cols.length}}>${escapeText(childLabel(c))}</TableCell>`);
    }
    lines.push(`${pad}    </TableRow>`);
  });
  lines.push(`${pad}  </TableBody>`, `${pad}</Table>`);
  return lines.join("\n");
}

/** Composite: Accordion — each child becomes an AccordionItem with trigger (label) + content (child's children). */
function renderAccordion(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "accordion");
  const pad = "  ".repeat(indent);
  const type = String(node.props.type ?? "single");
  const orientation = String(node.props.orientation ?? "vertical");
  const disabled = node.props.disabled === true ? " disabled" : "";
  const loop = node.props.loop === false ? " loop={false}" : "";
  const orientationAttr = orientation !== "vertical" ? ` orientation="${escapeAttr(orientation)}"` : "";
  const defaultValue = String(node.props.defaultValue ?? "");
  const defaultAttr = defaultValue ? ` value="${escapeAttr(defaultValue)}"` : "";

  const lines = [`${pad}<Accordion type="${escapeAttr(type)}"${orientationAttr}${disabled}${loop}${defaultAttr} class="w-full">`];
  node.children.forEach((c, i) => {
    const v = `item-${i + 1}`;
    lines.push(`${pad}  <AccordionItem value="${escapeAttr(v)}">`);
    lines.push(`${pad}    <AccordionTrigger>${escapeText(childLabel(c))}</AccordionTrigger>`);
    lines.push(`${pad}    <AccordionContent>`);
    const inner = renderChildren(ctx, c.children, indent + 3);
    if (inner) lines.push(indentBlock(inner, indent + 3));
    else lines.push(`${pad}      ${escapeText(childLabel(c))} content.`);
    lines.push(`${pad}    </AccordionContent>`);
    lines.push(`${pad}  </AccordionItem>`);
  });
  lines.push(`${pad}</Accordion>`);
  return lines.join("\n");
}

function renderBadge(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "badge");
  const pad = "  ".repeat(indent);
  const text = String(node.props.text ?? "");
  const attrs = buildAttrs(node, { omit: new Set(["text"]) });
  return `${pad}<Badge${attrsToString(attrs)}>${escapeText(text)}</Badge>`;
}

/** Composite: Collapsible — trigger button (triggerText) + CollapsibleContent with children. */
function renderCollapsible(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "collapsible");
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Toggle");
  const defaultOpen = node.props.defaultOpen === true;
  const openAttr = defaultOpen ? " defaultOpen" : "";
  const childStr = renderChildren(ctx, node.children, indent + 2);
  const lines = [
    `${pad}<Collapsible${openAttr}>`,
    `${pad}  <CollapsibleTrigger class="text-sm font-medium">${escapeText(triggerText)}</CollapsibleTrigger>`,
    `${pad}  <CollapsibleContent>`,
  ];
  if (childStr) lines.push(childStr);
  lines.push(`${pad}  </CollapsibleContent>`, `${pad}</Collapsible>`);
  return lines.join("\n");
}

/** Composite: Tooltip — wraps children as the trigger; text prop is content. */
function renderTooltip(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "tooltip");
  const pad = "  ".repeat(indent);
  const text = String(node.props.text ?? "");
  const side = String(node.props.side ?? "top");
  const align = String(node.props.align ?? "center");
  const delay = Number(node.props.delayDuration ?? 700);
  const skipDelay = Number(node.props.skipDelayDuration ?? 300);
  const disableHover = node.props.disableHoverableContent === true;

  const contentAttrs: string[] = [`side="${escapeAttr(side)}"`, `align="${escapeAttr(align)}"`];
  if (delay !== 700) contentAttrs.push(`delayDuration={${delay}}`);
  if (skipDelay !== 300) contentAttrs.push(`skipDelayDuration={${skipDelay}}`);
  if (disableHover) contentAttrs.push("disableHoverableContent");

  const childStr = renderChildren(ctx, node.children, indent + 2);
  const lines = [
    `${pad}<Tooltip>`,
    `${pad}  <TooltipTrigger asChild>`,
  ];
  if (childStr) {
    lines.push(indentBlock(childStr, indent + 2));
  } else {
    ensureComponentImport(ctx, "button");
    const triggerText = String(node.props.triggerText ?? "Hover me");
    lines.push(`${pad}    <Button variant="outline">${escapeText(triggerText)}</Button>`);
  }
  lines.push(`${pad}  </TooltipTrigger>`, `${pad}  <TooltipContent ${contentAttrs.join(" ")}>${escapeText(text)}</TooltipContent>`, `${pad}</Tooltip>`);
  return lines.join("\n");
}

function renderAvatar(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "avatar");
  const pad = "  ".repeat(indent);
  const src = String(node.props.src ?? "");
  const fallback = String(node.props.fallback ?? "CN");
  const alt = String(node.props.alt ?? "");
  const lines = [`${pad}<Avatar>`];
  if (src) lines.push(`${pad}  <AvatarImage src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />`);
  lines.push(`${pad}  <AvatarFallback>${escapeText(fallback)}</AvatarFallback>`, `${pad}</Avatar>`);
  return lines.join("\n");
}

function renderProgress(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "progress");
  const pad = "  ".repeat(indent);
  const value = Number(node.props.value ?? 0);
  const max = Number(node.props.max ?? 100);
  if (max !== 100) return `${pad}<Progress value={${value}} max={${max}} />`;
  return `${pad}<Progress value={${value}} />`;
}

function renderSkeletonNode(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "skeleton");
  const pad = "  ".repeat(indent);
  const width = String(node.props.width ?? "100%");
  const height = String(node.props.height ?? "20px");
  const extra = String(node.props.className ?? "");
  const style = `style="width: ${escapeAttr(width)}; height: ${escapeAttr(height)}"`;
  const classAttr = extra ? ` class="${escapeAttr(extra)}"` : "";
  return `${pad}<Skeleton${classAttr} ${style} />`;
}

function renderAlert(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "alert");
  const pad = "  ".repeat(indent);
  const title = String(node.props.title ?? "");
  const desc = String(node.props.description ?? "");
  const attrs = buildAttrs(node, { omit: new Set(["title", "description"]) });
  return [
    `${pad}<Alert${attrsToString(attrs)}>`,
    `${pad}  <AlertTitle>${escapeText(title)}</AlertTitle>`,
    `${pad}  <AlertDescription>${escapeText(desc)}</AlertDescription>`,
    `${pad}</Alert>`,
  ].join("\n");
}

/** Composite: Dialog — trigger button + DialogContent with header + body (children) + optional footer. */
function renderDialog(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "dialog");
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Open");
  const title = String(node.props.title ?? "");
  const desc = String(node.props.description ?? "");
  const showFooter = node.props.showFooter === true;
  const footerText = String(node.props.footerText ?? "Save changes");
  const modal = node.props.modal === false ? " modal={false}" : "";

  const childStr = renderChildren(ctx, node.children, indent + 2);
  const lines = [
    `${pad}<Dialog${modal}>`,
    `${pad}  <DialogTrigger asChild>`,
    `${pad}    <Button variant="outline">${escapeText(triggerText)}</Button>`,
    `${pad}  </DialogTrigger>`,
    `${pad}  <DialogContent>`,
    `${pad}    <DialogHeader>`,
    `${pad}      <DialogTitle>${escapeText(title)}</DialogTitle>`,
    `${pad}      <DialogDescription>${escapeText(desc)}</DialogDescription>`,
    `${pad}    </DialogHeader>`,
  ];
  if (childStr) lines.push(childStr);
  if (showFooter) {
    lines.push(`${pad}    <DialogFooter>`);
    lines.push(`${pad}      <Button>${escapeText(footerText)}</Button>`);
    lines.push(`${pad}    </DialogFooter>`);
  }
  lines.push(`${pad}  </DialogContent>`, `${pad}</Dialog>`);
  return lines.join("\n");
}

/** Composite: AlertDialog — trigger button + content with header + body (children) + footer with cancel/action. */
function renderAlertDialog(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "alert-dialog");
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "");
  const title = String(node.props.title ?? "");
  const desc = String(node.props.description ?? "");
  const actionText = String(node.props.actionText ?? "Confirm");
  const cancelText = String(node.props.cancelText ?? "Cancel");
  const modal = node.props.modal === false ? " modal={false}" : "";
  const childStr = renderChildren(ctx, node.children, indent + 2);

  const lines = [
    `${pad}<AlertDialog${modal}>`,
    `${pad}  <AlertDialogTrigger asChild>`,
    `${pad}    <Button variant="destructive">${escapeText(triggerText)}</Button>`,
    `${pad}  </AlertDialogTrigger>`,
    `${pad}  <AlertDialogContent>`,
    `${pad}    <AlertDialogHeader>`,
    `${pad}      <AlertDialogTitle>${escapeText(title)}</AlertDialogTitle>`,
    `${pad}      <AlertDialogDescription>${escapeText(desc)}</AlertDialogDescription>`,
    `${pad}    </AlertDialogHeader>`,
  ];
  if (childStr) lines.push(childStr);
  lines.push(
    `${pad}    <AlertDialogFooter>`,
    `${pad}      <AlertDialogCancel>${escapeText(cancelText)}</AlertDialogCancel>`,
    `${pad}      <AlertDialogAction>${escapeText(actionText)}</AlertDialogAction>`,
    `${pad}    </AlertDialogFooter>`,
    `${pad}  </AlertDialogContent>`,
    `${pad}</AlertDialog>`,
  );
  return lines.join("\n");
}

/** Composite: Sheet — trigger + SheetContent (with header + children). */
function renderSheet(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "sheet");
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Open");
  const side = String(node.props.side ?? "right");
  const title = String(node.props.title ?? "Sheet");
  const desc = String(node.props.description ?? "");
  const modal = node.props.modal === false ? " modal={false}" : "";
  const childStr = renderChildren(ctx, node.children, indent + 2);

  const lines = [
    `${pad}<Sheet${modal}>`,
    `${pad}  <SheetTrigger asChild>`,
    `${pad}    <Button variant="outline">${escapeText(triggerText)}</Button>`,
    `${pad}  </SheetTrigger>`,
    `${pad}  <SheetContent side="${escapeAttr(side)}">`,
    `${pad}    <SheetHeader>`,
    `${pad}      <SheetTitle>${escapeText(title)}</SheetTitle>`,
  ];
  if (desc) lines.push(`${pad}      <SheetDescription>${escapeText(desc)}</SheetDescription>`);
  lines.push(`${pad}    </SheetHeader>`);
  if (childStr) lines.push(childStr);
  lines.push(`${pad}  </SheetContent>`, `${pad}</Sheet>`);
  return lines.join("\n");
}

/** Composite: Popover — trigger + PopoverContent with children. */
function renderPopover(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "popover");
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Open");
  const align = String(node.props.align ?? "center");
  const sideOffset = Number(node.props.sideOffset ?? 4);
  const alignAttr = align !== "center" ? ` align="${escapeAttr(align)}"` : "";
  const sideOffsetAttr = sideOffset !== 4 ? ` sideOffset={${sideOffset}}` : "";
  const childStr = renderChildren(ctx, node.children, indent + 2);
  const lines = [
    `${pad}<Popover>`,
    `${pad}  <PopoverTrigger asChild>`,
    `${pad}    <Button variant="outline">${escapeText(triggerText)}</Button>`,
    `${pad}  </PopoverTrigger>`,
    `${pad}  <PopoverContent${alignAttr}${sideOffsetAttr}>`,
  ];
  if (childStr) lines.push(childStr);
  lines.push(`${pad}  </PopoverContent>`, `${pad}</Popover>`);
  return lines.join("\n");
}

/** Composite: Drawer — trigger + DrawerContent (with header + children). */
function renderDrawer(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "drawer");
  ensureComponentImport(ctx, "button");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Open");
  const title = String(node.props.title ?? "Drawer");
  const desc = String(node.props.description ?? "");
  const shouldScale = node.props.shouldScaleBackground !== false;
  const scaleAttr = shouldScale ? "" : " shouldScaleBackground={false}";
  const childStr = renderChildren(ctx, node.children, indent + 2);

  const lines = [
    `${pad}<Drawer${scaleAttr}>`,
    `${pad}  <DrawerTrigger asChild>`,
    `${pad}    <Button variant="outline">${escapeText(triggerText)}</Button>`,
    `${pad}  </DrawerTrigger>`,
    `${pad}  <DrawerContent>`,
    `${pad}    <DrawerHeader>`,
    `${pad}      <DrawerTitle>${escapeText(title)}</DrawerTitle>`,
  ];
  if (desc) lines.push(`${pad}      <DrawerDescription>${escapeText(desc)}</DrawerDescription>`);
  lines.push(`${pad}    </DrawerHeader>`);
  if (childStr) lines.push(childStr);
  lines.push(`${pad}  </DrawerContent>`, `${pad}</Drawer>`);
  return lines.join("\n");
}

/** Sonner — singleton Toaster. Emit only non-default attrs. */
function renderSonner(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "sonner");
  const pad = "  ".repeat(indent);
  const attrs: AttrSpec[] = [];
  const rc = node.props.richColors === true;
  const cb = node.props.closeButton === true;
  const pos = String(node.props.position ?? "bottom-right");
  const expand = node.props.expand === true;
  const dur = Number(node.props.duration ?? 4000);
  const vis = Number(node.props.visibleToasts ?? 3);
  if (rc) attrs.push({ name: "richColors", value: true });
  if (cb) attrs.push({ name: "closeButton", value: true });
  if (pos !== "bottom-right") attrs.push({ name: "position", value: pos });
  if (expand) attrs.push({ name: "expand", value: true });
  if (dur !== 4000) attrs.push({ name: "duration", value: dur });
  if (vis !== 3) attrs.push({ name: "visibleToasts", value: vis });
  return `${pad}<Toaster${attrsToString(attrs)} />`;
}

function renderChart(ctx: GenContext, node: FrameNode, indent: number, tag: string): string {
  ensureComponentImport(ctx, node.component);
  const pad = "  ".repeat(indent);
  const dataStr = String(node.props.data ?? "");
  const color = String(node.props.color ?? "#0f62fe");
  const rows = parseCSV(dataStr);
  ctx.chartCounter += 1;
  const varName = `chartData${ctx.chartCounter}`;
  ctx.chartVars.push({ name: varName, literal: dataToJSLiteral(rows) });
  return [
    `${pad}<div class="flex flex-col gap-2">`,
    `${pad}  <${tag} data={${varName}} stroke="${escapeAttr(color)}" />`,
    `${pad}</div>`,
  ].join("\n");
}

function renderIcon(ctx: GenContext, node: FrameNode, indent: number): string {
  const pad = "  ".repeat(indent);
  const name = String(node.props.name ?? "Check");
  const pascal = toPascal(name);
  const kebab = toKebab(name);
  ctx.usedIcons.set(kebab, pascal);
  const size = Number(node.props.size ?? 20);
  const color = String(node.props.color ?? "currentColor");
  const strokeWidth = Number(node.props.strokeWidth ?? 2);
  return `${pad}<${pascal} size={${size}} color="${escapeAttr(color)}" strokeWidth={${strokeWidth}} />`;
}

function renderHtmlContainer(ctx: GenContext, node: FrameNode, indent: number): string {
  // isHtmlElement containers — no import needed
  const pad = "  ".repeat(indent);
  const cls = String(node.props.className ?? "");
  const classAttr = cls ? ` class="${escapeAttr(cls)}"` : "";
  const childStr = renderChildren(ctx, node.children, indent + 1);
  if (!childStr) return `${pad}<div${classAttr} />`;
  return `${pad}<div${classAttr}>\n${childStr}\n${pad}</div>`;
}

/** Composite: Card — header (title/description) + CardContent (children) + optional CardFooter. */
function renderCard(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "card");
  const pad = "  ".repeat(indent);
  const title = String(node.props.title ?? "");
  const desc = String(node.props.description ?? "");
  const cls = String(node.props.className ?? "");
  const showFooter = node.props.showFooter === true;
  const footerText = String(node.props.footerText ?? "");
  const classAttr = cls ? ` class="${escapeAttr(cls)}"` : "";
  const childStr = renderChildren(ctx, node.children, indent + 2);
  const lines = [`${pad}<Card${classAttr}>`, `${pad}  <CardHeader>`];
  if (title) lines.push(`${pad}    <CardTitle>${escapeText(title)}</CardTitle>`);
  if (desc) lines.push(`${pad}    <CardDescription>${escapeText(desc)}</CardDescription>`);
  lines.push(`${pad}  </CardHeader>`, `${pad}  <CardContent>`);
  if (childStr) lines.push(childStr);
  lines.push(`${pad}  </CardContent>`);
  if (showFooter) {
    lines.push(`${pad}  <CardFooter>`);
    if (footerText) lines.push(`${pad}    ${escapeText(footerText)}`);
    lines.push(`${pad}  </CardFooter>`);
  }
  lines.push(`${pad}</Card>`);
  return lines.join("\n");
}

function renderSeparator(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "separator");
  const pad = "  ".repeat(indent);
  const orientation = String(node.props.orientation ?? "horizontal");
  const decorative = node.props.decorative === true;
  const attrs: AttrSpec[] = [{ name: "orientation", value: orientation }];
  if (decorative) attrs.push({ name: "decorative", value: true });
  return `${pad}<Separator${attrsToString(attrs)} />`;
}

function renderScrollArea(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "scroll-area");
  const pad = "  ".repeat(indent);
  const cls = String(node.props.className ?? "h-72 w-full");
  const orientation = String(node.props.orientation ?? "vertical");
  const orientAttr = orientation !== "vertical" ? ` orientation="${escapeAttr(orientation)}"` : "";
  const childStr = renderChildren(ctx, node.children, indent + 1);
  if (!childStr) return `${pad}<ScrollArea class="${escapeAttr(cls)}"${orientAttr} />`;
  return `${pad}<ScrollArea class="${escapeAttr(cls)}"${orientAttr}>\n${childStr}\n${pad}</ScrollArea>`;
}

// ---------------------------------------------------------------------------
// NEW renderers (Task ID 4 + Task ID 9 composite rework)
// ---------------------------------------------------------------------------

function renderAspectRatio(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "aspect-ratio");
  const pad = "  ".repeat(indent);
  const ratio = Number(node.props.ratio ?? 1.7778);
  const childStr = renderChildren(ctx, node.children, indent + 1);
  if (!childStr) return `${pad}<AspectRatio ratio={${ratio}} />`;
  return `${pad}<AspectRatio ratio={${ratio}}>\n${childStr}\n${pad}</AspectRatio>`;
}

function renderCalendar(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "calendar");
  const pad = "  ".repeat(indent);
  const numberOfMonths = Number(node.props.numberOfMonths ?? 1);
  const value = String(node.props.value ?? "");
  const attrs: string[] = [];
  if (value) attrs.push(`value="${escapeAttr(value)}"`);
  if (numberOfMonths !== 1) attrs.push(`numberOfMonths={${numberOfMonths}}`);
  const attrStr = attrs.length ? " " + attrs.join(" ") : "";
  return `${pad}<Calendar${attrStr} />`;
}

function renderRangeCalendar(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "range-calendar");
  const pad = "  ".repeat(indent);
  const numberOfMonths = Number(node.props.numberOfMonths ?? 1);
  const attrs: string[] = [];
  if (numberOfMonths !== 1) attrs.push(`numberOfMonths={${numberOfMonths}}`);
  const attrStr = attrs.length ? " " + attrs.join(" ") : "";
  return `${pad}<RangeCalendar${attrStr} />`;
}

function renderNativeSelect(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "native-select");
  const pad = "  ".repeat(indent);
  const options = splitLines(String(node.props.options ?? ""));
  const disabled = node.props.disabled === true;
  const lines = [`${pad}<NativeSelect${disabled ? " disabled" : ""}>`];
  options.forEach((o) => {
    lines.push(`${pad}  <NativeSelectOption value="${escapeAttr(o)}">${escapeText(o)}</NativeSelectOption>`);
  });
  lines.push(`${pad}</NativeSelect>`);
  return lines.join("\n");
}

/** Composite: InputGroup — leftAddon + child input + rightAddon. */
function renderInputGroup(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "input-group");
  ensureComponentImport(ctx, "input");
  const pad = "  ".repeat(indent);
  const leftAddon = String(node.props.leftAddon ?? "");
  const rightAddon = String(node.props.rightAddon ?? "");
  const lines = [`${pad}<InputGroup>`];
  if (leftAddon) {
    lines.push(`${pad}  <InputGroupText>${escapeText(leftAddon)}</InputGroupText>`);
  }
  if (node.children.length > 0) {
    const childStr = renderChildren(ctx, node.children, indent + 1);
    if (childStr) lines.push(childStr);
  } else {
    // Default: emit an InputGroupInput with the input's props.
    const type = String(node.props.type ?? "text");
    const placeholder = String(node.props.placeholder ?? "Enter…");
    const value = String(node.props.value ?? "");
    const inputAttrs: string[] = [`type="${escapeAttr(type)}"`, `placeholder="${escapeAttr(placeholder)}"`];
    if (value) inputAttrs.push(`value="${escapeAttr(value)}"`);
    lines.push(`${pad}  <InputGroupInput ${inputAttrs.join(" ")} />`);
  }
  if (rightAddon) {
    lines.push(`${pad}  <InputGroupText>${escapeText(rightAddon)}</InputGroupText>`);
  }
  lines.push(`${pad}</InputGroup>`);
  return lines.join("\n");
}

/** Composite: Command — CommandInput + CommandList + CommandGroup with each child as a CommandItem. */
function renderCommand(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "command");
  const pad = "  ".repeat(indent);
  const placeholder = String(node.props.placeholder ?? "Search…");
  const lines = [
    `${pad}<Command>`,
    `${pad}  <CommandInput placeholder="${escapeAttr(placeholder)}" />`,
    `${pad}  <CommandList>`,
    `${pad}    <CommandEmpty>No result.</CommandEmpty>`,
    `${pad}    <CommandGroup>`,
  ];
  node.children.forEach((c) => {
    const label = childLabel(c);
    if (isSimpleTextChild(c)) {
      lines.push(`${pad}      <CommandItem value="${escapeAttr(label)}">${escapeText(label)}</CommandItem>`);
    } else {
      const inner = renderNode(ctx, c, indent + 3);
      lines.push(`${pad}      <CommandItem>`);
      lines.push(indentBlock(inner, indent + 3));
      lines.push(`${pad}      </CommandItem>`);
    }
  });
  lines.push(`${pad}    </CommandGroup>`, `${pad}  </CommandList>`, `${pad}</Command>`);
  return lines.join("\n");
}

/** Composite: Field — FieldLabel + children (input) + FieldDescription + FieldError. */
function renderField(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "field");
  const pad = "  ".repeat(indent);
  const label = String(node.props.label ?? "Label");
  const description = String(node.props.description ?? "");
  const error = String(node.props.error ?? "");
  const orientation = String(node.props.orientation ?? "vertical");
  const orientAttr = orientation !== "vertical" ? ` orientation="${escapeAttr(orientation)}"` : "";
  const childStr = renderChildren(ctx, node.children, indent + 1);
  const lines = [`${pad}<Field${orientAttr}>`, `${pad}  <FieldLabel>${escapeText(label)}</FieldLabel>`];
  if (childStr) {
    lines.push(childStr);
  } else {
    ensureComponentImport(ctx, "input");
    lines.push(`${pad}  <Input placeholder="Enter…" />`);
  }
  if (description) lines.push(`${pad}  <FieldDescription>${escapeText(description)}</FieldDescription>`);
  if (error) lines.push(`${pad}  <FieldError>${escapeText(error)}</FieldError>`);
  lines.push(`${pad}</Field>`);
  return lines.join("\n");
}

/** Composite: Carousel — CarouselContent with each child as CarouselItem + prev/next. */
function renderCarousel(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "carousel");
  const pad = "  ".repeat(indent);
  const loop = node.props["opts-loop"] === true;
  const align = String(node.props["opts-align"] ?? "start");
  const orientation = String(node.props.orientation ?? "horizontal");
  const orientAttr = orientation !== "horizontal" ? ` orientation="${escapeAttr(orientation)}"` : "";
  const lines = [
    `${pad}<Carousel opts={{ loop: ${loop}, align: "${escapeAttr(align)}" }}${orientAttr}>`,
    `${pad}  <CarouselContent>`,
  ];
  node.children.forEach((c) => {
    const inner = renderChildren(ctx, c.children, indent + 3);
    lines.push(`${pad}    <CarouselItem>`);
    if (inner) lines.push(indentBlock(inner, indent + 3));
    else lines.push(`${pad}      <div class="flex items-center justify-center p-6 border rounded">${escapeText(childLabel(c))}</div>`);
    lines.push(`${pad}    </CarouselItem>`);
  });
  lines.push(`${pad}  </CarouselContent>`);
  lines.push(`${pad}  <CarouselPrevious />`);
  lines.push(`${pad}  <CarouselNext />`);
  lines.push(`${pad}</Carousel>`);
  return lines.join("\n");
}

/** Composite: ContextMenu — trigger area + ContextMenuContent with each child as ContextMenuItem. */
function renderContextMenu(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "context-menu");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Right-click");
  const modal = node.props.modal === false ? " modal={false}" : "";
  const lines = [
    `${pad}<ContextMenu${modal}>`,
    `${pad}  <ContextMenuTrigger class="flex h-24 w-full items-center justify-center rounded-md border border-dashed text-sm">`,
    `${pad}    ${escapeText(triggerText)}`,
    `${pad}  </ContextMenuTrigger>`,
    `${pad}  <ContextMenuContent>`,
  ];
  node.children.forEach((c) => {
    const label = childLabel(c);
    if (isSimpleTextChild(c)) {
      lines.push(`${pad}    <ContextMenuItem>${escapeText(label)}</ContextMenuItem>`);
    } else {
      const inner = renderNode(ctx, c, indent + 2);
      lines.push(`${pad}    <ContextMenuItem>`);
      lines.push(indentBlock(inner, indent + 2));
      lines.push(`${pad}    </ContextMenuItem>`);
    }
  });
  lines.push(`${pad}  </ContextMenuContent>`, `${pad}</ContextMenu>`);
  return lines.join("\n");
}

/** Composite: HoverCard — trigger + HoverCardContent with text prop OR children. */
function renderHoverCard(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "hover-card");
  const pad = "  ".repeat(indent);
  const triggerText = String(node.props.triggerText ?? "Hover me");
  const text = String(node.props.text ?? "Hover card content");
  const align = String(node.props.align ?? "center");
  const sideOffset = Number(node.props.sideOffset ?? 4);
  const openDelay = Number(node.props.openDelay ?? 700);
  const closeDelay = Number(node.props.closeDelay ?? 300);
  const alignAttr = align !== "center" ? ` align="${escapeAttr(align)}"` : "";
  const sideOffsetAttr = sideOffset !== 4 ? ` sideOffset={${sideOffset}}` : "";
  const openDelayAttr = openDelay !== 700 ? ` openDelay={${openDelay}}` : "";
  const closeDelayAttr = closeDelay !== 300 ? ` closeDelay={${closeDelay}}` : "";
  const childStr = renderChildren(ctx, node.children, indent + 2);
  const lines = [
    `${pad}<HoverCard>`,
    `${pad}  <HoverCardTrigger asChild>`,
    `${pad}    <button class="text-sm underline">${escapeText(triggerText)}</button>`,
    `${pad}  </HoverCardTrigger>`,
    `${pad}  <HoverCardContent${alignAttr}${sideOffsetAttr}${openDelayAttr}${closeDelayAttr}>`,
  ];
  if (childStr) lines.push(childStr);
  else lines.push(`${pad}    ${escapeText(text)}`);
  lines.push(`${pad}  </HoverCardContent>`, `${pad}</HoverCard>`);
  return lines.join("\n");
}

/** Composite: Empty — EmptyMedia (icon) + EmptyHeader (title/description) + children. */
function renderEmpty(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "empty");
  const pad = "  ".repeat(indent);
  const title = String(node.props.title ?? "No results");
  const desc = String(node.props.description ?? "Try adjusting your search.");
  const iconName = String(node.props.icon ?? "");
  const childStr = renderChildren(ctx, node.children, indent + 1);
  const lines = [`${pad}<Empty>`];
  if (iconName) {
    const pascal = toPascal(iconName);
    const kebab = toKebab(iconName);
    ctx.usedIcons.set(kebab, pascal);
    lines.push(`${pad}  <EmptyMedia>`);
    lines.push(`${pad}    <${pascal} class="size-8 text-muted-foreground" />`);
    lines.push(`${pad}  </EmptyMedia>`);
  }
  lines.push(`${pad}  <EmptyHeader>`);
  lines.push(`${pad}    <EmptyTitle>${escapeText(title)}</EmptyTitle>`);
  lines.push(`${pad}    <EmptyDescription>${escapeText(desc)}</EmptyDescription>`);
  lines.push(`${pad}  </EmptyHeader>`);
  if (childStr) lines.push(childStr);
  lines.push(`${pad}</Empty>`);
  return lines.join("\n");
}

function renderItem(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "item");
  const pad = "  ".repeat(indent);
  const text = String(node.props.text ?? "Item");
  const variant = String(node.props.variant ?? "default");
  const childStr = renderChildren(ctx, node.children, indent + 1);
  if (!childStr) {
    return `${pad}<Item variant="${escapeAttr(variant)}">${escapeText(text)}</Item>`;
  }
  return `${pad}<Item variant="${escapeAttr(variant)}">\n${pad}  ${escapeText(text)}\n${childStr}\n${pad}</Item>`;
}

function renderKbd(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "kbd");
  const pad = "  ".repeat(indent);
  const text = String(node.props.text ?? "⌘K");
  const size = String(node.props.size ?? "default");
  const cls = size === "sm" ? ` class="text-xs"` : size === "lg" ? ` class="text-base"` : "";
  return `${pad}<Kbd${cls}>${escapeText(text)}</Kbd>`;
}

function renderSpinner(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "spinner");
  const pad = "  ".repeat(indent);
  const size = String(node.props.size ?? "default");
  const cls = size === "sm" ? ' class="size-3"' : size === "lg" ? ' class="size-6"' : "";
  return `${pad}<Spinner${cls} />`;
}

/** Composite: Sidebar — SidebarProvider + Sidebar + SidebarContent + SidebarGroup + SidebarMenu (with each child as SidebarMenuItem). */
function renderSidebar(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "sidebar");
  const pad = "  ".repeat(indent);
  const label = String(node.props.label ?? "Application");
  const side = String(node.props.side ?? "left");
  const variant = String(node.props.variant ?? "sidebar");
  const collapsible = String(node.props.collapsible ?? "offcanvas");
  const childStr = renderChildren(ctx, node.children, indent + 5);
  const lines = [
    `${pad}<SidebarProvider>`,
    `${pad}  <Sidebar side="${escapeAttr(side)}" variant="${escapeAttr(variant)}" collapsible="${escapeAttr(collapsible)}">`,
    `${pad}    <SidebarContent>`,
    `${pad}      <SidebarGroup>`,
    `${pad}        <SidebarGroupLabel>${escapeText(label)}</SidebarGroupLabel>`,
    `${pad}        <SidebarMenu>`,
  ];
  if (node.children.length > 0) {
    node.children.forEach((c) => {
      const cLabel = childLabel(c);
      lines.push(`${pad}          <SidebarMenuItem>`);
      if (c.children.length > 0) {
        const inner = renderChildren(ctx, c.children, indent + 6);
        lines.push(`${pad}            <SidebarMenuButton>${escapeText(cLabel)}</SidebarMenuButton>`);
        if (inner) lines.push(indentBlock(inner, indent + 6));
      } else {
        lines.push(`${pad}            <SidebarMenuButton>${escapeText(cLabel)}</SidebarMenuButton>`);
      }
      lines.push(`${pad}          </SidebarMenuItem>`);
    });
  } else if (childStr) {
    lines.push(indentBlock(childStr, indent + 5));
  } else {
    lines.push(`${pad}          <SidebarMenuItem>`);
    lines.push(`${pad}            <SidebarMenuButton>${escapeText(label)}</SidebarMenuButton>`);
    lines.push(`${pad}          </SidebarMenuItem>`);
  }
  lines.push(
    `${pad}        </SidebarMenu>`,
    `${pad}      </SidebarGroup>`,
    `${pad}    </SidebarContent>`,
    `${pad}  </Sidebar>`,
    `${pad}</SidebarProvider>`,
  );
  return lines.join("\n");
}

/** Composite: Resizable — ResizablePaneGroup with children as Panes + Handles between. */
function renderResizable(ctx: GenContext, node: FrameNode, indent: number): string {
  ensureComponentImport(ctx, "resizable");
  const pad = "  ".repeat(indent);
  const direction = String(node.props.direction ?? "horizontal");
  const withHandle = node.props.withHandle !== false;
  const lines = [`${pad}<ResizablePaneGroup direction="${escapeAttr(direction)}">`];
  node.children.forEach((c, i) => {
    const inner = renderChildren(ctx, c.children, indent + 2);
    lines.push(`${pad}  <ResizablePane>`);
    if (inner) {
      lines.push(indentBlock(inner, indent + 2));
    } else {
      lines.push(`${pad}    <div class="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">${escapeText(childLabel(c, `Panel ${i + 1}`))}</div>`);
    }
    lines.push(`${pad}  </ResizablePane>`);
    // Insert a handle between panes (not after the last one)
    if (i < node.children.length - 1 && withHandle) {
      lines.push(`${pad}  <ResizableHandle withHandle />`);
    }
  });
  // Fallback when no children: emit two default panes + a handle
  if (node.children.length === 0) {
    lines.push(`${pad}  <ResizablePane />`);
    lines.push(`${pad}  <ResizableHandle withHandle />`);
    lines.push(`${pad}  <ResizablePane />`);
  }
  lines.push(`${pad}</ResizablePaneGroup>`);
  return lines.join("\n");
}

/** shadcn typography classes (mirrors `docs/src/lib/registry/ui/typography`). */
const TYPOGRAPHY_CLASSES: Record<string, string> = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  p: "leading-7 [&:not(:first-child)]:mt-6",
  lead: "text-xl text-muted-foreground",
  large: "text-lg font-semibold",
  small: "text-sm font-medium leading-none",
  muted: "text-sm text-muted-foreground",
  blockquote: "mt-6 border-l-2 pl-6 italic",
};

function renderTypography(ctx: GenContext, node: FrameNode, indent: number): string {
  void ctx; // no imports needed
  const pad = "  ".repeat(indent);
  const variant = String(node.props.variant ?? "p");
  const text = String(node.props.text ?? "");
  const cls = TYPOGRAPHY_CLASSES[variant] ?? TYPOGRAPHY_CLASSES.p;
  const tag = variant === "blockquote" || ["h1", "h2", "h3", "h4", "p"].includes(variant)
    ? variant
    : "p";
  return `${pad}<${tag} class="${escapeAttr(cls)}">${escapeText(text)}</${tag}>`;
}

/** Whether a child node is a "simple text-bearing" one — its label is the only meaningful content. */
function isSimpleTextChild(node: FrameNode): boolean {
  return (
    node.children.length === 0 &&
    ["item", "label", "typography", "button", "badge", "link", "kbd"].includes(node.component)
  );
}

// ---------------------------------------------------------------------------
// Top-level orchestrator
// ---------------------------------------------------------------------------

export function generateSvelte(doc: FrameDocument): string {
  const ctx = newCtx();
  const body = renderNode(ctx, doc.tree, 0);

  // Skeleton import if any node used skeleton variant OR there is an explicit Skeleton node.
  if (ctx.hasSkeleton || hasExplicitSkeleton(doc.tree)) {
    ensureImport(ctx, 'import { Skeleton } from "$lib/components/ui/skeleton/index.js";');
  }

  // Build script block — one merged import per module, alphabetical by module path,
  // names sorted for determinism. Icon default-imports follow (one per icon).
  const importLines: string[] = [];
  const sortedModules = Array.from(ctx.imports.keys()).sort();
  for (const mod of sortedModules) {
    const names = Array.from(ctx.imports.get(mod)!).sort();
    importLines.push(`import { ${names.join(", ")} } from "${mod}";`);
  }

  // Icon imports — default imports from @lucide/svelte/icons/<kebab>
  const sortedIcons = Array.from(ctx.usedIcons.entries()).sort(([a], [b]) => a.localeCompare(b));
  for (const [, pascal] of sortedIcons) {
    const kebab = toKebab(pascal);
    importLines.push(`import ${pascal} from "@lucide/svelte/icons/${kebab}";`);
  }

  const scriptParts: string[] = [];
  if (importLines.length > 0) {
    scriptParts.push(importLines.join("\n"));
  }
  // DataTable const declarations
  ctx.constDecls.forEach((d) => scriptParts.push(d));
  ctx.chartVars.forEach((cv) => {
    scriptParts.push(`const ${cv.name} = ${cv.literal};`);
  });

  const scriptBlock =
    scriptParts.length > 0
      ? `<script lang="ts">\n${scriptParts.join("\n")}\n</script>\n\n`
      : "";

  const header = `<!-- Generated by FRAME — SvelteKit + shadcn/svelte -->\n`;
  return `${header}${scriptBlock}${body}\n`;
}

/** Walk tree checking for explicit `skeleton` component usage. */
function hasExplicitSkeleton(node: FrameNode): boolean {
  if (node.component === "skeleton") return true;
  return node.children.some(hasExplicitSkeleton);
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

export function generateJSON(doc: FrameDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function parseJSON(raw: string): FrameDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
  return validateDocument(parsed);
}

function validateDocument(d: unknown): FrameDocument {
  if (typeof d !== "object" || d === null) {
    throw new Error("Document must be an object");
  }
  const doc = d as Record<string, unknown>;
  if (typeof doc.id !== "string") throw new Error("Document.id must be a string");
  if (typeof doc.name !== "string") throw new Error("Document.name must be a string");
  if (typeof doc.theme !== "string" || !["light", "dark"].includes(doc.theme)) {
    throw new Error('Document.theme must be "light" or "dark"');
  }
  if (typeof doc.accent !== "string" || !["zinc", "rose", "green", "orange"].includes(doc.accent)) {
    throw new Error("Document.accent must be one of zinc|rose|green|orange");
  }
  if (typeof doc.updatedAt !== "number") throw new Error("Document.updatedAt must be a number");
  if (typeof doc.tree !== "object" || doc.tree === null) throw new Error("Document.tree must be an object");
  return {
    id: doc.id,
    name: doc.name,
    tree: validateNode(doc.tree),
    theme: doc.theme as FrameDocument["theme"],
    accent: doc.accent as FrameDocument["accent"],
    updatedAt: doc.updatedAt,
  };
}

function validateNode(n: unknown): FrameNode {
  if (typeof n !== "object" || n === null) throw new Error("Node must be an object");
  const node = n as Record<string, unknown>;
  if (typeof node.id !== "string") throw new Error("Node.id must be a string");
  if (typeof node.component !== "string") throw new Error("Node.component must be a string");
  if (typeof node.variant !== "string" || !["normal", "skeleton"].includes(node.variant)) {
    throw new Error('Node.variant must be "normal" or "skeleton"');
  }
  if (typeof node.props !== "object" || node.props === null) throw new Error("Node.props must be an object");
  if (!Array.isArray(node.children)) throw new Error("Node.children must be an array");
  return {
    id: node.id,
    component: node.component,
    variant: node.variant as FrameNode["variant"],
    props: node.props as Record<string, PropValue>,
    children: (node.children as unknown[]).map(validateNode),
  };
}
