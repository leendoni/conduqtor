# FRAME

> A drag-and-drop UI builder for **SvelteKit + shadcn/svelte**. Design layouts visually, export paste-ready Svelte source.

FRAME is a 100% client-side visual builder. Drag shadcn/svelte components onto a canvas, compose them inside each other (Cards, Dialogs, Navigation Menus, Accordions, Tabs, Sheets, Drawers, Popovers, Dropdown Menus, Context Menus, Button Groups, Fields, Input Groups, Tables, and more), edit every prop and variant, and export a complete `.svelte` file with correct named imports from `$lib/components/ui/<x>/index.js` barrels — no backend, no account, runs fully offline once installed.

---

## Features

- **Three-pane builder with a fixed 1/6 · 4/6 · 1/6 layout** — logo / center topbar / load-save-export on top, then left sidebar (Components + Layers tabs) / canvas / right properties panel, with a **docked document switcher at the bottom of the left sidebar** and an **h-8 status bar** at the bottom of the center column only.
- **Inter font throughout** (with JetBrains Mono for monospace contexts — status bar, kbd, code blocks, eyebrows), loaded via `next/font/google` and bundled at build time so no runtime internet access is needed.
- **Full shadcn/svelte component coverage** — 69 component schemas across 9 palette groups, including 8 FRAME-only primitives (`box`, `flex-row`, `flex-col`, `grid`, `stack`, `icon`, `item`, `kbd`, `typography`, `spinner`) and 5 chart types (`chart-bar`, `chart-line`, `chart-area`, `chart-pie`, `chart-donut`).
- **Composite containers with child slots** — drag components *into* Cards, Dialogs, Alert Dialogs, Sheets, Drawers, Popovers, Hover Cards, Tooltips, Dropdown Menus, Context Menus, Menubars, Navigation Menus, Tabs, Accordions, Carousels, Collapsibles, Button Groups, Scroll Areas, Aspect Ratios, Resizable Panels, Sidebars, Commands, Fields, Input Groups, Empty states, and Tables. Each container pre-seeds sensible default children you can edit or replace.
- **Full props & variants per shadcn/svelte** — every component exposes the props its real Svelte counterpart accepts: `orientation` (Separator, Slider, RadioGroup, ToggleGroup, Tabs, Accordion, ScrollArea, ButtonGroup, Carousel, Field), `separator` (Breadcrumb), `decorative` (Separator), `align`/`side` (Popover, Tooltip, HoverCard, Sheet, Drawer), `loop` (Tabs, Accordion, Carousel), `delayDuration`/`skipDelayDuration`/`disableHoverableContent` (Tooltip), `openDelay`/`closeDelay` (HoverCard), `modal` (Dialog, AlertDialog, Sheet, Popover, DropdownMenu, ContextMenu), `max` (Progress), `sideOffset`/`viewport` (NavigationMenu), `collapsible`/`variant`/`side` (Sidebar), `direction`/`withHandle` (Resizable), `defaultValue`/`activateOn` (Tabs/Accordion), all button sizes/variants, etc.
- **Live canvas with real shadcn/ui React previews** — pixel-faithful rendering (React-shadcn and Svelte-shadcn share identical design tokens + variant APIs, so what you see is what you'll get).
- **Grouped properties panel** — variant dropdown + skeleton toggle at the top, then collapsible groups (`Content` / `Appearance` / `State` / `Advanced`) with a search box. Boolean props are switches, options are comboboxes, icons get a virtualized lucide icon picker.
- **Layers tree** — click to select, shift-click to multi-select, drag to reorder or nest, hover for duplicate/delete.
- **Multi-select + alignment toolbar** — 8 alignment modes (align left/center/right, align top/middle/bottom, distribute horizontally/vertically) applied via parent flex class adjustments, plus temporary grouping via `Ctrl/Cmd+G`.
- **Small tag-style selection highlight + opacity dimming** — selected nodes show a small corner tag chip (`-top-2 left-2`, zinc-900 pill, 10px font) and a thin 1px zinc-400 outline; all other canvas nodes dim to `opacity-40` while a selection is active (pointer events stay enabled so controls remain interactive).
- **Undo/redo history** — 50-step undo stack with redo, plus `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` shortcuts.
- **Keyboard shortcuts** — save, undo/redo, duplicate, group/ungroup, copy/paste, delete, escape, arrow reorder. Full list below.
- **localStorage autosave** (~1.2 s debounce) + **multiple named documents** + **JSON import/export** for portability.
- **Light/dark + 4 accent presets** (Zinc, Rose, Green, Orange) — applied per-document via CSS variables on `<html>`.
- **Sonner Toaster preview** — mount a real `sonner` `<Toaster>` with a "Show sample" button calling `toast.success(...)`. The codegen emits `<Toaster richColors closeButton position="..." />` (named import from `$lib/components/ui/sonner/index.js`).
- **Composable Tables** — `table` accepts both textarea columns/rows/caption AND optional children (each child = an extra TableRow with grandchildren as TableCells). `data-table` keeps textarea columns/rows + adds 5 feature toggles (`sortable`, `filterable`, `paginated`, `selectable`, `pageSize`) reflected live in a TanStack-table-backed React preview.
- **Codegen: tree → `.svelte` file** with named imports from `$lib/components/ui/<x>/index.js` barrels, merged per module (no duplicate import lines), per-chart `chartDataN` consts, skeleton-mode emission, and proper composite markup (Card → CardHeader/CardContent, Dialog → DialogTrigger/DialogContent, NavigationMenu → NavigationMenuRoot/List/Item/Trigger/Content, etc.). Paste-ready.
- **Virtualized lucide icon picker** — ~1500 icons, searchable, lazy-rendered grid.
- **Mobile responsive** — sidebars collapse into swipeable `Sheet` drawers at mobile widths; the topbar adapts to show open-sidebar buttons.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, static export) |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS v4** with `tw-animate-css` + `tailwindcss-animate` |
| UI components | **shadcn/ui** (New York style) — React preview layer |
| State (client) | **Zustand 5** (single store, structuredClone for immutable updates) |
| Drag & drop | **@dnd-kit/core** + **@dnd-kit/sortable** (Layers) + native HTML5 DnD (canvas/palette) |
| Tables | **@tanstack/react-table** (DataTable live preview) |
| Icons | **lucide-react** (~1500 icons, virtualized picker) |
| Code highlighting | **react-syntax-highlighter** (Prism, oneDark — used in the Code dialog) |
| Fonts | **Inter** + **JetBrains Mono** via `next/font/google` (bundled at build, no runtime internet needed) |
| Persistence | `localStorage` (key `frame:documents`) |
| Output target | **SvelteKit + shadcn/svelte** (bits-ui + tailwind-variants + @lucide/svelte + layerchart) |

