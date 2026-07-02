/**
 * FRAME — component registry.
 *
 * The registry is the single source of truth for:
 *   - which components exist (palette)
 *   - what props each component exposes (inspector)
 *   - how each component imports/renders as Svelte code (codegen)
 *
 * Task ID 9 rework — composite containers with child slots:
 *   - Composite shadcn components (Card, Dialog, Sheet, Drawer, Popover,
 *     HoverCard, Tooltip, DropdownMenu, ContextMenu, Menubar,
 *     NavigationMenu, Tabs, Accordion, Carousel, Collapsible, ButtonGroup,
 *     ScrollArea, AspectRatio, Resizable, Sidebar, Command, Field,
 *     InputGroup, Empty, Table, etc.) are now `acceptsChildren: true`.
 *   - Each composite's renderer (codegen + NodeRenderer) places children
 *     into the appropriate sub-part slot; pre-seeded defaults are emitted
 *     by `createNode` so they look right out of the box.
 *   - List-style props (textarea items) are REMOVED where children now
 *     provide the content (dropdown-menu, context-menu, menubar,
 *     navigation-menu, tabs, accordion, command). They are KEPT for
 *     data-driven lists (select, native-select, radio-group,
 *     toggle-group, combobox, breadcrumb, pagination).
 *   - Sonner is fixed (see sonner schema).
 *   - Tables and Data Tables are fully customizable (columns + rows +
 *     optional children-as-rows for Table; sortable / filterable /
 *     paginated / selectable booleans for DataTable).
 *   - Missing props per shadcn/svelte source added: orientation,
 *     decorative, separator (Breadcrumb), align, side, loop, delayDuration,
 *     skipDelayDuration, max, etc.
 *
 * Task ID 2 (UI) consumes:
 *   - `PALETTE_GROUPS`     ordered left-rail groups
 *   - `COMPONENTS`         lookup table keyed by `ComponentSchema.key`
 *   - `getComponent(key)`  safe accessor (throws on unknown)
 *   - `createNode(key)`    factory producing a ready-to-insert `FrameNode`
 *   - `GROUP_LABELS`       group key → display label
 */

import { nanoid } from "nanoid";

import type {
  ComponentSchema,
  FrameNode,
  PaletteGroup,
  PaletteGroupMeta,
  PropSchema,
  PropValue,
  Variant,
} from "./types";

// ---------------------------------------------------------------------------
// Palette groups (ordered for the left-rail UI)
// ---------------------------------------------------------------------------

export const PALETTE_GROUPS: PaletteGroupMeta[] = [
  { key: "containers-tailwind", label: "Tailwind Containers", icon: "Boxes" },
  { key: "containers-shadcn", label: "Shadcn Containers", icon: "LayoutTemplate" },
  { key: "actions", label: "Actions", icon: "MousePointerClick" },
  { key: "inputs", label: "Inputs", icon: "TextCursorInput" },
  { key: "navigation", label: "Navigation", icon: "Navigation" },
  { key: "notifications", label: "Notifications", icon: "Bell" },
  { key: "data", label: "Data Display", icon: "Table2" },
  { key: "charts", label: "Charts", icon: "BarChart3" },
  { key: "icons", label: "Icons", icon: "Sparkles" },
];

export const GROUP_LABELS: Record<PaletteGroup, string> = PALETTE_GROUPS.reduce(
  (acc, g) => {
    acc[g.key] = g.label;
    return acc;
  },
  {} as Record<PaletteGroup, string>,
);

// ---------------------------------------------------------------------------
// Small prop-schema builders (keep definitions DRY and typo-resistant)
// ---------------------------------------------------------------------------

type Opt = { label: string; value: string };

const p = {
  text: (
    key: string,
    label: string,
    group: PropSchema["group"],
    extra: Partial<PropSchema> = {},
  ): PropSchema => ({ key, label, type: "text", group, ...extra }),
  textarea: (
    key: string,
    label: string,
    group: PropSchema["group"],
    extra: Partial<PropSchema> = {},
  ): PropSchema => ({ key, label, type: "textarea", group, ...extra }),
  number: (
    key: string,
    label: string,
    group: PropSchema["group"],
    extra: Partial<PropSchema> = {},
  ): PropSchema => ({ key, label, type: "number", group, ...extra }),
  boolean: (
    key: string,
    label: string,
    group: PropSchema["group"],
    extra: Partial<PropSchema> = {},
  ): PropSchema => ({ key, label, type: "boolean", group, ...extra }),
  select: (
    key: string,
    label: string,
    group: PropSchema["group"],
    options: Opt[],
    extra: Partial<PropSchema> = {},
  ): PropSchema => ({ key, label, type: "select", group, options, ...extra }),
  icon: (
    key: string,
    label: string,
    group: PropSchema["group"],
    extra: Partial<PropSchema> = {},
  ): PropSchema => ({ key, label, type: "icon", group, ...extra }),
  color: (
    key: string,
    label: string,
    group: PropSchema["group"],
    extra: Partial<PropSchema> = {},
  ): PropSchema => ({ key, label, type: "color", group, ...extra }),
};

/**
 * Build a paste-ready named-import statement for a shadcn/svelte barrel.
 * `lib("button", ["Button"])` → `import { Button } from "$lib/components/ui/button/index.js";`
 * The barrel path matches the real shadcn-svelte convention used by `shadcn-svelte add`.
 */
const lib = (path: string, names: string[]): string =>
  `import { ${names.join(", ")} } from "$lib/components/ui/${path}/index.js";`;

/** Legacy aliases kept for the existing entries — they now emit the same
 *  named-import form as `lib()` so every component's svelteImport is correct. */
const importGroup = (path: string, names: string[]): string => lib(path, names);
const importDefault = (path: string, name: string): string => lib(path, [name]);