---

## Prerequisites

- **Node.js 18+** *or* **Bun 1.1+** (Bun is recommended — `bun.lock` is included for reproducibility, but `npm install` / `pnpm install` / `yarn install` all work too).
- Internet access for the initial install (deps are pulled from npm). Afterwards the app runs **fully offline** — no API calls, no telemetry, no auth, no DB.

---

## Quick Start (development)

```bash
bun install        # or: npm install / pnpm install / yarn
bun run dev        # or: npm run dev
# open http://localhost:3000
```

If port 3000 is already in use:

```bash
bun run dev -- -p 3001
```

---

## Production / Offline Static Build

FRAME is 100% client-side — build a static bundle and serve from any static host (or locally with no server runtime).

```bash
bun run build         # outputs to ./out/
bun run serve:static  # npx serve out  →  http://localhost:3000

# or use any other static server, e.g.:
python3 -m http.server -d out 8000
```

The `out/` directory is plain HTML/JS/CSS — drop it on **Netlify**, **Vercel**, **GitHub Pages**, **Cloudflare Pages**, an S3 bucket, or any static host. No server runtime required.

`next.config.ts` ships with `output: "export"` and `images: { unoptimized: true }` so the build is fully static.

---

## Using the Builder

### Left sidebar — Components tab

Search or browse the **9 palette groups** (Tailwind Containers · Shadcn Containers · Actions · Inputs · Navigation · Notifications · Data Display · Charts · Icons). **Double-click** an item to add to canvas root, or **drag** it onto the canvas or into a container.

### Left sidebar — Layers tab

Tree outline of the document. **Click** to select, **shift-click** to multi-select, **drag** a row to reorder or nest (drop on a container row to nest inside it). Hover a row for duplicate / delete buttons.

### Canvas