// Shared option lists
const ORIENTATION_OPTS: Opt[] = [
  { label: "horizontal", value: "horizontal" },
  { label: "vertical", value: "vertical" },
];
const ALIGN_OPTS: Opt[] = [
  { label: "start", value: "start" },
  { label: "center", value: "center" },
  { label: "end", value: "end" },
];
const SIDE_OPTS: Opt[] = [
  { label: "top", value: "top" },
  { label: "right", value: "right" },
  { label: "bottom", value: "bottom" },
  { label: "left", value: "left" },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export const COMPONENTS: Record<string, ComponentSchema> = {
  // ─── inputs ─────────────────────────────────────────────────────────────
  input: {
    key: "input",
    name: "Input",
    group: "inputs",
    icon: "TextCursorInput",
    acceptsChildren: false,
    description: "Single-line text input.",
    svelteImport: importDefault("input", "Input"),
    svelteTag: "Input",
    defaultProps: {
      type: "text",
      placeholder: "Enter text…",
      value: "",
      disabled: false,
      label: "",
      size: "default",
    },
    props: [
      p.select("type", "Type", "appearance", [
        { label: "text", value: "text" },
        { label: "email", value: "email" },
        { label: "password", value: "password" },
        { label: "number", value: "number" },
        { label: "tel", value: "tel" },
        { label: "url", value: "url" },
        { label: "search", value: "search" },
      ], { default: "text" }),
      p.text("placeholder", "Placeholder", "content", { default: "Enter text…" }),
      p.text("value", "Value", "content", { default: "" }),
      p.text("label", "Label", "content", { default: "", help: "Optional label rendered above the input." }),
      p.boolean("disabled", "Disabled", "state", { default: false }),
      p.select("size", "Size", "appearance", [
        { label: "default", value: "default" },
        { label: "sm", value: "sm" },
        { label: "lg", value: "lg" },
      ], { default: "default", group: "advanced" }),
    ],
  },

  textarea: {
    key: "textarea",
    name: "Textarea",
    group: "inputs",
    icon: "AlignLeft",
    acceptsChildren: false,
    description: "Multi-line text input.",
    svelteImport: importDefault("textarea", "Textarea"),
    svelteTag: "Textarea",
    defaultProps: { placeholder: "Enter text…", value: "", rows: 4, disabled: false, readonly: false, label: "" },
    props: [
      p.text("placeholder", "Placeholder", "content"),
      p.text("value", "Value", "content", { default: "" }),
      p.number("rows", "Rows", "appearance", { default: 4 }),
      p.boolean("disabled", "Disabled", "state"),
      p.boolean("readonly", "Read-only", "state"),
      p.text("label", "Label", "content"),
    ],
  },

  label: {
    key: "label",
    name: "Label",
    group: "inputs",
    icon: "Type",
    acceptsChildren: false,
    description: "Form field label.",
    svelteImport: importGroup("label", ["Label"]),
    svelteTag: "Label",
    defaultProps: { text: "Label", htmlFor: "" },
    props: [
      p.text("text", "Text", "content", { default: "Label" }),
      p.text("htmlFor", "For (id)", "advanced", { default: "" }),
    ],
  },

  checkbox: {
    key: "checkbox",
    name: "Checkbox",
    group: "inputs",
    icon: "CheckSquare",
    acceptsChildren: false,
    description: "Single checkbox.",
    svelteImport: importGroup("checkbox", ["Checkbox"]),
    svelteTag: "Checkbox",
    defaultProps: { checked: false, disabled: false, label: "Accept terms", id: "" },
    props: [
      p.boolean("checked", "Checked", "state", { default: false }),
      p.boolean("disabled", "Disabled", "state"),
      p.text("label", "Label", "content", { default: "Accept terms" }),
      p.text("id", "id", "advanced"),
    ],
  },

  "radio-group": {
    key: "radio-group",
    name: "Radio Group",
    group: "inputs",
    icon: "CircleDot",
    acceptsChildren: false,
    description: "Group of radio options (one item per line).",
    svelteImport: importGroup("radio-group", ["RadioGroup", "RadioGroupItem"]),
    svelteTag: "RadioGroup",
    defaultProps: { value: "", items: "Option A\nOption B", disabled: false, orientation: "vertical" },
    props: [
      p.text("value", "Value", "state", { default: "" }),
      p.textarea("items", "Items (one per line)", "content", { default: "Option A\nOption B" }),
      p.boolean("disabled", "Disabled", "state"),
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "vertical" }),
    ],
  },

  switch: {
    key: "switch",
    name: "Switch",
    group: "inputs",
    icon: "ToggleRight",
    acceptsChildren: false,
    description: "Toggle switch.",
    svelteImport: importGroup("switch", ["Switch"]),
    svelteTag: "Switch",
    defaultProps: { checked: false, disabled: false, label: "Airplane mode" },
    props: [
      p.boolean("checked", "Checked", "state", { default: false }),
      p.boolean("disabled", "Disabled", "state"),
      p.text("label", "Label", "content", { default: "Airplane mode" }),
    ],
  },

  slider: {
    key: "slider",
    name: "Slider",
    group: "inputs",
    icon: "SlidersHorizontal",
    acceptsChildren: false,
    description: "Range slider.",
    svelteImport: importGroup("slider", ["Slider"]),
    svelteTag: "Slider",
    defaultProps: { value: 50, min: 0, max: 100, step: 1, disabled: false, orientation: "horizontal" },
    props: [
      p.number("value", "Value", "state", { default: 50 }),
      p.number("min", "Min", "appearance", { default: 0 }),
      p.number("max", "Max", "appearance", { default: 100 }),
      p.number("step", "Step", "appearance", { default: 1 }),
      p.boolean("disabled", "Disabled", "state"),
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "horizontal" }),
    ],
  },

  select: {
    key: "select",
    name: "Select",
    group: "inputs",
    icon: "ChevronDownSquare",
    acceptsChildren: false,
    description: "Dropdown select (one option per line).",
    svelteImport: importGroup("select", ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem"]),
    svelteTag: "Select",
    defaultProps: { value: "", placeholder: "Select…", options: "Apple\nBanana\nCherry", disabled: false },
    props: [
      p.text("value", "Value", "state", { default: "" }),
      p.text("placeholder", "Placeholder", "content", { default: "Select…" }),
      p.textarea("options", "Options (one per line)", "content", { default: "Apple\nBanana\nCherry" }),
      p.boolean("disabled", "Disabled", "state"),
    ],
  },

  combobox: {
    key: "combobox",
    name: "Combobox",
    group: "inputs",
    icon: "Search",
    acceptsChildren: false,
    description: "Searchable combo box (Command + Popover composition).",
    svelteImport:
      lib("command", ["Command", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem"])
      + "; " + lib("popover", ["Popover", "PopoverTrigger", "PopoverContent"]),
    svelteTag: "Popover",
    defaultProps: { value: "", placeholder: "Search…", options: "Apple\nBanana\nCherry" },
    props: [
      p.text("value", "Value", "state", { default: "" }),
      p.text("placeholder", "Placeholder", "content", { default: "Search…" }),
      p.textarea("options", "Options (one per line)", "content", { default: "Apple\nBanana\nCherry" }),
    ],
  },

  "date-picker": {
    key: "date-picker",
    name: "Date Picker",
    group: "inputs",
    icon: "Calendar",
    acceptsChildren: false,
    description: "Calendar-based date picker.",
    svelteImport: importGroup("calendar", ["Calendar"]) + "; " + importGroup("popover", ["Popover", "PopoverTrigger", "PopoverContent"]) + "; " + importGroup("button", ["Button"]),
    svelteTag: "DatePicker",
    defaultProps: { value: "", placeholder: "Pick a date" },
    props: [
      p.text("value", "Value", "state", { default: "" }),
      p.text("placeholder", "Placeholder", "content", { default: "Pick a date" }),
    ],
  },

  "input-otp": {
    key: "input-otp",
    name: "Input OTP",
    group: "inputs",
    icon: "KeyRound",
    acceptsChildren: false,
    description: "One-time-password input.",
    svelteImport: importGroup("input-otp", ["InputOTP", "InputOTPGroup", "InputOTPSlot"]),
    svelteTag: "InputOTP",
    defaultProps: { length: 6, value: "", disabled: false },
    props: [
      p.number("length", "Length", "content", { default: 6 }),
      p.text("value", "Value", "state", { default: "" }),
      p.boolean("disabled", "Disabled", "state"),
    ],
  },

  "toggle-group": {
    key: "toggle-group",
    name: "Toggle Group",
    group: "inputs",
    icon: "Group",
    acceptsChildren: false,
    description: "Group of toggle buttons (one item per line).",
    svelteImport: importGroup("toggle-group", ["ToggleGroup", "ToggleGroupItem"]),
    svelteTag: "ToggleGroup",
    defaultProps: {
      value: "", items: "A\nB\nC", type: "single", variant: "default",
      size: "default", orientation: "horizontal",
    },
    props: [
      p.text("value", "Value", "state", { default: "" }),
      p.textarea("items", "Items (one per line)", "content", { default: "A\nB\nC" }),
      p.select("type", "Type", "appearance", [
        { label: "single", value: "single" },
        { label: "multiple", value: "multiple" },
      ], { default: "single" }),
      p.select("variant", "Variant", "appearance", [
        { label: "default", value: "default" },
        { label: "outline", value: "outline" },
      ], { default: "default" }),
      p.select("size", "Size", "appearance", [
        { label: "default", value: "default" },
        { label: "sm", value: "sm" },
        { label: "lg", value: "lg" },
      ], { default: "default" }),
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "horizontal" }),
    ],
  },

  // ─── actions ────────────────────────────────────────────────────────────
  button: {
    key: "button",
    name: "Button",
    group: "actions",
    icon: "MousePointerClick",
    acceptsChildren: false,
    description: "Action button. Text is a prop, not children.",
    svelteImport: importDefault("button", "Button"),
    svelteTag: "Button",
    defaultProps: { variant: "default", size: "default", text: "Button", disabled: false, type: "button" },
    props: [
      p.select("variant", "Variant", "appearance", [
        { label: "default", value: "default" },
        { label: "secondary", value: "secondary" },
        { label: "destructive", value: "destructive" },
        { label: "outline", value: "outline" },
        { label: "ghost", value: "ghost" },
        { label: "link", value: "link" },
      ], { default: "default" }),
      p.select("size", "Size", "appearance", [
        { label: "default", value: "default" },
        { label: "xs", value: "xs" },
        { label: "sm", value: "sm" },
        { label: "lg", value: "lg" },
        { label: "icon", value: "icon" },
        { label: "icon-xs", value: "icon-xs" },
        { label: "icon-sm", value: "icon-sm" },
        { label: "icon-lg", value: "icon-lg" },
      ], { default: "default" }),
      p.text("text", "Text", "content", { default: "Button" }),
      p.boolean("disabled", "Disabled", "state"),
      p.select("type", "Type", "advanced", [
        { label: "button", value: "button" },
        { label: "submit", value: "submit" },
        { label: "reset", value: "reset" },
      ], { default: "button" }),
    ],
  },

  "button-group": {
    key: "button-group",
    name: "Button Group",
    group: "actions",
    icon: "Columns3",
    acceptsChildren: true,
    description: "Container grouping several buttons visually. Drag buttons into me.",
    svelteImport: importGroup("button-group", ["ButtonGroup"]),
    svelteTag: "ButtonGroup",
    defaultProps: { variant: "default", orientation: "horizontal" },
    props: [
      p.select("variant", "Variant", "advanced", [
        { label: "default", value: "default" },
        { label: "outline", value: "outline" },
        { label: "secondary", value: "secondary" },
      ], { default: "default" }),
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "horizontal" }),
    ],
  },

  "dropdown-menu": {
    key: "dropdown-menu",
    name: "Dropdown Menu",
    group: "actions",
    icon: "Menu",
    acceptsChildren: true,
    description: "Trigger button opening a menu. Drag items into me as children.",
    svelteImport: importGroup("dropdown-menu", ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem"]) + "; " + importDefault("button", "Button"),
    svelteTag: "DropdownMenu",
    defaultProps: { triggerText: "Open", modal: true },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Open" }),
      p.boolean("modal", "Modal", "advanced", { default: true }),
    ],
  },

  link: {
    key: "link",
    name: "Link",
    group: "actions",
    icon: "Link2",
    acceptsChildren: false,
    description: "Anchor link.",
    svelteImport: "",
    svelteTag: "a",
    isHtmlElement: true,
    defaultProps: { href: "#", text: "Link", target: "_self", className: "text-primary hover:underline" },
    props: [
      p.text("href", "Href", "content", { default: "#" }),
      p.text("text", "Text", "content", { default: "Link" }),
      p.select("target", "Target", "advanced", [
        { label: "_self", value: "_self" },
        { label: "_blank", value: "_blank" },
      ], { default: "_self" }),
      p.text("className", "Class", "advanced", { default: "text-primary hover:underline" }),
    ],
  },

  toggle: {
    key: "toggle",
    name: "Toggle",
    group: "actions",
    icon: "ToggleLeft",
    acceptsChildren: false,
    description: "Pressable toggle button.",
    svelteImport: importGroup("toggle", ["Toggle"]),
    svelteTag: "Toggle",
    defaultProps: { pressed: false, disabled: false, label: "Bold", variant: "default", size: "default" },
    props: [
      p.boolean("pressed", "Pressed", "state", { default: false }),
      p.boolean("disabled", "Disabled", "state"),
      p.text("label", "Label", "content", { default: "Bold" }),
      p.select("variant", "Variant", "appearance", [
        { label: "default", value: "default" },
        { label: "outline", value: "outline" },
      ], { default: "default" }),
      p.select("size", "Size", "appearance", [
        { label: "default", value: "default" },
        { label: "sm", value: "sm" },
        { label: "lg", value: "lg" },
      ], { default: "default" }),
    ],
  },

  // ─── navigation ─────────────────────────────────────────────────────────
  tabs: {
    key: "tabs",
    name: "Tabs",
    group: "navigation",
    icon: "PanelTop",
    acceptsChildren: true,
    description: "Tabs container. Drag child nodes in — each child becomes one tab (label = child's text/title).",
    svelteImport: importGroup("tabs", ["Tabs", "TabsList", "TabsTrigger", "TabsContent"]),
    svelteTag: "Tabs",
    defaultProps: {
      value: "", orientation: "horizontal", loop: true, activateOn: "click",
    },
    props: [
      p.text("value", "Active tab value", "state", { default: "", help: "Leave empty to use first tab." }),
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "horizontal" }),
      p.boolean("loop", "Loop keyboard", "advanced", { default: true }),
      p.select("activateOn", "Activate on", "advanced", [
        { label: "click", value: "click" },
        { label: "focus", value: "focus" },
      ], { default: "click" }),
    ],
  },

  breadcrumb: {
    key: "breadcrumb",
    name: "Breadcrumb",
    group: "navigation",
    icon: "Navigation2",
    acceptsChildren: false,
    description: "Breadcrumb trail (one item per line).",
    svelteImport: importGroup("breadcrumb", ["Breadcrumb", "BreadcrumbList", "BreadcrumbItem", "BreadcrumbLink", "BreadcrumbSeparator", "BreadcrumbPage"]),
    svelteTag: "Breadcrumb",
    defaultProps: { items: "Home\nProducts\nDetail", separator: "" },
    props: [
      p.textarea("items", "Items (one per line)", "content", { default: "Home\nProducts\nDetail" }),
      p.text("separator", "Separator (lucide name or text)", "advanced", {
        default: "", help: "Empty = default ChevronRight. Try: Slash, Dot, '/'",
      }),
    ],
  },

  pagination: {
    key: "pagination",
    name: "Pagination",
    group: "navigation",
    icon: "ChevronsRight",
    acceptsChildren: false,
    description: "Page navigation control.",
    svelteImport: importGroup("pagination", ["Pagination", "PaginationContent", "PaginationItem", "PaginationLink", "PaginationPrevious", "PaginationNext"]),
    svelteTag: "Pagination",
    defaultProps: { page: 1, totalPages: 10 },
    props: [
      p.number("page", "Current page", "content", { default: 1 }),
      p.number("totalPages", "Total pages", "content", { default: 10 }),
    ],
  },

  menubar: {
    key: "menubar",
    name: "Menubar",
    group: "navigation",
    icon: "MenuSquare",
    acceptsChildren: true,
    description: "Top-of-app menu bar. Drag child nodes in — each child becomes a MenubarMenu (label = child's text/title); a child's own children become its items.",
    svelteImport: importGroup("menubar", ["Menubar", "MenubarMenu", "MenubarTrigger", "MenubarContent", "MenubarItem"]),
    svelteTag: "Menubar",
    defaultProps: {},
    props: [],
  },

  "navigation-menu": {
    key: "navigation-menu",
    name: "Navigation Menu",
    group: "navigation",
    icon: "Menu",
    acceptsChildren: true,
    description: "Horizontal nav menu. Drag child nodes in — each child becomes a NavigationMenuItem with a trigger (label = child's text/title) + a NavigationMenuContent holding the child's own children.",
    svelteImport: importGroup("navigation-menu", ["NavigationMenuRoot", "NavigationMenuList", "NavigationMenuItem", "NavigationMenuTrigger", "NavigationMenuContent"]),
    svelteTag: "NavigationMenuRoot",
    defaultProps: { viewport: true },
    props: [
      p.boolean("viewport", "Show viewport", "advanced", { default: true }),
    ],
  },

  // ─── data ───────────────────────────────────────────────────────────────
  "data-table": {
    key: "data-table",
    name: "Data Table",
    group: "data",
    icon: "Table2",
    acceptsChildren: false,
    description: "TanStack-powered data table (first line = column headers, comma-separated rows). Toggle features below.",
    svelteImport: importGroup("table", ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"]),
    svelteTag: "DataTable",
    defaultProps: {
      columns: "Name\nAge\nCity",
      rows: "Alice,30,NYC\nBob,25,LA\nCarol,41,SF",
      sortable: true,
      filterable: false,
      paginated: true,
      selectable: false,
      pageSize: 10,
    },
    props: [
      p.textarea("columns", "Columns (one per line)", "content", { default: "Name\nAge\nCity" }),
      p.textarea("rows", "Rows (comma-separated)", "content", { default: "Alice,30,NYC\nBob,25,LA\nCarol,41,SF" }),
      p.boolean("sortable", "Sortable", "appearance", { default: true }),
      p.boolean("filterable", "Filterable", "appearance", { default: false }),
      p.boolean("paginated", "Paginated", "appearance", { default: true }),
      p.boolean("selectable", "Row selection", "appearance", { default: false }),
      p.number("pageSize", "Page size", "appearance", { default: 10 }),
    ],
  },

  accordion: {
    key: "accordion",
    name: "Accordion",
    group: "data",
    icon: "ChevronsDownUp",
    acceptsChildren: true,
    description: "Collapsible sections. Drag child nodes in — each child becomes an AccordionItem (label = child's text/title); the child's own children render as the section content.",
    svelteImport: importGroup("accordion", ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"]),
    svelteTag: "Accordion",
    defaultProps: {
      type: "single", disabled: false, loop: true, orientation: "vertical",
      defaultValue: "",
    },
    props: [
      p.select("type", "Type", "appearance", [
        { label: "single", value: "single" },
        { label: "multiple", value: "multiple" },
      ], { default: "single" }),
      p.boolean("disabled", "Disabled", "state", { default: false }),
      p.boolean("loop", "Loop keyboard", "advanced", { default: true }),
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "vertical" }),
      p.text("defaultValue", "Open value", "state", { default: "", help: "single: an item value; multiple: comma-separated." }),
    ],
  },

  badge: {
    key: "badge",
    name: "Badge",
    group: "data",
    icon: "BadgeCheck",
    acceptsChildren: false,
    description: "Small status pill.",
    svelteImport: importGroup("badge", ["Badge"]),
    svelteTag: "Badge",
    defaultProps: { variant: "default", text: "Badge" },
    props: [
      p.select("variant", "Variant", "appearance", [
        { label: "default", value: "default" },
        { label: "secondary", value: "secondary" },
        { label: "destructive", value: "destructive" },
        { label: "outline", value: "outline" },
        { label: "ghost", value: "ghost" },
        { label: "link", value: "link" },
      ], { default: "default" }),
      p.text("text", "Text", "content", { default: "Badge" }),
    ],
  },

  collapsible: {
    key: "collapsible",
    name: "Collapsible",
    group: "data",
    icon: "ChevronDownSquare",
    acceptsChildren: true,
    description: "Expandable container. Children render in CollapsibleContent.",
    svelteImport: importGroup("collapsible", ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"]),
    svelteTag: "Collapsible",
    defaultProps: { triggerText: "Toggle", open: false, defaultOpen: false },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Toggle" }),
      p.boolean("open", "Open (controlled)", "state", { default: false }),
      p.boolean("defaultOpen", "Default open", "state", { default: false }),
    ],
  },

  tooltip: {
    key: "tooltip",
    name: "Tooltip",
    group: "data",
    icon: "MessageCircle",
    acceptsChildren: true,
    description: "Wraps children and shows a tooltip on hover. Drag a component in as the trigger.",
    svelteImport: importGroup("tooltip", ["Tooltip", "TooltipTrigger", "TooltipContent"]),
    svelteTag: "Tooltip",
    defaultProps: {
      text: "Tooltip text", side: "top", align: "center",
      delayDuration: 700, skipDelayDuration: 300, disableHoverableContent: false,
      triggerText: "Hover me",
    },
    props: [
      p.text("text", "Text", "content", { default: "Tooltip text" }),
      p.select("side", "Side", "appearance", SIDE_OPTS, { default: "top" }),
      p.select("align", "Align", "appearance", ALIGN_OPTS, { default: "center" }),
      p.number("delayDuration", "Delay (ms)", "advanced", { default: 700 }),
      p.number("skipDelayDuration", "Skip delay (ms)", "advanced", { default: 300 }),
      p.boolean("disableHoverableContent", "Disable hoverable content", "advanced", { default: false }),
      p.text("triggerText", "Default trigger text", "content", { default: "Hover me", help: "Used when no child is dropped in." }),
    ],
  },

  avatar: {
    key: "avatar",
    name: "Avatar",
    group: "data",
    icon: "CircleUser",
    acceptsChildren: false,
    description: "User avatar with image + fallback initials.",
    svelteImport: importGroup("avatar", ["Avatar", "AvatarImage", "AvatarFallback"]),
    svelteTag: "Avatar",
    defaultProps: { src: "", fallback: "CN", alt: "" },
    props: [
      p.text("src", "Image src", "content", { default: "" }),
      p.text("fallback", "Fallback", "content", { default: "CN" }),
      p.text("alt", "Alt", "advanced"),
    ],
  },

  progress: {
    key: "progress",
    name: "Progress",
    group: "data",
    icon: "Gauge",
    acceptsChildren: false,
    description: "Linear progress indicator.",
    svelteImport: importGroup("progress", ["Progress"]),
    svelteTag: "Progress",
    defaultProps: { value: 33, max: 100 },
    props: [
      p.number("value", "Value", "state", { default: 33 }),
      p.number("max", "Max", "appearance", { default: 100 }),
    ],
  },

  skeleton: {
    key: "skeleton",
    name: "Skeleton",
    group: "data",
    icon: "SeparatorHorizontal",
    acceptsChildren: false,
    description: "Loading placeholder block.",
    svelteImport: importGroup("skeleton", ["Skeleton"]),
    svelteTag: "Skeleton",
    defaultProps: { width: "100%", height: "20px", className: "" },
    props: [
      p.text("width", "Width", "appearance", { default: "100%" }),
      p.text("height", "Height", "appearance", { default: "20px" }),
      p.text("className", "Class", "advanced", { default: "" }),
    ],
  },

  // ─── notifications ──────────────────────────────────────────────────────
  alert: {
    key: "alert",
    name: "Alert",
    group: "notifications",
    icon: "AlertTriangle",
    acceptsChildren: false,
    description: "Inline alert message.",
    svelteImport: importGroup("alert", ["Alert", "AlertTitle", "AlertDescription"]),
    svelteTag: "Alert",
    defaultProps: { variant: "default", title: "Heads up!", description: "You can add components to your app." },
    props: [
      p.select("variant", "Variant", "appearance", [
        { label: "default", value: "default" },
        { label: "destructive", value: "destructive" },
      ], { default: "default" }),
      p.text("title", "Title", "content", { default: "Heads up!" }),
      p.textarea("description", "Description", "content", { default: "You can add components to your app." }),
    ],
  },

  dialog: {
    key: "dialog",
    name: "Dialog",
    group: "notifications",
    icon: "PanelTopOpen",
    acceptsChildren: true,
    description: "Modal dialog triggered by a button. Children render as the dialog body.",
    svelteImport: importGroup("dialog", ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription", "DialogFooter"]) + "; " + importDefault("button", "Button"),
    svelteTag: "Dialog",
    defaultProps: {
      triggerText: "Open", title: "Dialog", description: "Dialog description",
      showFooter: false, footerText: "Save changes", modal: true,
    },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Open" }),
      p.text("title", "Title", "content", { default: "Dialog" }),
      p.text("description", "Description", "content", { default: "Dialog description" }),
      p.boolean("showFooter", "Show footer", "appearance", { default: false }),
      p.text("footerText", "Footer button text", "content", { default: "Save changes" }),
      p.boolean("modal", "Modal", "advanced", { default: true }),
    ],
  },

  "alert-dialog": {
    key: "alert-dialog",
    name: "Alert Dialog",
    group: "notifications",
    icon: "ShieldAlert",
    acceptsChildren: true,
    description: "Confirmation dialog with action + cancel. Children render as extra body content.",
    svelteImport: importGroup("alert-dialog", ["AlertDialog", "AlertDialogTrigger", "AlertDialogContent", "AlertDialogHeader", "AlertDialogFooter", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogAction", "AlertDialogCancel"]) + "; " + importDefault("button", "Button"),
    svelteTag: "AlertDialog",
    defaultProps: { triggerText: "Delete", title: "Are you sure?", description: "This action cannot be undone.", actionText: "Confirm", cancelText: "Cancel", modal: true },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Delete" }),
      p.text("title", "Title", "content", { default: "Are you sure?" }),
      p.text("description", "Description", "content", { default: "This action cannot be undone." }),
      p.text("actionText", "Action text", "content", { default: "Confirm" }),
      p.text("cancelText", "Cancel text", "content", { default: "Cancel" }),
      p.boolean("modal", "Modal", "advanced", { default: true }),
    ],
  },

  sheet: {
    key: "sheet",
    name: "Sheet",
    group: "notifications",
    icon: "PanelRight",
    acceptsChildren: true,
    description: "Slide-over panel. Children render inside SheetContent.",
    svelteImport: importGroup("sheet", ["Sheet", "SheetTrigger", "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription", "SheetFooter"]) + "; " + importDefault("button", "Button"),
    svelteTag: "Sheet",
    defaultProps: { triggerText: "Open", side: "right", title: "Sheet", description: "", modal: true },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Open" }),
      p.select("side", "Side", "appearance", SIDE_OPTS, { default: "right" }),
      p.text("title", "Title", "content", { default: "Sheet" }),
      p.text("description", "Description", "content", { default: "" }),
      p.boolean("modal", "Modal", "advanced", { default: true }),
    ],
  },

  popover: {
    key: "popover",
    name: "Popover",
    group: "notifications",
    icon: "MessageSquare",
    acceptsChildren: true,
    description: "Popover anchored to a trigger button. Children render as the popover content.",
    svelteImport: importGroup("popover", ["Popover", "PopoverTrigger", "PopoverContent"]) + "; " + importDefault("button", "Button"),
    svelteTag: "Popover",
    defaultProps: { triggerText: "Open", align: "center", sideOffset: 4, modal: false },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Open" }),
      p.select("align", "Align", "appearance", ALIGN_OPTS, { default: "center" }),
      p.number("sideOffset", "Side offset", "advanced", { default: 4 }),
      p.boolean("modal", "Modal", "advanced", { default: false }),
    ],
  },

  sonner: {
    key: "sonner",
    name: "Toaster (sonner)",
    group: "notifications",
    icon: "Bell",
    acceptsChildren: false,
    description: "Toast notification host (singleton). Mount once at the app root.",
    // shadcn/svelte's sonner barrel exports `Toaster` as a NAMED export
    // (not default). The wrapper internally integrates with mode-watcher
    // for theme + provides default icons. We import the named export.
    svelteImport: lib("sonner", ["Toaster"]),
    svelteTag: "Toaster",
    defaultProps: {
      richColors: false,
      closeButton: false,
      position: "bottom-right",
      expand: false,
      duration: 4000,
      visibleToasts: 3,
    },
    props: [
      p.boolean("richColors", "Rich colors", "appearance", { default: false }),
      p.boolean("closeButton", "Close button", "appearance", { default: false }),
      p.select("position", "Position", "appearance", [
        { label: "top-left", value: "top-left" },
        { label: "top-right", value: "top-right" },
        { label: "top-center", value: "top-center" },
        { label: "bottom-left", value: "bottom-left" },
        { label: "bottom-right", value: "bottom-right" },
        { label: "bottom-center", value: "bottom-center" },
      ], { default: "bottom-right" }),
      p.boolean("expand", "Expand on hover", "appearance", { default: false }),
      p.number("duration", "Duration (ms)", "advanced", { default: 4000 }),
      p.number("visibleToasts", "Visible toasts", "advanced", { default: 3 }),
    ],
  },

  // ─── charts (layerchart) ────────────────────────────────────────────────
  "chart-bar": {
    key: "chart-bar",
    name: "Bar Chart",
    group: "charts",
    icon: "BarChart3",
    acceptsChildren: false,
    description: "Bar chart via layerchart. Data = CSV (header row + rows).",
    svelteImport: 'import { BarChart } from "layerchart";',
    svelteTag: "BarChart",
    defaultProps: { title: "Bar Chart", data: "Month,Value\nJan,40\nFeb,65\nMar,50", color: "#0f62fe" },
    props: [
      p.text("title", "Title", "content", { default: "Bar Chart" }),
      p.textarea("data", "Data (CSV)", "content", { default: "Month,Value\nJan,40\nFeb,65\nMar,50" }),
      p.color("color", "Color", "appearance", { default: "#0f62fe" }),
    ],
  },

  "chart-line": {
    key: "chart-line",
    name: "Line Chart",
    group: "charts",
    icon: "LineChart",
    acceptsChildren: false,
    description: "Line chart via layerchart.",
    svelteImport: 'import { LineChart } from "layerchart";',
    svelteTag: "LineChart",
    defaultProps: { title: "Line Chart", data: "Month,Value\nJan,40\nFeb,65\nMar,50", color: "#0f62fe" },
    props: [
      p.text("title", "Title", "content", { default: "Line Chart" }),
      p.textarea("data", "Data (CSV)", "content", { default: "Month,Value\nJan,40\nFeb,65\nMar,50" }),
      p.color("color", "Color", "appearance", { default: "#0f62fe" }),
    ],
  },

  "chart-area": {
    key: "chart-area",
    name: "Area Chart",
    group: "charts",
    icon: "AreaChart",
    acceptsChildren: false,
    description: "Area chart via layerchart.",
    svelteImport: 'import { AreaChart } from "layerchart";',
    svelteTag: "AreaChart",
    defaultProps: { title: "Area Chart", data: "Month,Value\nJan,40\nFeb,65\nMar,50", color: "#0f62fe" },
    props: [
      p.text("title", "Title", "content", { default: "Area Chart" }),
      p.textarea("data", "Data (CSV)", "content", { default: "Month,Value\nJan,40\nFeb,65\nMar,50" }),
      p.color("color", "Color", "appearance", { default: "#0f62fe" }),
    ],
  },

  "chart-pie": {
    key: "chart-pie",
    name: "Pie Chart",
    group: "charts",
    icon: "PieChart",
    acceptsChildren: false,
    description: "Pie chart via layerchart.",
    svelteImport: 'import { PieChart } from "layerchart";',
    svelteTag: "PieChart",
    defaultProps: { title: "Pie Chart", data: "Label,Value\nA,40\nB,35\nC,25", color: "#0f62fe" },
    props: [
      p.text("title", "Title", "content", { default: "Pie Chart" }),
      p.textarea("data", "Data (CSV)", "content", { default: "Label,Value\nA,40\nB,35\nC,25" }),
      p.color("color", "Color", "appearance", { default: "#0f62fe" }),
    ],
  },

  "chart-donut": {
    key: "chart-donut",
    name: "Donut Chart",
    group: "charts",
    icon: "Donut",
    acceptsChildren: false,
    description: "Donut chart via layerchart.",
    svelteImport: 'import { Donut } from "layerchart";',
    svelteTag: "Donut",
    defaultProps: { title: "Donut Chart", data: "Label,Value\nA,40\nB,35\nC,25", color: "#0f62fe" },
    props: [
      p.text("title", "Title", "content", { default: "Donut Chart" }),
      p.textarea("data", "Data (CSV)", "content", { default: "Label,Value\nA,40\nB,35\nC,25" }),
      p.color("color", "Color", "appearance", { default: "#0f62fe" }),
    ],
  },

  // ─── icons ──────────────────────────────────────────────────────────────
  icon: {
    key: "icon",
    name: "Icon",
    group: "icons",
    icon: "Sparkles",
    acceptsChildren: false,
    description: "Lucide icon. Set `name` via the icon picker (Task 2).",
    svelteImport: "", // dynamic — emitted per-instance by codegen based on props.name
    svelteTag: "Icon", // placeholder; codegen uses the PascalCase icon name
    defaultProps: { name: "Check", size: 20, color: "currentColor", strokeWidth: 2 },
    props: [
      p.icon("name", "Icon", "content", { default: "Check" }),
      p.number("size", "Size", "appearance", { default: 20 }),
      p.text("color", "Color", "appearance", { default: "currentColor" }),
      p.number("strokeWidth", "Stroke width", "appearance", { default: 2 }),
    ],
  },

  // ─── containers-tailwind ────────────────────────────────────────────────
  "flex-row": {
    key: "flex-row",
    name: "Flex Row",
    group: "containers-tailwind",
    icon: "Rows3",
    acceptsChildren: true,
    description: "Horizontal flex container.",
    svelteImport: "",
    svelteTag: "div",
    isHtmlElement: true,
    defaultProps: { className: "flex flex-row items-center gap-4" },
    props: [
      p.text("className", "Tailwind classes", "content", { default: "flex flex-row items-center gap-4" }),
    ],
  },

  "flex-col": {
    key: "flex-col",
    name: "Flex Column",
    group: "containers-tailwind",
    icon: "Columns3",
    acceptsChildren: true,
    description: "Vertical flex container.",
    svelteImport: "",
    svelteTag: "div",
    isHtmlElement: true,
    defaultProps: { className: "flex flex-col gap-4" },
    props: [
      p.text("className", "Tailwind classes", "content", { default: "flex flex-col gap-4" }),
    ],
  },

  grid: {
    key: "grid",
    name: "Grid",
    group: "containers-tailwind",
    icon: "LayoutGrid",
    acceptsChildren: true,
    description: "CSS grid container.",
    svelteImport: "",
    svelteTag: "div",
    isHtmlElement: true,
    defaultProps: { className: "grid grid-cols-2 gap-4", cols: 2, gap: 4 },
    props: [
      p.text("className", "Tailwind classes", "content", { default: "grid grid-cols-2 gap-4" }),
      p.number("cols", "Columns", "appearance", { default: 2 }),
      p.number("gap", "Gap (px)", "appearance", { default: 4 }),
    ],
  },

  box: {
    key: "box",
    name: "Box",
    group: "containers-tailwind",
    icon: "Square",
    acceptsChildren: true,
    description: "Generic bordered/padded box.",
    svelteImport: "",
    svelteTag: "div",
    isHtmlElement: true,
    defaultProps: { className: "p-4 border rounded" },
    props: [
      p.text("className", "Tailwind classes", "content", { default: "p-4 border rounded" }),
    ],
  },

  stack: {
    key: "stack",
    name: "Stack",
    group: "containers-tailwind",
    icon: "AlignVerticalJustifyCenter",
    acceptsChildren: true,
    description: "Tight vertical stack.",
    svelteImport: "",
    svelteTag: "div",
    isHtmlElement: true,
    defaultProps: { className: "flex flex-col gap-2" },
    props: [
      p.text("className", "Tailwind classes", "content", { default: "flex flex-col gap-2" }),
    ],
  },

  // ─── containers-shadcn ──────────────────────────────────────────────────
  card: {
    key: "card",
    name: "Card",
    group: "containers-shadcn",
    icon: "Square",
    acceptsChildren: true,
    description: "shadcn Card with header + content area. Children render in CardContent.",
    svelteImport: importGroup("card", ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter"]),
    svelteTag: "Card",
    defaultProps: {
      title: "Card title", description: "Card description",
      showFooter: false, footerText: "", className: "",
    },
    props: [
      p.text("title", "Title", "content", { default: "Card title" }),
      p.text("description", "Description", "content", { default: "Card description" }),
      p.boolean("showFooter", "Show footer", "appearance", { default: false }),
      p.text("footerText", "Footer text", "content", { default: "" }),
      p.text("className", "Class", "advanced", { default: "" }),
    ],
  },

  separator: {
    key: "separator",
    name: "Separator",
    group: "containers-shadcn",
    icon: "SeparatorHorizontal",
    acceptsChildren: false,
    description: "Horizontal/vertical divider.",
    svelteImport: importGroup("separator", ["Separator"]),
    svelteTag: "Separator",
    defaultProps: { orientation: "horizontal", decorative: false },
    props: [
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "horizontal" }),
      p.boolean("decorative", "Decorative", "advanced", { default: false }),
    ],
  },

  "scroll-area": {
    key: "scroll-area",
    name: "Scroll Area",
    group: "containers-shadcn",
    icon: "ScrollText",
    acceptsChildren: true,
    description: "Custom-scrollbar container.",
    svelteImport: importGroup("scroll-area", ["ScrollArea"]),
    svelteTag: "ScrollArea",
    defaultProps: { className: "h-72 w-full", orientation: "vertical" },
    props: [
      p.text("className", "Class", "advanced", { default: "h-72 w-full" }),
      p.select("orientation", "Scrollbar", "appearance", [
        { label: "vertical", value: "vertical" },
        { label: "horizontal", value: "horizontal" },
        { label: "both", value: "both" },
      ], { default: "vertical" }),
    ],
  },

  // ─── shadcn/svelte additions (Task ID 4 + Task ID 9 rework) ────────────
  // Each entry below fills a gap in the original 44-component palette so the
  // full shadcn/svelte component set is represented. Imports use the canonical
  // `$lib/components/ui/<x>/index.js` barrel with named exports — exactly
  // what `shadcn-svelte add` produces — so codegen output is paste-ready.

  "aspect-ratio": {
    key: "aspect-ratio",
    name: "Aspect Ratio",
    group: "data",
    icon: "Scaling",
    acceptsChildren: true,
    description: "Locks children to a fixed aspect ratio.",
    svelteImport: importGroup("aspect-ratio", ["AspectRatio"]),
    svelteTag: "AspectRatio",
    defaultProps: { ratio: 1.7778 },
    props: [
      p.number("ratio", "Ratio (w/h)", "appearance", { default: 1.7778, help: "16:9 ≈ 1.7778, 4:3 ≈ 1.3333, 1:1 = 1." }),
    ],
  },

  calendar: {
    key: "calendar",
    name: "Calendar",
    group: "inputs",
    icon: "Calendar",
    acceptsChildren: false,
    description: "Date picker calendar (bits-ui based).",
    svelteImport: importGroup("calendar", ["Calendar"]),
    svelteTag: "Calendar",
    defaultProps: { value: "", numberOfMonths: 1 },
    props: [
      p.text("value", "Value (ISO)", "state", { default: "" }),
      p.number("numberOfMonths", "Months shown", "appearance", { default: 1 }),
    ],
  },

  carousel: {
    key: "carousel",
    name: "Carousel",
    group: "data",
    icon: "GalleryHorizontalEnd",
    acceptsChildren: true,
    description: "Embla-powered carousel with prev/next controls. Drag child nodes in — each child becomes a CarouselItem.",
    svelteImport: importGroup("carousel", ["Carousel", "CarouselContent", "CarouselItem", "CarouselPrevious", "CarouselNext"]),
    svelteTag: "Carousel",
    defaultProps: {
      "opts-loop": false, "opts-align": "start", orientation: "horizontal",
    },
    props: [
      p.boolean("opts-loop", "Loop", "appearance", { default: false }),
      p.select("opts-align", "Align", "appearance", [
        { label: "start", value: "start" },
        { label: "center", value: "center" },
        { label: "end", value: "end" },
      ], { default: "start" }),
      p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, { default: "horizontal" }),
    ],
  },

  command: {
    key: "command",
    name: "Command",
    group: "inputs",
    icon: "Command",
    acceptsChildren: true,
    description: "cmdk-powered command palette. Drag child nodes in — each child becomes a CommandItem.",
    svelteImport: importGroup("command", ["Command", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem"]),
    svelteTag: "Command",
    defaultProps: { placeholder: "Search…" },
    props: [
      p.text("placeholder", "Placeholder", "content", { default: "Search…" }),
    ],
  },

  "context-menu": {
    key: "context-menu",
    name: "Context Menu",
    group: "data",
    icon: "MousePointerClick",
    acceptsChildren: true,
    description: "Right-click menu. Drag child nodes in — each child becomes a ContextMenuItem.",
    svelteImport: importGroup("context-menu", ["ContextMenu", "ContextMenuTrigger", "ContextMenuContent", "ContextMenuItem"]),
    svelteTag: "ContextMenu",
    defaultProps: { triggerText: "Right-click here", modal: true },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Right-click here" }),
      p.boolean("modal", "Modal", "advanced", { default: true }),
    ],
  },

  drawer: {
    key: "drawer",
    name: "Drawer",
    group: "notifications",
    icon: "PanelBottomOpen",
    acceptsChildren: true,
    description: "Vaul-powered slide-over drawer. Children render inside DrawerContent.",
    svelteImport: importGroup("drawer", ["Drawer", "DrawerTrigger", "DrawerContent", "DrawerHeader", "DrawerTitle", "DrawerDescription", "DrawerFooter"]) + "; " + importGroup("button", ["Button"]),
    svelteTag: "Drawer",
    defaultProps: { triggerText: "Open", title: "Drawer", description: "", side: "bottom", shouldScaleBackground: true },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Open" }),
      p.text("title", "Title", "content", { default: "Drawer" }),
      p.text("description", "Description", "content", { default: "" }),
      p.select("side", "Side", "appearance", SIDE_OPTS, { default: "bottom" }),
      p.boolean("shouldScaleBackground", "Scale background", "advanced", { default: true }),
    ],
  },

  empty: {
    key: "empty",
    name: "Empty",
    group: "data",
    icon: "SearchX",
    acceptsChildren: true,
    description: "Empty-state placeholder (icon + title + description). Drop children below for an action.",
    svelteImport: importGroup("empty", ["Empty", "EmptyMedia", "EmptyHeader", "EmptyTitle", "EmptyDescription", "EmptyContent"]),
    svelteTag: "Empty",
    defaultProps: { title: "No results", description: "Try adjusting your search.", icon: "Search" },
    props: [
      p.text("title", "Title", "content", { default: "No results" }),
      p.text("description", "Description", "content", { default: "Try adjusting your search." }),
      p.icon("icon", "Icon (lucide name)", "content", { default: "Search" }),
    ],
  },

  field: {
    key: "field",
    name: "Field",
    group: "inputs",
    icon: "FormInput",
    acceptsChildren: true,
    description: "Form field wrapper (label + input + description + error). Drag an Input/Select/etc. INTO me.",
    svelteImport: importGroup("field", ["Field", "FieldLabel", "FieldDescription", "FieldError"]),
    svelteTag: "Field",
    defaultProps: { label: "Email", description: "", error: "", orientation: "vertical" },
    props: [
      p.text("label", "Label", "content", { default: "Email" }),
      p.text("description", "Description", "advanced", { default: "" }),
      p.text("error", "Error", "state", { default: "" }),
      p.select("orientation", "Orientation", "appearance", [
        { label: "vertical", value: "vertical" },
        { label: "horizontal", value: "horizontal" },
        { label: "responsive", value: "responsive" },
      ], { default: "vertical" }),
    ],
  },

  "hover-card": {
    key: "hover-card",
    name: "Hover Card",
    group: "data",
    icon: "SquareMousePointer",
    acceptsChildren: true,
    description: "Card shown on hover over a trigger. Drop children into me as the content.",
    svelteImport: importGroup("hover-card", ["HoverCard", "HoverCardTrigger", "HoverCardContent"]),
    svelteTag: "HoverCard",
    defaultProps: {
      triggerText: "Hover me", text: "Hover card content",
      align: "center", sideOffset: 4, openDelay: 700, closeDelay: 300,
    },
    props: [
      p.text("triggerText", "Trigger text", "content", { default: "Hover me" }),
      p.text("text", "Content (used if no children)", "content", { default: "Hover card content" }),
      p.select("align", "Align", "appearance", ALIGN_OPTS, { default: "center" }),
      p.number("sideOffset", "Side offset", "advanced", { default: 4 }),
      p.number("openDelay", "Open delay (ms)", "advanced", { default: 700 }),
      p.number("closeDelay", "Close delay (ms)", "advanced", { default: 300 }),
    ],
  },

  "input-group": {
    key: "input-group",
    name: "Input Group",
    group: "inputs",
    icon: "Combine",
    acceptsChildren: true,
    description: "Input with left/right addons. Drag an Input INTO me as the main control; leftAddon/rightAddon props render the side text.",
    svelteImport: importGroup("input-group", ["InputGroup", "InputGroupInput", "InputGroupText"]),
    svelteTag: "InputGroup",
    defaultProps: {
      placeholder: "Enter…", value: "", type: "text",
      leftAddon: "", rightAddon: "",
    },
    props: [
      p.text("placeholder", "Placeholder", "content", { default: "Enter…" }),
      p.text("value", "Value", "state", { default: "" }),
      p.select("type", "Type", "appearance", [
        { label: "text", value: "text" },
        { label: "email", value: "email" },
        { label: "password", value: "password" },
        { label: "number", value: "number" },
      ], { default: "text" }),
      p.text("leftAddon", "Left addon", "content", { default: "" }),
      p.text("rightAddon", "Right addon", "content", { default: "" }),
    ],
  },

  item: {
    key: "item",
    name: "Item",
    group: "data",
    icon: "Square",
    acceptsChildren: true,
    description: "Generic list-item primitive (shadcn Item). Useful as a child of dropdown/context menus, etc.",
    svelteImport: importGroup("item", ["Item"]),
    svelteTag: "Item",
    defaultProps: { text: "Item", variant: "default" },
    props: [
      p.text("text", "Text", "content", { default: "Item" }),
      p.select("variant", "Variant", "appearance", [
        { label: "default", value: "default" },
        { label: "destructive", value: "destructive" },
      ], { default: "default" }),
    ],
  },

  kbd: {
    key: "kbd",
    name: "Kbd",
    group: "data",
    icon: "Keyboard",
    acceptsChildren: false,
    description: "Keyboard shortcut pill.",
    svelteImport: importGroup("kbd", ["Kbd"]),
    svelteTag: "Kbd",
    defaultProps: { text: "⌘K", size: "default" },
    props: [
      p.text("text", "Text", "content", { default: "⌘K" }),
      p.select("size", "Size", "appearance", [
        { label: "default", value: "default" },
        { label: "sm", value: "sm" },
        { label: "lg", value: "lg" },
      ], { default: "default" }),
    ],
  },

  "native-select": {
    key: "native-select",
    name: "Native Select",
    group: "inputs",
    icon: "ChevronDown",
    acceptsChildren: false,
    description: "Plain HTML <select> styled by shadcn.",
    svelteImport: importGroup("native-select", ["NativeSelect", "NativeSelectOption"]),
    svelteTag: "NativeSelect",
    defaultProps: { value: "", options: "Apple\nBanana\nCherry", disabled: false },
    props: [
      p.text("value", "Value", "state", { default: "" }),
      p.textarea("options", "Options (one per line)", "content", { default: "Apple\nBanana\nCherry" }),
      p.boolean("disabled", "Disabled", "state", { default: false }),
    ],
  },

  "range-calendar": {
    key: "range-calendar",
    name: "Range Calendar",
    group: "inputs",
    icon: "CalendarRange",
    acceptsChildren: false,
    description: "Calendar that picks a start/end date range.",
    svelteImport: importGroup("range-calendar", ["RangeCalendar"]),
    svelteTag: "RangeCalendar",
    defaultProps: { start: "", end: "", numberOfMonths: 1 },
    props: [
      p.text("start", "Start (ISO)", "state", { default: "" }),
      p.text("end", "End (ISO)", "state", { default: "" }),
      p.number("numberOfMonths", "Months shown", "appearance", { default: 1 }),
    ],
  },

  resizable: {
    key: "resizable",
    name: "Resizable",
    group: "containers-shadcn",
    icon: "PanelLeft",
    acceptsChildren: true,
    description: "Resizable panel group (paneforge based). Drag child nodes in — each child becomes a ResizablePane (handles auto-inserted between).",
    svelteImport: importGroup("resizable", ["ResizablePaneGroup", "ResizablePane", "ResizableHandle"]),
    svelteTag: "ResizablePaneGroup",
    defaultProps: { direction: "horizontal", withHandle: true },
    props: [
      p.select("direction", "Direction", "appearance", ORIENTATION_OPTS, { default: "horizontal" }),
      p.boolean("withHandle", "Show handle", "appearance", { default: true }),
    ],
  },

  sidebar: {
    key: "sidebar",
    name: "Sidebar",
    group: "navigation",
    icon: "PanelLeft",
    acceptsChildren: true,
    description: "Application sidebar. Drag child nodes in — each child becomes a SidebarMenuItem/SidebarMenuButton.",
    svelteImport: importGroup("sidebar", ["SidebarProvider", "Sidebar", "SidebarContent", "SidebarGroup", "SidebarGroupLabel", "SidebarMenu", "SidebarMenuItem", "SidebarMenuButton"]),
    svelteTag: "Sidebar",
    defaultProps: { label: "Application", side: "left", variant: "sidebar", collapsible: "offcanvas" },
    props: [
      p.text("label", "Group label", "content", { default: "Application" }),
      p.select("side", "Side", "appearance", [
        { label: "left", value: "left" },
        { label: "right", value: "right" },
      ], { default: "left" }),
      p.select("variant", "Variant", "appearance", [
        { label: "sidebar", value: "sidebar" },
        { label: "floating", value: "floating" },
        { label: "inset", value: "inset" },
      ], { default: "sidebar" }),
      p.select("collapsible", "Collapsible", "appearance", [
        { label: "offcanvas", value: "offcanvas" },
        { label: "icon", value: "icon" },
        { label: "none", value: "none" },
      ], { default: "offcanvas" }),
    ],
  },

  spinner: {
    key: "spinner",
    name: "Spinner",
    group: "data",
    icon: "LoaderCircle",
    acceptsChildren: false,
    description: "Animated loading spinner.",
    svelteImport: importGroup("spinner", ["Spinner"]),
    svelteTag: "Spinner",
    defaultProps: { size: "default" },
    props: [
      p.select("size", "Size", "appearance", [
        { label: "default", value: "default" },
        { label: "sm", value: "sm" },
        { label: "lg", value: "lg" },
      ], { default: "default" }),
    ],
  },

  table: {
    key: "table",
    name: "Table (static)",
    group: "data",
    icon: "Table",
    acceptsChildren: true,
    description: "shadcn Table (one column per line; rows comma-separated). Optionally drop child rows — each child renders as an extra TableRow in the body.",
    svelteImport: importGroup("table", ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell", "TableCaption", "TableFooter"]),
    svelteTag: "Table",
    defaultProps: { columns: "Name\nAge", rows: "Alice,30\nBob,25", caption: "" },
    props: [
      p.textarea("columns", "Columns (one per line)", "content", { default: "Name\nAge" }),
      p.textarea("rows", "Rows (comma-separated)", "content", { default: "Alice,30\nBob,25" }),
      p.text("caption", "Caption", "content", { default: "" }),
    ],
  },

  typography: {
    key: "typography",
    name: "Typography",
    group: "data",
    icon: "Type",
    acceptsChildren: false,
    description: "shadcn typography styles on plain HTML elements (no import).",
    svelteImport: "",
    svelteTag: "p",
    isHtmlElement: true,
    defaultProps: {
      variant: "p",
      text: "The quick brown fox jumps over the lazy dog.",
    },
    props: [
      p.select("variant", "Variant", "appearance", [
        { label: "h1", value: "h1" },
        { label: "h2", value: "h2" },
        { label: "h3", value: "h3" },
        { label: "h4", value: "h4" },
        { label: "p", value: "p" },
        { label: "lead", value: "lead" },
        { label: "large", value: "large" },
        { label: "small", value: "small" },
        { label: "muted", value: "muted" },
        { label: "blockquote", value: "blockquote" },
      ], { default: "p" }),
      p.text("text", "Text", "content", { default: "The quick brown fox jumps over the lazy dog." }),
    ],
  },
};