- **Click** a node to select. **Shift-click** to add/remove from selection.
- **Drag the grip handle** (visible on hover, left of the node) to reorder.
- **Selected nodes** show a small corner tag chip + a thin 1px zinc-400 outline. **All other nodes dim to opacity 40%** while a selection is active (pointer events stay enabled — interactive controls still work).
- **Drag from the palette** onto a container (Card, Dialog, Navigation Menu, Accordion, etc.) to nest a new component into its primary child slot. Drop indicators: blue 0.5px line between siblings, dashed blue ring around containers in nest-hover.
- When 2+ nodes are selected, an **alignment toolbar** floats at the top of the canvas with 8 alignment/distribute modes.

### Right sidebar — Properties

Edit the selected component's props. The top of the panel shows the variant dropdown + a "Show as skeleton" toggle. Below that, a search box filters the grouped props:

- **Content** — text, labels, placeholder, options, etc. (open by default)
- **Appearance** — variant, size, orientation, side, align, color, etc. (open by default)
- **State** — checked, disabled, open, defaultValue, etc. (collapsed)
- **Advanced** — `id`, `className`, `modal`, `loop`, `delayDuration`, `sideOffset`, etc. (collapsed)

Boolean props are **switches**; enum props are **comboboxes**; lists are **textareas** (one item per line or CSV); icons get a **virtualized picker** with ~1500 lucide icons.

### Topbar — center

Editable document name (click to rename, Enter to commit, Escape to cancel) · Undo / Redo (with disabled state + history-length tooltip) · Theme menu (light/dark + 4 accents) · Keyboard shortcuts popover.

### Topbar — right

**New** (Plus) · **Load** (Upload — JSON file picker) · **Save** (near-black filled button, also `Ctrl/Cmd+S`) · **Export** (Code2 — opens the Codegen dialog).

### Document switcher (bottom of left sidebar)

Click the active document name (or the chevron) to open a dropdown listing all documents sorted by last-modified. Click to switch; the active doc gets a blue `Check` mark. The footer item **"Manage documents…"** opens the full Documents dialog (rename / delete / open / new / import / export JSON).

### Code dialog (Export)

Two tabs: **Svelte** (the generated `.svelte` source) and **JSON** (the full document tree). Copy to clipboard or download as a file. The Svelte output is paste-ready into a SvelteKit + shadcn/svelte project — all imports are correct named imports from `$lib/components/ui/<x>/index.js` barrels, merged per module (no duplicate lines).

---

## Composition (nesting components)

Every container in the palette with `acceptsChildren: true` has a primary **child slot** you can drop components into:

- Drag a **Card** onto the canvas → it pre-seeds `CardContent > paragraph`. Drag an **Input** into the Card → it nests inside `CardContent`. Drag a **Button** after it → they stack vertically.
- Drag components into a **Navigation Menu** item's dropdown — each `NavigationMenuItem` has a `NavigationMenuContent` slot for the dropdown body.
- Drag an **Input** into a **Field** (FormGroup) or **InputGroup** — Fields pre-seed with an email input; InputGroups pre-seed with an amount input.
- Drag buttons into a **Button Group** — pre-seeds Bold / Italic / Underline.
- Drag items into a **Dropdown Menu** / **Context Menu** / **Command** — pre-seeds three sample items each.
- Drag rows into a **Table** — each child becomes an extra `<TableRow>` with its grandchildren as `<TableCell>`s. The textarea `columns`/`rows` props still drive the base table.
- Drag paragraphs into a **Scroll Area** — pre-seeds four lines of scrollable content.

Each composite container's default children are defined in `defaultChildrenFor(key)` inside `src/lib/frame/registry.ts`.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + S` | Save (force-write to localStorage) |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo (alternative) |
| `Ctrl/Cmd + D` | Duplicate selected |
| `Ctrl/Cmd + G` | Group selected (temporary grouping) |
| `Ctrl/Cmd + Shift + G` | Ungroup |
| `Ctrl/Cmd + C` | Copy selected |
| `Ctrl/Cmd + V` | Paste (into selected container if exactly one is selected, else root) |
| `Delete` / `Backspace` | Remove selected |
| `Escape` | Clear selection |
| `↑` / `↓` | Reorder selected within parent (single selection only) |
| `Shift + Click` | Toggle selection (multi-select) |
| `Double-click palette item` | Insert at root |

Shortcuts are ignored while typing in inputs/textareas/contenteditable or interacting with combobox-role elements.

---

## Project Structure

```
frame/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Inter + JetBrains Mono via next/font; <html> + <Toaster>
│   │   ├── page.tsx            # mounts <Builder />
│   │   └── globals.css         # Tailwind v4 + @theme inline (font-sans = Inter, font-mono = JetBrains)
│   ├── components/
│   │   ├── frame/              # the builder UI (22 files)
│   │   │   ├── Builder.tsx          # root shell — 3-region topbar + 3-column body + h-8 status bar
│   │   │   ├── Topbar.tsx           # LogoBlock / TopbarCenter / LoadSaveExportBlock (3 exported regions)
│   │   │   ├── DocumentSwitcher.tsx # docked 64px footer of the left sidebar (NEW in v1.1)
│   │   │   ├── LeftSidebar.tsx      # Components | Layers tabs
│   │   │   ├── Palette.tsx          # 9 groups, draggable items, double-click to insert
│   │   │   ├── Layers.tsx           # tree outline, drag reorder + nest, hover duplicate/delete
│   │   │   ├── Canvas.tsx           # flat canvas, SelectionContext provider, root drop target
│   │   │   ├── NodeRenderer.tsx     # renders a FrameNode + children recursively (composite slots)
│   │   │   ├── NodeWrapper.tsx      # selection, hover, drag handle, drop target, tag chip, dimming
│   │   │   ├── PropertiesPanel.tsx  # grouped props with search, switches, comboboxes
│   │   │   ├── PropField.tsx        # single prop field renderer
│   │   │   ├── IconPicker.tsx       # virtualized lucide icon grid
│   │   │   ├── AlignmentToolbar.tsx # 8 alignment/distribute modes (multi-select)
│   │   │   ├── CodegenDialog.tsx    # Svelte + JSON tabs, copy/download
│   │   │   ├── DocumentsDialog.tsx  # full document manager (rename/delete/import/export)
│   │   │   ├── ThemeMenu.tsx        # light/dark + 4 accents
│   │   │   ├── ShortcutsHelp.tsx    # popover with the shortcut table
│   │   │   ├── StatusBar.tsx        # h-8 footer (center column only): save status, count, theme
│   │   │   ├── theme.ts             # applyTheme(theme, accent) — toggles .dark + CSS vars
│   │   │   ├── icons.ts             # lucide-react lookup + DynamicIcon wrapper
│   │   │   ├── dnd.ts               # MIME flavors + drop position calc
│   │   │   └── useShortcuts.ts      # global keydown handler
│   │   └── ui/                 # shadcn/ui components (49 files incl. index.ts barrel)
│   ├── lib/
│   │   ├── frame/              # data layer (5 files)
│   │   │   ├── types.ts             # Variant, PropValue, FrameNode, FrameDocument, PropSchema, etc.
│   │   │   ├── registry.ts          # 69 component schemas + createNode + defaultChildrenFor
│   │   │   ├── codegen.ts           # tree → .svelte string + JSON string
│   │   │   ├── store.ts             # Zustand store: tree mutations, history, persistence
│   │   │   └── defaults.ts          # createRootNode + createStarterTree + newDocument
│   │   └── utils.ts            # cn() helper
│   └── hooks/
│       ├── use-mobile.ts       # useIsMobile() — media query hook
│       └── use-toast.ts        # legacy shadcn toast hook (Sonner is used directly in FRAME)
├── public/
│   ├── logo.svg                # FRAME favicon
│   └── robots.txt
├── next.config.ts              # output: "export", images.unoptimized, ignoreBuildErrors
├── package.json                # name: "frame", version: "1.1.0", no prisma/next-auth/etc.
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json             # shadcn/ui config (New York, neutral base, lucide icons)
├── eslint.config.mjs
├── bun.lock
└── README.md
```

---

## How It Works

**Live preview layer.** The builder runs in Next.js + React using shadcn/ui **React** as a pixel-faithful live preview. React-shadcn and Svelte-shadcn share identical design tokens (CSS variables), identical variant names (`default` / `secondary` / `destructive` / `outline` / `ghost` / `link` for buttons; `vertical` / `horizontal` for separators; `top` / `right` / `bottom` / `left` for sheets; etc.), and identical sub-part composition (Card → CardHeader + CardTitle + CardDescription + CardContent + CardFooter). So the canvas you design in is what your SvelteKit app will render.