// ---------------------------------------------------------------------------
// Composite container default children — pre-seed sensible defaults so a
// freshly-added container looks right out of the box.
// ---------------------------------------------------------------------------

/** Lightweight text-bearing child for list-like containers (menus, accordions, tabs). */
function textItem(text: string): FrameNode {
  return {
    id: nanoid(10),
    component: "item",
    variant: "normal",
    props: { text, variant: "default" },
    children: [],
  };
}

/** A typography paragraph used as default Card/DialogContent. */
function para(text: string): FrameNode {
  return {
    id: nanoid(10),
    component: "typography",
    variant: "normal",
    props: { variant: "p", text },
    children: [],
  };
}

/** A button (used as default button-group child, dialog trigger etc.). */
function buttonChild(text: string, variant = "default"): FrameNode {
  return {
    id: nanoid(10),
    component: "button",
    variant: "normal",
    props: { variant, size: "default", text, disabled: false, type: "button" },
    children: [],
  };
}

/**
 * Produce the default child set for a composite container key.
 * Returns a fresh deep-cloned array each call (new ids).
 */
function defaultChildrenFor(key: string): FrameNode[] {
  switch (key) {
    case "card":
      return [para("Card content goes here. Drop any component into me.")];
    case "dialog":
      return [para("Dialog body. Drop any component into me.")];
    case "alert-dialog":
      return [];
    case "sheet":
      return [para("Sheet body. Drop any component into me.")];
    case "drawer":
      return [para("Drawer body. Drop any component into me.")];
    case "popover":
      return [para("Popover body.")];
    case "hover-card":
      return [para("Hover card body.")];
    case "tooltip":
      return []; // trigger provided by triggerText default
    case "dropdown-menu":
      return [textItem("Edit"), textItem("Duplicate"), textItem("Delete")];
    case "context-menu":
      return [textItem("Back"), textItem("Reload"), textItem("Copy")];
    case "menubar": {
      // 2 menus, each with 2 item children
      const file = textItem("File");
      file.children = [textItem("New"), textItem("Open…")];
      const edit = textItem("Edit");
      edit.children = [textItem("Undo"), textItem("Redo")];
      return [file, edit];
    }
    case "navigation-menu": {
      // 2 nav items, each with content children
      const home = textItem("Home");
      home.children = [para("Welcome home.")];
      const about = textItem("About");
      about.children = [para("About us content.")];
      return [home, about];
    }
    case "tabs": {
      const t1 = textItem("Account");
      t1.children = [para("Account settings.")];
      const t2 = textItem("Password");
      t2.children = [para("Password settings.")];
      return [t1, t2];
    }
    case "accordion": {
      const s1 = textItem("Section 1");
      s1.children = [para("Content for section 1.")];
      const s2 = textItem("Section 2");
      s2.children = [para("Content for section 2.")];
      return [s1, s2];
    }
    case "carousel": {
      const make = (n: number) => {
        const node = textItem(`Slide ${n}`);
        // Carousel items typically just have visual content; the item's
        // text is the slide label and its children the slide body.
        node.children = [para(`Slide ${n} content.`)];
        return node;
      };
      return [make(1), make(2), make(3)];
    }
    case "collapsible":
      return [para("Collapsible body.")];
    case "button-group":
      return [buttonChild("Bold", "secondary"), buttonChild("Italic", "secondary"), buttonChild("Underline", "secondary")];
    case "scroll-area":
      return [
        para("Line one of scrollable content."),
        para("Line two of scrollable content."),
        para("Line three of scrollable content."),
        para("Line four of scrollable content."),
      ];
    case "aspect-ratio":
      return [];
    case "resizable":
      return [para("Panel 1"), para("Panel 2")];
    case "sidebar":
      return [textItem("Dashboard"), textItem("Projects"), textItem("Settings")];
    case "command":
      return [textItem("Apple"), textItem("Banana"), textItem("Cherry")];
    case "field": {
      const input = createNode("input");
      input.props.placeholder = "you@example.com";
      input.props.type = "email";
      return [input];
    }
    case "input-group": {
      const input = createNode("input");
      input.props.placeholder = "Amount";
      input.props.value = "";
      return [input];
    }
    case "empty":
      return [buttonChild("Try again", "outline")];
    case "table":
      return []; // table uses columns/rows textareas by default; children optional
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Accessors + factory
// ---------------------------------------------------------------------------

/** Safe accessor — throws on unknown keys so callers fail fast. */
export function getComponent(key: string): ComponentSchema {
  const c = COMPONENTS[key];
  if (!c) {
    throw new Error(`[frame] unknown component key: "${key}"`);
  }
  return c;
}

/**
 * Build a fresh `FrameNode` from a registry key.
 * - Applies `defaultProps` (deep-cloned so per-node edits stay isolated).
 * - Generates a stable id via nanoid.
 * - variant "normal".
 * - For composite containers (`acceptsChildren: true`), pre-seeds sensible
 *   default children so they render meaningfully out of the box.
 */
export function createNode(key: string): FrameNode {
  const schema = getComponent(key);
  const props: Record<string, PropValue> = {};
  for (const [k, v] of Object.entries(schema.defaultProps)) {
    // copy primitives verbatim
    props[k] = v;
  }
  const variant: Variant = "normal";
  const children = schema.acceptsChildren
    ? defaultChildrenFor(key)
    : [];
  return {
    id: nanoid(10),
    component: key,
    variant,
    props,
    children,
  };
}