**Data model.** The canvas is backed by a tree of `FrameNode` objects (`{ id, component, variant, props, children }`) stored in a single Zustand store with `structuredClone`-based immutable updates and a 50-step undo history. Every tree mutation snapshots the previous state onto a `past` stack and clears `future`. The root node uses the magic `component: "root"` key (not in the registry) and renders as a plain vertical flex column.

**Composite containers.** Components with `acceptsChildren: true` (Card, Dialog, Sheet, Drawer, Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, Menubar, Navigation Menu, Tabs, Accordion, Carousel, Collapsible, Button Group, Scroll Area, Aspect Ratio, Resizable, Sidebar, Command, Field, Input Group, Empty, Table, plus the root) accept dragged children into a primary slot. Each composite pre-seeds sensible default children via `defaultChildrenFor(key)` — e.g. a freshly-added Accordion has 2 sections, a Navigation Menu has Home + About items, a Button Group has Bold + Italic + Underline, a Field has an email Input. Replace or extend them by dragging from the palette.

**Codegen.** `generateSvelte(doc)` walks the tree and emits a single `<script lang="ts">` + `<div>` block. Imports are collected into a `Map<modulePath, Set<namedExports>>` and merged per module (so `Button` and `Input` from different modules each get one line, but two `Button`s only produce one). The barrel path is `$lib/components/ui/<key>/index.js` per shadcn/svelte convention. Charts emit a `const chartDataN = [...]` literal. Skeleton mode replaces the rendered component with `<Skeleton class="w-full h-6" />`. Composite containers emit their sub-part markup (`<Card>…<CardHeader>…</CardHeader><CardContent>…</CardContent></Card>`, `<Dialog>…<DialogTrigger asChild>…</DialogTrigger><DialogContent>…</DialogContent></Dialog>`, etc.) with children serialized into the correct slot.

---

## Persistence

- **Autosave to localStorage** — ~1.2 s debounce after every mutation. Key: `frame:documents`. Value: `{ documents, activeDocumentId, version }`.
- **Multiple named documents** — switch via the **document switcher** docked at the bottom of the left sidebar; full management (rename / delete / new / import / export) via **"Manage documents…"**.
- **JSON export/import** — copy or download the full document tree as JSON; re-import via the Load button (Upload icon, topbar right) or the Documents dialog. Portable across browsers and machines.

---

## Theming

- **Light** (default) / **Dark** — toggled via the Theme menu in the topbar center. Applied by adding/removing the `.dark` class on `<html>`.
- **4 accent presets**: Zinc (neutral default), Rose, Green, Orange. Applied by overriding `--primary` / `--primary-foreground` / `--ring` (and the sidebar equivalents) on `<html>`. The Zinc accent clears inline overrides so the stylesheet defaults win.
- **Design tokens**: 6 px base radius (`--radius: 0.625rem`), blue `--ring`, near-black primary buttons, Inter font, JetBrains Mono for monospace.

Theming is per-document — each `FrameDocument` carries its own `theme` and `accent`. Switching documents restores that document's theme.

---

## Troubleshooting

- **`bun install` fails** — ensure Bun 1.1+. Alternatively `npm install` / `pnpm install` / `yarn install` all work (lockfile is `bun.lock`; if you switch package managers, just delete `bun.lock` first).
- **Port 3000 in use** — `bun run dev -- -p 3001`.
- **Static `out/` opens blank via `file://`** — Next.js static export uses absolute paths that need an HTTP origin. Serve it: `bun run serve:static` (or `python3 -m http.server -d out 8000`).
- **Fonts not loading offline** — Inter and JetBrains Mono are bundled at build time via `next/font/google`; you do **not** need internet at runtime. The initial `bun install` / `bun run build` does need internet to fetch the font files (cached afterwards).
- **Build errors about `react-hooks/incompatible-library`** — that's a known lint warning from `@tanstack/react-table`'s `useReactTable()` hook; harmless and silenced in production builds via `typescript.ignoreBuildErrors`.
- **Changes not persisting** — check that localStorage is enabled and not full. The status bar (bottom of center column) shows save state (`Saving…` / `Saved Xs ago`).

---

## License

MIT
#   c o n d u q t o r  
 #   c o n d u q t o r  
 