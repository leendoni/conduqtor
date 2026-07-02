module.exports = [
"[project]/src/lib/frame/registry.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COMPONENTS",
    ()=>COMPONENTS,
    "GROUP_LABELS",
    ()=>GROUP_LABELS,
    "PALETTE_GROUPS",
    ()=>PALETTE_GROUPS,
    "createNode",
    ()=>createNode,
    "getComponent",
    ()=>getComponent
]);
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/nanoid/index.js [app-ssr] (ecmascript) <locals>");
;
const PALETTE_GROUPS = [
    {
        key: "containers-tailwind",
        label: "Tailwind Containers",
        icon: "Boxes"
    },
    {
        key: "containers-shadcn",
        label: "Shadcn Containers",
        icon: "LayoutTemplate"
    },
    {
        key: "actions",
        label: "Actions",
        icon: "MousePointerClick"
    },
    {
        key: "inputs",
        label: "Inputs",
        icon: "TextCursorInput"
    },
    {
        key: "navigation",
        label: "Navigation",
        icon: "Navigation"
    },
    {
        key: "notifications",
        label: "Notifications",
        icon: "Bell"
    },
    {
        key: "data",
        label: "Data Display",
        icon: "Table2"
    },
    {
        key: "charts",
        label: "Charts",
        icon: "BarChart3"
    },
    {
        key: "icons",
        label: "Icons",
        icon: "Sparkles"
    }
];
const GROUP_LABELS = PALETTE_GROUPS.reduce((acc, g)=>{
    acc[g.key] = g.label;
    return acc;
}, {});
const p = {
    text: (key, label, group, extra = {})=>({
            key,
            label,
            type: "text",
            group,
            ...extra
        }),
    textarea: (key, label, group, extra = {})=>({
            key,
            label,
            type: "textarea",
            group,
            ...extra
        }),
    number: (key, label, group, extra = {})=>({
            key,
            label,
            type: "number",
            group,
            ...extra
        }),
    boolean: (key, label, group, extra = {})=>({
            key,
            label,
            type: "boolean",
            group,
            ...extra
        }),
    select: (key, label, group, options, extra = {})=>({
            key,
            label,
            type: "select",
            group,
            options,
            ...extra
        }),
    icon: (key, label, group, extra = {})=>({
            key,
            label,
            type: "icon",
            group,
            ...extra
        }),
    color: (key, label, group, extra = {})=>({
            key,
            label,
            type: "color",
            group,
            ...extra
        })
};
/**
 * Build a paste-ready named-import statement for a shadcn/svelte barrel.
 * `lib("button", ["Button"])` → `import { Button } from "$lib/components/ui/button/index.js";`
 * The barrel path matches the real shadcn-svelte convention used by `shadcn-svelte add`.
 */ const lib = (path, names)=>`import { ${names.join(", ")} } from "$lib/components/ui/${path}/index.js";`;
/** Legacy aliases kept for the existing entries — they now emit the same
 *  named-import form as `lib()` so every component's svelteImport is correct. */ const importGroup = (path, names)=>lib(path, names);
const importDefault = (path, name)=>lib(path, [
        name
    ]);
// Shared option lists
const ORIENTATION_OPTS = [
    {
        label: "horizontal",
        value: "horizontal"
    },
    {
        label: "vertical",
        value: "vertical"
    }
];
const ALIGN_OPTS = [
    {
        label: "start",
        value: "start"
    },
    {
        label: "center",
        value: "center"
    },
    {
        label: "end",
        value: "end"
    }
];
const SIDE_OPTS = [
    {
        label: "top",
        value: "top"
    },
    {
        label: "right",
        value: "right"
    },
    {
        label: "bottom",
        value: "bottom"
    },
    {
        label: "left",
        value: "left"
    }
];
const COMPONENTS = {
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
            size: "default"
        },
        props: [
            p.select("type", "Type", "appearance", [
                {
                    label: "text",
                    value: "text"
                },
                {
                    label: "email",
                    value: "email"
                },
                {
                    label: "password",
                    value: "password"
                },
                {
                    label: "number",
                    value: "number"
                },
                {
                    label: "tel",
                    value: "tel"
                },
                {
                    label: "url",
                    value: "url"
                },
                {
                    label: "search",
                    value: "search"
                }
            ], {
                default: "text"
            }),
            p.text("placeholder", "Placeholder", "content", {
                default: "Enter text…"
            }),
            p.text("value", "Value", "content", {
                default: ""
            }),
            p.text("label", "Label", "content", {
                default: "",
                help: "Optional label rendered above the input."
            }),
            p.boolean("disabled", "Disabled", "state", {
                default: false
            }),
            p.select("size", "Size", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "sm",
                    value: "sm"
                },
                {
                    label: "lg",
                    value: "lg"
                }
            ], {
                default: "default",
                group: "advanced"
            })
        ]
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
        defaultProps: {
            placeholder: "Enter text…",
            value: "",
            rows: 4,
            disabled: false,
            readonly: false,
            label: ""
        },
        props: [
            p.text("placeholder", "Placeholder", "content"),
            p.text("value", "Value", "content", {
                default: ""
            }),
            p.number("rows", "Rows", "appearance", {
                default: 4
            }),
            p.boolean("disabled", "Disabled", "state"),
            p.boolean("readonly", "Read-only", "state"),
            p.text("label", "Label", "content")
        ]
    },
    label: {
        key: "label",
        name: "Label",
        group: "inputs",
        icon: "Type",
        acceptsChildren: false,
        description: "Form field label.",
        svelteImport: importGroup("label", [
            "Label"
        ]),
        svelteTag: "Label",
        defaultProps: {
            text: "Label",
            htmlFor: ""
        },
        props: [
            p.text("text", "Text", "content", {
                default: "Label"
            }),
            p.text("htmlFor", "For (id)", "advanced", {
                default: ""
            })
        ]
    },
    checkbox: {
        key: "checkbox",
        name: "Checkbox",
        group: "inputs",
        icon: "CheckSquare",
        acceptsChildren: false,
        description: "Single checkbox.",
        svelteImport: importGroup("checkbox", [
            "Checkbox"
        ]),
        svelteTag: "Checkbox",
        defaultProps: {
            checked: false,
            disabled: false,
            label: "Accept terms",
            id: ""
        },
        props: [
            p.boolean("checked", "Checked", "state", {
                default: false
            }),
            p.boolean("disabled", "Disabled", "state"),
            p.text("label", "Label", "content", {
                default: "Accept terms"
            }),
            p.text("id", "id", "advanced")
        ]
    },
    "radio-group": {
        key: "radio-group",
        name: "Radio Group",
        group: "inputs",
        icon: "CircleDot",
        acceptsChildren: false,
        description: "Group of radio options (one item per line).",
        svelteImport: importGroup("radio-group", [
            "RadioGroup",
            "RadioGroupItem"
        ]),
        svelteTag: "RadioGroup",
        defaultProps: {
            value: "",
            items: "Option A\nOption B",
            disabled: false,
            orientation: "vertical"
        },
        props: [
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.textarea("items", "Items (one per line)", "content", {
                default: "Option A\nOption B"
            }),
            p.boolean("disabled", "Disabled", "state"),
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "vertical"
            })
        ]
    },
    switch: {
        key: "switch",
        name: "Switch",
        group: "inputs",
        icon: "ToggleRight",
        acceptsChildren: false,
        description: "Toggle switch.",
        svelteImport: importGroup("switch", [
            "Switch"
        ]),
        svelteTag: "Switch",
        defaultProps: {
            checked: false,
            disabled: false,
            label: "Airplane mode"
        },
        props: [
            p.boolean("checked", "Checked", "state", {
                default: false
            }),
            p.boolean("disabled", "Disabled", "state"),
            p.text("label", "Label", "content", {
                default: "Airplane mode"
            })
        ]
    },
    slider: {
        key: "slider",
        name: "Slider",
        group: "inputs",
        icon: "SlidersHorizontal",
        acceptsChildren: false,
        description: "Range slider.",
        svelteImport: importGroup("slider", [
            "Slider"
        ]),
        svelteTag: "Slider",
        defaultProps: {
            value: 50,
            min: 0,
            max: 100,
            step: 1,
            disabled: false,
            orientation: "horizontal"
        },
        props: [
            p.number("value", "Value", "state", {
                default: 50
            }),
            p.number("min", "Min", "appearance", {
                default: 0
            }),
            p.number("max", "Max", "appearance", {
                default: 100
            }),
            p.number("step", "Step", "appearance", {
                default: 1
            }),
            p.boolean("disabled", "Disabled", "state"),
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "horizontal"
            })
        ]
    },
    select: {
        key: "select",
        name: "Select",
        group: "inputs",
        icon: "ChevronDownSquare",
        acceptsChildren: false,
        description: "Dropdown select (one option per line).",
        svelteImport: importGroup("select", [
            "Select",
            "SelectTrigger",
            "SelectValue",
            "SelectContent",
            "SelectItem"
        ]),
        svelteTag: "Select",
        defaultProps: {
            value: "",
            placeholder: "Select…",
            options: "Apple\nBanana\nCherry",
            disabled: false
        },
        props: [
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.text("placeholder", "Placeholder", "content", {
                default: "Select…"
            }),
            p.textarea("options", "Options (one per line)", "content", {
                default: "Apple\nBanana\nCherry"
            }),
            p.boolean("disabled", "Disabled", "state")
        ]
    },
    combobox: {
        key: "combobox",
        name: "Combobox",
        group: "inputs",
        icon: "Search",
        acceptsChildren: false,
        description: "Searchable combo box (Command + Popover composition).",
        svelteImport: lib("command", [
            "Command",
            "CommandInput",
            "CommandList",
            "CommandEmpty",
            "CommandGroup",
            "CommandItem"
        ]) + "; " + lib("popover", [
            "Popover",
            "PopoverTrigger",
            "PopoverContent"
        ]),
        svelteTag: "Popover",
        defaultProps: {
            value: "",
            placeholder: "Search…",
            options: "Apple\nBanana\nCherry"
        },
        props: [
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.text("placeholder", "Placeholder", "content", {
                default: "Search…"
            }),
            p.textarea("options", "Options (one per line)", "content", {
                default: "Apple\nBanana\nCherry"
            })
        ]
    },
    "date-picker": {
        key: "date-picker",
        name: "Date Picker",
        group: "inputs",
        icon: "Calendar",
        acceptsChildren: false,
        description: "Calendar-based date picker.",
        svelteImport: importGroup("calendar", [
            "Calendar"
        ]) + "; " + importGroup("popover", [
            "Popover",
            "PopoverTrigger",
            "PopoverContent"
        ]) + "; " + importGroup("button", [
            "Button"
        ]),
        svelteTag: "DatePicker",
        defaultProps: {
            value: "",
            placeholder: "Pick a date"
        },
        props: [
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.text("placeholder", "Placeholder", "content", {
                default: "Pick a date"
            })
        ]
    },
    "input-otp": {
        key: "input-otp",
        name: "Input OTP",
        group: "inputs",
        icon: "KeyRound",
        acceptsChildren: false,
        description: "One-time-password input.",
        svelteImport: importGroup("input-otp", [
            "InputOTP",
            "InputOTPGroup",
            "InputOTPSlot"
        ]),
        svelteTag: "InputOTP",
        defaultProps: {
            length: 6,
            value: "",
            disabled: false
        },
        props: [
            p.number("length", "Length", "content", {
                default: 6
            }),
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.boolean("disabled", "Disabled", "state")
        ]
    },
    "toggle-group": {
        key: "toggle-group",
        name: "Toggle Group",
        group: "inputs",
        icon: "Group",
        acceptsChildren: false,
        description: "Group of toggle buttons (one item per line).",
        svelteImport: importGroup("toggle-group", [
            "ToggleGroup",
            "ToggleGroupItem"
        ]),
        svelteTag: "ToggleGroup",
        defaultProps: {
            value: "",
            items: "A\nB\nC",
            type: "single",
            variant: "default",
            size: "default",
            orientation: "horizontal"
        },
        props: [
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.textarea("items", "Items (one per line)", "content", {
                default: "A\nB\nC"
            }),
            p.select("type", "Type", "appearance", [
                {
                    label: "single",
                    value: "single"
                },
                {
                    label: "multiple",
                    value: "multiple"
                }
            ], {
                default: "single"
            }),
            p.select("variant", "Variant", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "outline",
                    value: "outline"
                }
            ], {
                default: "default"
            }),
            p.select("size", "Size", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "sm",
                    value: "sm"
                },
                {
                    label: "lg",
                    value: "lg"
                }
            ], {
                default: "default"
            }),
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "horizontal"
            })
        ]
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
        defaultProps: {
            variant: "default",
            size: "default",
            text: "Button",
            disabled: false,
            type: "button"
        },
        props: [
            p.select("variant", "Variant", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "secondary",
                    value: "secondary"
                },
                {
                    label: "destructive",
                    value: "destructive"
                },
                {
                    label: "outline",
                    value: "outline"
                },
                {
                    label: "ghost",
                    value: "ghost"
                },
                {
                    label: "link",
                    value: "link"
                }
            ], {
                default: "default"
            }),
            p.select("size", "Size", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "xs",
                    value: "xs"
                },
                {
                    label: "sm",
                    value: "sm"
                },
                {
                    label: "lg",
                    value: "lg"
                },
                {
                    label: "icon",
                    value: "icon"
                },
                {
                    label: "icon-xs",
                    value: "icon-xs"
                },
                {
                    label: "icon-sm",
                    value: "icon-sm"
                },
                {
                    label: "icon-lg",
                    value: "icon-lg"
                }
            ], {
                default: "default"
            }),
            p.text("text", "Text", "content", {
                default: "Button"
            }),
            p.boolean("disabled", "Disabled", "state"),
            p.select("type", "Type", "advanced", [
                {
                    label: "button",
                    value: "button"
                },
                {
                    label: "submit",
                    value: "submit"
                },
                {
                    label: "reset",
                    value: "reset"
                }
            ], {
                default: "button"
            })
        ]
    },
    "button-group": {
        key: "button-group",
        name: "Button Group",
        group: "actions",
        icon: "Columns3",
        acceptsChildren: true,
        description: "Container grouping several buttons visually. Drag buttons into me.",
        svelteImport: importGroup("button-group", [
            "ButtonGroup"
        ]),
        svelteTag: "ButtonGroup",
        defaultProps: {
            variant: "default",
            orientation: "horizontal"
        },
        props: [
            p.select("variant", "Variant", "advanced", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "outline",
                    value: "outline"
                },
                {
                    label: "secondary",
                    value: "secondary"
                }
            ], {
                default: "default"
            }),
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "horizontal"
            })
        ]
    },
    "dropdown-menu": {
        key: "dropdown-menu",
        name: "Dropdown Menu",
        group: "actions",
        icon: "Menu",
        acceptsChildren: true,
        description: "Trigger button opening a menu. Drag items into me as children.",
        svelteImport: importGroup("dropdown-menu", [
            "DropdownMenu",
            "DropdownMenuTrigger",
            "DropdownMenuContent",
            "DropdownMenuItem"
        ]) + "; " + importDefault("button", "Button"),
        svelteTag: "DropdownMenu",
        defaultProps: {
            triggerText: "Open",
            modal: true
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Open"
            }),
            p.boolean("modal", "Modal", "advanced", {
                default: true
            })
        ]
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
        defaultProps: {
            href: "#",
            text: "Link",
            target: "_self",
            className: "text-primary hover:underline"
        },
        props: [
            p.text("href", "Href", "content", {
                default: "#"
            }),
            p.text("text", "Text", "content", {
                default: "Link"
            }),
            p.select("target", "Target", "advanced", [
                {
                    label: "_self",
                    value: "_self"
                },
                {
                    label: "_blank",
                    value: "_blank"
                }
            ], {
                default: "_self"
            }),
            p.text("className", "Class", "advanced", {
                default: "text-primary hover:underline"
            })
        ]
    },
    toggle: {
        key: "toggle",
        name: "Toggle",
        group: "actions",
        icon: "ToggleLeft",
        acceptsChildren: false,
        description: "Pressable toggle button.",
        svelteImport: importGroup("toggle", [
            "Toggle"
        ]),
        svelteTag: "Toggle",
        defaultProps: {
            pressed: false,
            disabled: false,
            label: "Bold",
            variant: "default",
            size: "default"
        },
        props: [
            p.boolean("pressed", "Pressed", "state", {
                default: false
            }),
            p.boolean("disabled", "Disabled", "state"),
            p.text("label", "Label", "content", {
                default: "Bold"
            }),
            p.select("variant", "Variant", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "outline",
                    value: "outline"
                }
            ], {
                default: "default"
            }),
            p.select("size", "Size", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "sm",
                    value: "sm"
                },
                {
                    label: "lg",
                    value: "lg"
                }
            ], {
                default: "default"
            })
        ]
    },
    // ─── navigation ─────────────────────────────────────────────────────────
    tabs: {
        key: "tabs",
        name: "Tabs",
        group: "navigation",
        icon: "PanelTop",
        acceptsChildren: true,
        description: "Tabs container. Drag child nodes in — each child becomes one tab (label = child's text/title).",
        svelteImport: importGroup("tabs", [
            "Tabs",
            "TabsList",
            "TabsTrigger",
            "TabsContent"
        ]),
        svelteTag: "Tabs",
        defaultProps: {
            value: "",
            orientation: "horizontal",
            loop: true,
            activateOn: "click"
        },
        props: [
            p.text("value", "Active tab value", "state", {
                default: "",
                help: "Leave empty to use first tab."
            }),
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "horizontal"
            }),
            p.boolean("loop", "Loop keyboard", "advanced", {
                default: true
            }),
            p.select("activateOn", "Activate on", "advanced", [
                {
                    label: "click",
                    value: "click"
                },
                {
                    label: "focus",
                    value: "focus"
                }
            ], {
                default: "click"
            })
        ]
    },
    breadcrumb: {
        key: "breadcrumb",
        name: "Breadcrumb",
        group: "navigation",
        icon: "Navigation2",
        acceptsChildren: false,
        description: "Breadcrumb trail (one item per line).",
        svelteImport: importGroup("breadcrumb", [
            "Breadcrumb",
            "BreadcrumbList",
            "BreadcrumbItem",
            "BreadcrumbLink",
            "BreadcrumbSeparator",
            "BreadcrumbPage"
        ]),
        svelteTag: "Breadcrumb",
        defaultProps: {
            items: "Home\nProducts\nDetail",
            separator: ""
        },
        props: [
            p.textarea("items", "Items (one per line)", "content", {
                default: "Home\nProducts\nDetail"
            }),
            p.text("separator", "Separator (lucide name or text)", "advanced", {
                default: "",
                help: "Empty = default ChevronRight. Try: Slash, Dot, '/'"
            })
        ]
    },
    pagination: {
        key: "pagination",
        name: "Pagination",
        group: "navigation",
        icon: "ChevronsRight",
        acceptsChildren: false,
        description: "Page navigation control.",
        svelteImport: importGroup("pagination", [
            "Pagination",
            "PaginationContent",
            "PaginationItem",
            "PaginationLink",
            "PaginationPrevious",
            "PaginationNext"
        ]),
        svelteTag: "Pagination",
        defaultProps: {
            page: 1,
            totalPages: 10
        },
        props: [
            p.number("page", "Current page", "content", {
                default: 1
            }),
            p.number("totalPages", "Total pages", "content", {
                default: 10
            })
        ]
    },
    menubar: {
        key: "menubar",
        name: "Menubar",
        group: "navigation",
        icon: "MenuSquare",
        acceptsChildren: true,
        description: "Top-of-app menu bar. Drag child nodes in — each child becomes a MenubarMenu (label = child's text/title); a child's own children become its items.",
        svelteImport: importGroup("menubar", [
            "Menubar",
            "MenubarMenu",
            "MenubarTrigger",
            "MenubarContent",
            "MenubarItem"
        ]),
        svelteTag: "Menubar",
        defaultProps: {},
        props: []
    },
    "navigation-menu": {
        key: "navigation-menu",
        name: "Navigation Menu",
        group: "navigation",
        icon: "Menu",
        acceptsChildren: true,
        description: "Horizontal nav menu. Drag child nodes in — each child becomes a NavigationMenuItem with a trigger (label = child's text/title) + a NavigationMenuContent holding the child's own children.",
        svelteImport: importGroup("navigation-menu", [
            "NavigationMenuRoot",
            "NavigationMenuList",
            "NavigationMenuItem",
            "NavigationMenuTrigger",
            "NavigationMenuContent"
        ]),
        svelteTag: "NavigationMenuRoot",
        defaultProps: {
            viewport: true
        },
        props: [
            p.boolean("viewport", "Show viewport", "advanced", {
                default: true
            })
        ]
    },
    // ─── data ───────────────────────────────────────────────────────────────
    "data-table": {
        key: "data-table",
        name: "Data Table",
        group: "data",
        icon: "Table2",
        acceptsChildren: false,
        description: "TanStack-powered data table (first line = column headers, comma-separated rows). Toggle features below.",
        svelteImport: importGroup("table", [
            "Table",
            "TableHeader",
            "TableBody",
            "TableRow",
            "TableHead",
            "TableCell"
        ]),
        svelteTag: "DataTable",
        defaultProps: {
            columns: "Name\nAge\nCity",
            rows: "Alice,30,NYC\nBob,25,LA\nCarol,41,SF",
            sortable: true,
            filterable: false,
            paginated: true,
            selectable: false,
            pageSize: 10
        },
        props: [
            p.textarea("columns", "Columns (one per line)", "content", {
                default: "Name\nAge\nCity"
            }),
            p.textarea("rows", "Rows (comma-separated)", "content", {
                default: "Alice,30,NYC\nBob,25,LA\nCarol,41,SF"
            }),
            p.boolean("sortable", "Sortable", "appearance", {
                default: true
            }),
            p.boolean("filterable", "Filterable", "appearance", {
                default: false
            }),
            p.boolean("paginated", "Paginated", "appearance", {
                default: true
            }),
            p.boolean("selectable", "Row selection", "appearance", {
                default: false
            }),
            p.number("pageSize", "Page size", "appearance", {
                default: 10
            })
        ]
    },
    accordion: {
        key: "accordion",
        name: "Accordion",
        group: "data",
        icon: "ChevronsDownUp",
        acceptsChildren: true,
        description: "Collapsible sections. Drag child nodes in — each child becomes an AccordionItem (label = child's text/title); the child's own children render as the section content.",
        svelteImport: importGroup("accordion", [
            "Accordion",
            "AccordionItem",
            "AccordionTrigger",
            "AccordionContent"
        ]),
        svelteTag: "Accordion",
        defaultProps: {
            type: "single",
            disabled: false,
            loop: true,
            orientation: "vertical",
            defaultValue: ""
        },
        props: [
            p.select("type", "Type", "appearance", [
                {
                    label: "single",
                    value: "single"
                },
                {
                    label: "multiple",
                    value: "multiple"
                }
            ], {
                default: "single"
            }),
            p.boolean("disabled", "Disabled", "state", {
                default: false
            }),
            p.boolean("loop", "Loop keyboard", "advanced", {
                default: true
            }),
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "vertical"
            }),
            p.text("defaultValue", "Open value", "state", {
                default: "",
                help: "single: an item value; multiple: comma-separated."
            })
        ]
    },
    badge: {
        key: "badge",
        name: "Badge",
        group: "data",
        icon: "BadgeCheck",
        acceptsChildren: false,
        description: "Small status pill.",
        svelteImport: importGroup("badge", [
            "Badge"
        ]),
        svelteTag: "Badge",
        defaultProps: {
            variant: "default",
            text: "Badge"
        },
        props: [
            p.select("variant", "Variant", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "secondary",
                    value: "secondary"
                },
                {
                    label: "destructive",
                    value: "destructive"
                },
                {
                    label: "outline",
                    value: "outline"
                },
                {
                    label: "ghost",
                    value: "ghost"
                },
                {
                    label: "link",
                    value: "link"
                }
            ], {
                default: "default"
            }),
            p.text("text", "Text", "content", {
                default: "Badge"
            })
        ]
    },
    collapsible: {
        key: "collapsible",
        name: "Collapsible",
        group: "data",
        icon: "ChevronDownSquare",
        acceptsChildren: true,
        description: "Expandable container. Children render in CollapsibleContent.",
        svelteImport: importGroup("collapsible", [
            "Collapsible",
            "CollapsibleTrigger",
            "CollapsibleContent"
        ]),
        svelteTag: "Collapsible",
        defaultProps: {
            triggerText: "Toggle",
            open: false,
            defaultOpen: false
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Toggle"
            }),
            p.boolean("open", "Open (controlled)", "state", {
                default: false
            }),
            p.boolean("defaultOpen", "Default open", "state", {
                default: false
            })
        ]
    },
    tooltip: {
        key: "tooltip",
        name: "Tooltip",
        group: "data",
        icon: "MessageCircle",
        acceptsChildren: true,
        description: "Wraps children and shows a tooltip on hover. Drag a component in as the trigger.",
        svelteImport: importGroup("tooltip", [
            "Tooltip",
            "TooltipTrigger",
            "TooltipContent"
        ]),
        svelteTag: "Tooltip",
        defaultProps: {
            text: "Tooltip text",
            side: "top",
            align: "center",
            delayDuration: 700,
            skipDelayDuration: 300,
            disableHoverableContent: false,
            triggerText: "Hover me"
        },
        props: [
            p.text("text", "Text", "content", {
                default: "Tooltip text"
            }),
            p.select("side", "Side", "appearance", SIDE_OPTS, {
                default: "top"
            }),
            p.select("align", "Align", "appearance", ALIGN_OPTS, {
                default: "center"
            }),
            p.number("delayDuration", "Delay (ms)", "advanced", {
                default: 700
            }),
            p.number("skipDelayDuration", "Skip delay (ms)", "advanced", {
                default: 300
            }),
            p.boolean("disableHoverableContent", "Disable hoverable content", "advanced", {
                default: false
            }),
            p.text("triggerText", "Default trigger text", "content", {
                default: "Hover me",
                help: "Used when no child is dropped in."
            })
        ]
    },
    avatar: {
        key: "avatar",
        name: "Avatar",
        group: "data",
        icon: "CircleUser",
        acceptsChildren: false,
        description: "User avatar with image + fallback initials.",
        svelteImport: importGroup("avatar", [
            "Avatar",
            "AvatarImage",
            "AvatarFallback"
        ]),
        svelteTag: "Avatar",
        defaultProps: {
            src: "",
            fallback: "CN",
            alt: ""
        },
        props: [
            p.text("src", "Image src", "content", {
                default: ""
            }),
            p.text("fallback", "Fallback", "content", {
                default: "CN"
            }),
            p.text("alt", "Alt", "advanced")
        ]
    },
    progress: {
        key: "progress",
        name: "Progress",
        group: "data",
        icon: "Gauge",
        acceptsChildren: false,
        description: "Linear progress indicator.",
        svelteImport: importGroup("progress", [
            "Progress"
        ]),
        svelteTag: "Progress",
        defaultProps: {
            value: 33,
            max: 100
        },
        props: [
            p.number("value", "Value", "state", {
                default: 33
            }),
            p.number("max", "Max", "appearance", {
                default: 100
            })
        ]
    },
    skeleton: {
        key: "skeleton",
        name: "Skeleton",
        group: "data",
        icon: "SeparatorHorizontal",
        acceptsChildren: false,
        description: "Loading placeholder block.",
        svelteImport: importGroup("skeleton", [
            "Skeleton"
        ]),
        svelteTag: "Skeleton",
        defaultProps: {
            width: "100%",
            height: "20px",
            className: ""
        },
        props: [
            p.text("width", "Width", "appearance", {
                default: "100%"
            }),
            p.text("height", "Height", "appearance", {
                default: "20px"
            }),
            p.text("className", "Class", "advanced", {
                default: ""
            })
        ]
    },
    // ─── notifications ──────────────────────────────────────────────────────
    alert: {
        key: "alert",
        name: "Alert",
        group: "notifications",
        icon: "AlertTriangle",
        acceptsChildren: false,
        description: "Inline alert message.",
        svelteImport: importGroup("alert", [
            "Alert",
            "AlertTitle",
            "AlertDescription"
        ]),
        svelteTag: "Alert",
        defaultProps: {
            variant: "default",
            title: "Heads up!",
            description: "You can add components to your app."
        },
        props: [
            p.select("variant", "Variant", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "destructive",
                    value: "destructive"
                }
            ], {
                default: "default"
            }),
            p.text("title", "Title", "content", {
                default: "Heads up!"
            }),
            p.textarea("description", "Description", "content", {
                default: "You can add components to your app."
            })
        ]
    },
    dialog: {
        key: "dialog",
        name: "Dialog",
        group: "notifications",
        icon: "PanelTopOpen",
        acceptsChildren: true,
        description: "Modal dialog triggered by a button. Children render as the dialog body.",
        svelteImport: importGroup("dialog", [
            "Dialog",
            "DialogTrigger",
            "DialogContent",
            "DialogHeader",
            "DialogTitle",
            "DialogDescription",
            "DialogFooter"
        ]) + "; " + importDefault("button", "Button"),
        svelteTag: "Dialog",
        defaultProps: {
            triggerText: "Open",
            title: "Dialog",
            description: "Dialog description",
            showFooter: false,
            footerText: "Save changes",
            modal: true
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Open"
            }),
            p.text("title", "Title", "content", {
                default: "Dialog"
            }),
            p.text("description", "Description", "content", {
                default: "Dialog description"
            }),
            p.boolean("showFooter", "Show footer", "appearance", {
                default: false
            }),
            p.text("footerText", "Footer button text", "content", {
                default: "Save changes"
            }),
            p.boolean("modal", "Modal", "advanced", {
                default: true
            })
        ]
    },
    "alert-dialog": {
        key: "alert-dialog",
        name: "Alert Dialog",
        group: "notifications",
        icon: "ShieldAlert",
        acceptsChildren: true,
        description: "Confirmation dialog with action + cancel. Children render as extra body content.",
        svelteImport: importGroup("alert-dialog", [
            "AlertDialog",
            "AlertDialogTrigger",
            "AlertDialogContent",
            "AlertDialogHeader",
            "AlertDialogFooter",
            "AlertDialogTitle",
            "AlertDialogDescription",
            "AlertDialogAction",
            "AlertDialogCancel"
        ]) + "; " + importDefault("button", "Button"),
        svelteTag: "AlertDialog",
        defaultProps: {
            triggerText: "Delete",
            title: "Are you sure?",
            description: "This action cannot be undone.",
            actionText: "Confirm",
            cancelText: "Cancel",
            modal: true
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Delete"
            }),
            p.text("title", "Title", "content", {
                default: "Are you sure?"
            }),
            p.text("description", "Description", "content", {
                default: "This action cannot be undone."
            }),
            p.text("actionText", "Action text", "content", {
                default: "Confirm"
            }),
            p.text("cancelText", "Cancel text", "content", {
                default: "Cancel"
            }),
            p.boolean("modal", "Modal", "advanced", {
                default: true
            })
        ]
    },
    sheet: {
        key: "sheet",
        name: "Sheet",
        group: "notifications",
        icon: "PanelRight",
        acceptsChildren: true,
        description: "Slide-over panel. Children render inside SheetContent.",
        svelteImport: importGroup("sheet", [
            "Sheet",
            "SheetTrigger",
            "SheetContent",
            "SheetHeader",
            "SheetTitle",
            "SheetDescription",
            "SheetFooter"
        ]) + "; " + importDefault("button", "Button"),
        svelteTag: "Sheet",
        defaultProps: {
            triggerText: "Open",
            side: "right",
            title: "Sheet",
            description: "",
            modal: true
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Open"
            }),
            p.select("side", "Side", "appearance", SIDE_OPTS, {
                default: "right"
            }),
            p.text("title", "Title", "content", {
                default: "Sheet"
            }),
            p.text("description", "Description", "content", {
                default: ""
            }),
            p.boolean("modal", "Modal", "advanced", {
                default: true
            })
        ]
    },
    popover: {
        key: "popover",
        name: "Popover",
        group: "notifications",
        icon: "MessageSquare",
        acceptsChildren: true,
        description: "Popover anchored to a trigger button. Children render as the popover content.",
        svelteImport: importGroup("popover", [
            "Popover",
            "PopoverTrigger",
            "PopoverContent"
        ]) + "; " + importDefault("button", "Button"),
        svelteTag: "Popover",
        defaultProps: {
            triggerText: "Open",
            align: "center",
            sideOffset: 4,
            modal: false
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Open"
            }),
            p.select("align", "Align", "appearance", ALIGN_OPTS, {
                default: "center"
            }),
            p.number("sideOffset", "Side offset", "advanced", {
                default: 4
            }),
            p.boolean("modal", "Modal", "advanced", {
                default: false
            })
        ]
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
        svelteImport: lib("sonner", [
            "Toaster"
        ]),
        svelteTag: "Toaster",
        defaultProps: {
            richColors: false,
            closeButton: false,
            position: "bottom-right",
            expand: false,
            duration: 4000,
            visibleToasts: 3
        },
        props: [
            p.boolean("richColors", "Rich colors", "appearance", {
                default: false
            }),
            p.boolean("closeButton", "Close button", "appearance", {
                default: false
            }),
            p.select("position", "Position", "appearance", [
                {
                    label: "top-left",
                    value: "top-left"
                },
                {
                    label: "top-right",
                    value: "top-right"
                },
                {
                    label: "top-center",
                    value: "top-center"
                },
                {
                    label: "bottom-left",
                    value: "bottom-left"
                },
                {
                    label: "bottom-right",
                    value: "bottom-right"
                },
                {
                    label: "bottom-center",
                    value: "bottom-center"
                }
            ], {
                default: "bottom-right"
            }),
            p.boolean("expand", "Expand on hover", "appearance", {
                default: false
            }),
            p.number("duration", "Duration (ms)", "advanced", {
                default: 4000
            }),
            p.number("visibleToasts", "Visible toasts", "advanced", {
                default: 3
            })
        ]
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
        defaultProps: {
            title: "Bar Chart",
            data: "Month,Value\nJan,40\nFeb,65\nMar,50",
            color: "#0f62fe"
        },
        props: [
            p.text("title", "Title", "content", {
                default: "Bar Chart"
            }),
            p.textarea("data", "Data (CSV)", "content", {
                default: "Month,Value\nJan,40\nFeb,65\nMar,50"
            }),
            p.color("color", "Color", "appearance", {
                default: "#0f62fe"
            })
        ]
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
        defaultProps: {
            title: "Line Chart",
            data: "Month,Value\nJan,40\nFeb,65\nMar,50",
            color: "#0f62fe"
        },
        props: [
            p.text("title", "Title", "content", {
                default: "Line Chart"
            }),
            p.textarea("data", "Data (CSV)", "content", {
                default: "Month,Value\nJan,40\nFeb,65\nMar,50"
            }),
            p.color("color", "Color", "appearance", {
                default: "#0f62fe"
            })
        ]
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
        defaultProps: {
            title: "Area Chart",
            data: "Month,Value\nJan,40\nFeb,65\nMar,50",
            color: "#0f62fe"
        },
        props: [
            p.text("title", "Title", "content", {
                default: "Area Chart"
            }),
            p.textarea("data", "Data (CSV)", "content", {
                default: "Month,Value\nJan,40\nFeb,65\nMar,50"
            }),
            p.color("color", "Color", "appearance", {
                default: "#0f62fe"
            })
        ]
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
        defaultProps: {
            title: "Pie Chart",
            data: "Label,Value\nA,40\nB,35\nC,25",
            color: "#0f62fe"
        },
        props: [
            p.text("title", "Title", "content", {
                default: "Pie Chart"
            }),
            p.textarea("data", "Data (CSV)", "content", {
                default: "Label,Value\nA,40\nB,35\nC,25"
            }),
            p.color("color", "Color", "appearance", {
                default: "#0f62fe"
            })
        ]
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
        defaultProps: {
            title: "Donut Chart",
            data: "Label,Value\nA,40\nB,35\nC,25",
            color: "#0f62fe"
        },
        props: [
            p.text("title", "Title", "content", {
                default: "Donut Chart"
            }),
            p.textarea("data", "Data (CSV)", "content", {
                default: "Label,Value\nA,40\nB,35\nC,25"
            }),
            p.color("color", "Color", "appearance", {
                default: "#0f62fe"
            })
        ]
    },
    // ─── icons ──────────────────────────────────────────────────────────────
    icon: {
        key: "icon",
        name: "Icon",
        group: "icons",
        icon: "Sparkles",
        acceptsChildren: false,
        description: "Lucide icon. Set `name` via the icon picker (Task 2).",
        svelteImport: "",
        svelteTag: "Icon",
        defaultProps: {
            name: "Check",
            size: 20,
            color: "currentColor",
            strokeWidth: 2
        },
        props: [
            p.icon("name", "Icon", "content", {
                default: "Check"
            }),
            p.number("size", "Size", "appearance", {
                default: 20
            }),
            p.text("color", "Color", "appearance", {
                default: "currentColor"
            }),
            p.number("strokeWidth", "Stroke width", "appearance", {
                default: 2
            })
        ]
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
        defaultProps: {
            className: "flex flex-row items-center gap-4"
        },
        props: [
            p.text("className", "Tailwind classes", "content", {
                default: "flex flex-row items-center gap-4"
            })
        ]
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
        defaultProps: {
            className: "flex flex-col gap-4"
        },
        props: [
            p.text("className", "Tailwind classes", "content", {
                default: "flex flex-col gap-4"
            })
        ]
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
        defaultProps: {
            className: "grid grid-cols-2 gap-4",
            cols: 2,
            gap: 4
        },
        props: [
            p.text("className", "Tailwind classes", "content", {
                default: "grid grid-cols-2 gap-4"
            }),
            p.number("cols", "Columns", "appearance", {
                default: 2
            }),
            p.number("gap", "Gap (px)", "appearance", {
                default: 4
            })
        ]
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
        defaultProps: {
            className: "p-4 border rounded"
        },
        props: [
            p.text("className", "Tailwind classes", "content", {
                default: "p-4 border rounded"
            })
        ]
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
        defaultProps: {
            className: "flex flex-col gap-2"
        },
        props: [
            p.text("className", "Tailwind classes", "content", {
                default: "flex flex-col gap-2"
            })
        ]
    },
    // ─── containers-shadcn ──────────────────────────────────────────────────
    card: {
        key: "card",
        name: "Card",
        group: "containers-shadcn",
        icon: "Square",
        acceptsChildren: true,
        description: "shadcn Card with header + content area. Children render in CardContent.",
        svelteImport: importGroup("card", [
            "Card",
            "CardHeader",
            "CardTitle",
            "CardDescription",
            "CardContent",
            "CardFooter"
        ]),
        svelteTag: "Card",
        defaultProps: {
            title: "Card title",
            description: "Card description",
            showFooter: false,
            footerText: "",
            className: ""
        },
        props: [
            p.text("title", "Title", "content", {
                default: "Card title"
            }),
            p.text("description", "Description", "content", {
                default: "Card description"
            }),
            p.boolean("showFooter", "Show footer", "appearance", {
                default: false
            }),
            p.text("footerText", "Footer text", "content", {
                default: ""
            }),
            p.text("className", "Class", "advanced", {
                default: ""
            })
        ]
    },
    separator: {
        key: "separator",
        name: "Separator",
        group: "containers-shadcn",
        icon: "SeparatorHorizontal",
        acceptsChildren: false,
        description: "Horizontal/vertical divider.",
        svelteImport: importGroup("separator", [
            "Separator"
        ]),
        svelteTag: "Separator",
        defaultProps: {
            orientation: "horizontal",
            decorative: false
        },
        props: [
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "horizontal"
            }),
            p.boolean("decorative", "Decorative", "advanced", {
                default: false
            })
        ]
    },
    "scroll-area": {
        key: "scroll-area",
        name: "Scroll Area",
        group: "containers-shadcn",
        icon: "ScrollText",
        acceptsChildren: true,
        description: "Custom-scrollbar container.",
        svelteImport: importGroup("scroll-area", [
            "ScrollArea"
        ]),
        svelteTag: "ScrollArea",
        defaultProps: {
            className: "h-72 w-full",
            orientation: "vertical"
        },
        props: [
            p.text("className", "Class", "advanced", {
                default: "h-72 w-full"
            }),
            p.select("orientation", "Scrollbar", "appearance", [
                {
                    label: "vertical",
                    value: "vertical"
                },
                {
                    label: "horizontal",
                    value: "horizontal"
                },
                {
                    label: "both",
                    value: "both"
                }
            ], {
                default: "vertical"
            })
        ]
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
        svelteImport: importGroup("aspect-ratio", [
            "AspectRatio"
        ]),
        svelteTag: "AspectRatio",
        defaultProps: {
            ratio: 1.7778
        },
        props: [
            p.number("ratio", "Ratio (w/h)", "appearance", {
                default: 1.7778,
                help: "16:9 ≈ 1.7778, 4:3 ≈ 1.3333, 1:1 = 1."
            })
        ]
    },
    calendar: {
        key: "calendar",
        name: "Calendar",
        group: "inputs",
        icon: "Calendar",
        acceptsChildren: false,
        description: "Date picker calendar (bits-ui based).",
        svelteImport: importGroup("calendar", [
            "Calendar"
        ]),
        svelteTag: "Calendar",
        defaultProps: {
            value: "",
            numberOfMonths: 1
        },
        props: [
            p.text("value", "Value (ISO)", "state", {
                default: ""
            }),
            p.number("numberOfMonths", "Months shown", "appearance", {
                default: 1
            })
        ]
    },
    carousel: {
        key: "carousel",
        name: "Carousel",
        group: "data",
        icon: "GalleryHorizontalEnd",
        acceptsChildren: true,
        description: "Embla-powered carousel with prev/next controls. Drag child nodes in — each child becomes a CarouselItem.",
        svelteImport: importGroup("carousel", [
            "Carousel",
            "CarouselContent",
            "CarouselItem",
            "CarouselPrevious",
            "CarouselNext"
        ]),
        svelteTag: "Carousel",
        defaultProps: {
            "opts-loop": false,
            "opts-align": "start",
            orientation: "horizontal"
        },
        props: [
            p.boolean("opts-loop", "Loop", "appearance", {
                default: false
            }),
            p.select("opts-align", "Align", "appearance", [
                {
                    label: "start",
                    value: "start"
                },
                {
                    label: "center",
                    value: "center"
                },
                {
                    label: "end",
                    value: "end"
                }
            ], {
                default: "start"
            }),
            p.select("orientation", "Orientation", "appearance", ORIENTATION_OPTS, {
                default: "horizontal"
            })
        ]
    },
    command: {
        key: "command",
        name: "Command",
        group: "inputs",
        icon: "Command",
        acceptsChildren: true,
        description: "cmdk-powered command palette. Drag child nodes in — each child becomes a CommandItem.",
        svelteImport: importGroup("command", [
            "Command",
            "CommandInput",
            "CommandList",
            "CommandEmpty",
            "CommandGroup",
            "CommandItem"
        ]),
        svelteTag: "Command",
        defaultProps: {
            placeholder: "Search…"
        },
        props: [
            p.text("placeholder", "Placeholder", "content", {
                default: "Search…"
            })
        ]
    },
    "context-menu": {
        key: "context-menu",
        name: "Context Menu",
        group: "data",
        icon: "MousePointerClick",
        acceptsChildren: true,
        description: "Right-click menu. Drag child nodes in — each child becomes a ContextMenuItem.",
        svelteImport: importGroup("context-menu", [
            "ContextMenu",
            "ContextMenuTrigger",
            "ContextMenuContent",
            "ContextMenuItem"
        ]),
        svelteTag: "ContextMenu",
        defaultProps: {
            triggerText: "Right-click here",
            modal: true
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Right-click here"
            }),
            p.boolean("modal", "Modal", "advanced", {
                default: true
            })
        ]
    },
    drawer: {
        key: "drawer",
        name: "Drawer",
        group: "notifications",
        icon: "PanelBottomOpen",
        acceptsChildren: true,
        description: "Vaul-powered slide-over drawer. Children render inside DrawerContent.",
        svelteImport: importGroup("drawer", [
            "Drawer",
            "DrawerTrigger",
            "DrawerContent",
            "DrawerHeader",
            "DrawerTitle",
            "DrawerDescription",
            "DrawerFooter"
        ]) + "; " + importGroup("button", [
            "Button"
        ]),
        svelteTag: "Drawer",
        defaultProps: {
            triggerText: "Open",
            title: "Drawer",
            description: "",
            side: "bottom",
            shouldScaleBackground: true
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Open"
            }),
            p.text("title", "Title", "content", {
                default: "Drawer"
            }),
            p.text("description", "Description", "content", {
                default: ""
            }),
            p.select("side", "Side", "appearance", SIDE_OPTS, {
                default: "bottom"
            }),
            p.boolean("shouldScaleBackground", "Scale background", "advanced", {
                default: true
            })
        ]
    },
    empty: {
        key: "empty",
        name: "Empty",
        group: "data",
        icon: "SearchX",
        acceptsChildren: true,
        description: "Empty-state placeholder (icon + title + description). Drop children below for an action.",
        svelteImport: importGroup("empty", [
            "Empty",
            "EmptyMedia",
            "EmptyHeader",
            "EmptyTitle",
            "EmptyDescription",
            "EmptyContent"
        ]),
        svelteTag: "Empty",
        defaultProps: {
            title: "No results",
            description: "Try adjusting your search.",
            icon: "Search"
        },
        props: [
            p.text("title", "Title", "content", {
                default: "No results"
            }),
            p.text("description", "Description", "content", {
                default: "Try adjusting your search."
            }),
            p.icon("icon", "Icon (lucide name)", "content", {
                default: "Search"
            })
        ]
    },
    field: {
        key: "field",
        name: "Field",
        group: "inputs",
        icon: "FormInput",
        acceptsChildren: true,
        description: "Form field wrapper (label + input + description + error). Drag an Input/Select/etc. INTO me.",
        svelteImport: importGroup("field", [
            "Field",
            "FieldLabel",
            "FieldDescription",
            "FieldError"
        ]),
        svelteTag: "Field",
        defaultProps: {
            label: "Email",
            description: "",
            error: "",
            orientation: "vertical"
        },
        props: [
            p.text("label", "Label", "content", {
                default: "Email"
            }),
            p.text("description", "Description", "advanced", {
                default: ""
            }),
            p.text("error", "Error", "state", {
                default: ""
            }),
            p.select("orientation", "Orientation", "appearance", [
                {
                    label: "vertical",
                    value: "vertical"
                },
                {
                    label: "horizontal",
                    value: "horizontal"
                },
                {
                    label: "responsive",
                    value: "responsive"
                }
            ], {
                default: "vertical"
            })
        ]
    },
    "hover-card": {
        key: "hover-card",
        name: "Hover Card",
        group: "data",
        icon: "SquareMousePointer",
        acceptsChildren: true,
        description: "Card shown on hover over a trigger. Drop children into me as the content.",
        svelteImport: importGroup("hover-card", [
            "HoverCard",
            "HoverCardTrigger",
            "HoverCardContent"
        ]),
        svelteTag: "HoverCard",
        defaultProps: {
            triggerText: "Hover me",
            text: "Hover card content",
            align: "center",
            sideOffset: 4,
            openDelay: 700,
            closeDelay: 300
        },
        props: [
            p.text("triggerText", "Trigger text", "content", {
                default: "Hover me"
            }),
            p.text("text", "Content (used if no children)", "content", {
                default: "Hover card content"
            }),
            p.select("align", "Align", "appearance", ALIGN_OPTS, {
                default: "center"
            }),
            p.number("sideOffset", "Side offset", "advanced", {
                default: 4
            }),
            p.number("openDelay", "Open delay (ms)", "advanced", {
                default: 700
            }),
            p.number("closeDelay", "Close delay (ms)", "advanced", {
                default: 300
            })
        ]
    },
    "input-group": {
        key: "input-group",
        name: "Input Group",
        group: "inputs",
        icon: "Combine",
        acceptsChildren: true,
        description: "Input with left/right addons. Drag an Input INTO me as the main control; leftAddon/rightAddon props render the side text.",
        svelteImport: importGroup("input-group", [
            "InputGroup",
            "InputGroupInput",
            "InputGroupText"
        ]),
        svelteTag: "InputGroup",
        defaultProps: {
            placeholder: "Enter…",
            value: "",
            type: "text",
            leftAddon: "",
            rightAddon: ""
        },
        props: [
            p.text("placeholder", "Placeholder", "content", {
                default: "Enter…"
            }),
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.select("type", "Type", "appearance", [
                {
                    label: "text",
                    value: "text"
                },
                {
                    label: "email",
                    value: "email"
                },
                {
                    label: "password",
                    value: "password"
                },
                {
                    label: "number",
                    value: "number"
                }
            ], {
                default: "text"
            }),
            p.text("leftAddon", "Left addon", "content", {
                default: ""
            }),
            p.text("rightAddon", "Right addon", "content", {
                default: ""
            })
        ]
    },
    item: {
        key: "item",
        name: "Item",
        group: "data",
        icon: "Square",
        acceptsChildren: true,
        description: "Generic list-item primitive (shadcn Item). Useful as a child of dropdown/context menus, etc.",
        svelteImport: importGroup("item", [
            "Item"
        ]),
        svelteTag: "Item",
        defaultProps: {
            text: "Item",
            variant: "default"
        },
        props: [
            p.text("text", "Text", "content", {
                default: "Item"
            }),
            p.select("variant", "Variant", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "destructive",
                    value: "destructive"
                }
            ], {
                default: "default"
            })
        ]
    },
    kbd: {
        key: "kbd",
        name: "Kbd",
        group: "data",
        icon: "Keyboard",
        acceptsChildren: false,
        description: "Keyboard shortcut pill.",
        svelteImport: importGroup("kbd", [
            "Kbd"
        ]),
        svelteTag: "Kbd",
        defaultProps: {
            text: "⌘K",
            size: "default"
        },
        props: [
            p.text("text", "Text", "content", {
                default: "⌘K"
            }),
            p.select("size", "Size", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "sm",
                    value: "sm"
                },
                {
                    label: "lg",
                    value: "lg"
                }
            ], {
                default: "default"
            })
        ]
    },
    "native-select": {
        key: "native-select",
        name: "Native Select",
        group: "inputs",
        icon: "ChevronDown",
        acceptsChildren: false,
        description: "Plain HTML <select> styled by shadcn.",
        svelteImport: importGroup("native-select", [
            "NativeSelect",
            "NativeSelectOption"
        ]),
        svelteTag: "NativeSelect",
        defaultProps: {
            value: "",
            options: "Apple\nBanana\nCherry",
            disabled: false
        },
        props: [
            p.text("value", "Value", "state", {
                default: ""
            }),
            p.textarea("options", "Options (one per line)", "content", {
                default: "Apple\nBanana\nCherry"
            }),
            p.boolean("disabled", "Disabled", "state", {
                default: false
            })
        ]
    },
    "range-calendar": {
        key: "range-calendar",
        name: "Range Calendar",
        group: "inputs",
        icon: "CalendarRange",
        acceptsChildren: false,
        description: "Calendar that picks a start/end date range.",
        svelteImport: importGroup("range-calendar", [
            "RangeCalendar"
        ]),
        svelteTag: "RangeCalendar",
        defaultProps: {
            start: "",
            end: "",
            numberOfMonths: 1
        },
        props: [
            p.text("start", "Start (ISO)", "state", {
                default: ""
            }),
            p.text("end", "End (ISO)", "state", {
                default: ""
            }),
            p.number("numberOfMonths", "Months shown", "appearance", {
                default: 1
            })
        ]
    },
    resizable: {
        key: "resizable",
        name: "Resizable",
        group: "containers-shadcn",
        icon: "PanelLeft",
        acceptsChildren: true,
        description: "Resizable panel group (paneforge based). Drag child nodes in — each child becomes a ResizablePane (handles auto-inserted between).",
        svelteImport: importGroup("resizable", [
            "ResizablePaneGroup",
            "ResizablePane",
            "ResizableHandle"
        ]),
        svelteTag: "ResizablePaneGroup",
        defaultProps: {
            direction: "horizontal",
            withHandle: true
        },
        props: [
            p.select("direction", "Direction", "appearance", ORIENTATION_OPTS, {
                default: "horizontal"
            }),
            p.boolean("withHandle", "Show handle", "appearance", {
                default: true
            })
        ]
    },
    sidebar: {
        key: "sidebar",
        name: "Sidebar",
        group: "navigation",
        icon: "PanelLeft",
        acceptsChildren: true,
        description: "Application sidebar. Drag child nodes in — each child becomes a SidebarMenuItem/SidebarMenuButton.",
        svelteImport: importGroup("sidebar", [
            "SidebarProvider",
            "Sidebar",
            "SidebarContent",
            "SidebarGroup",
            "SidebarGroupLabel",
            "SidebarMenu",
            "SidebarMenuItem",
            "SidebarMenuButton"
        ]),
        svelteTag: "Sidebar",
        defaultProps: {
            label: "Application",
            side: "left",
            variant: "sidebar",
            collapsible: "offcanvas"
        },
        props: [
            p.text("label", "Group label", "content", {
                default: "Application"
            }),
            p.select("side", "Side", "appearance", [
                {
                    label: "left",
                    value: "left"
                },
                {
                    label: "right",
                    value: "right"
                }
            ], {
                default: "left"
            }),
            p.select("variant", "Variant", "appearance", [
                {
                    label: "sidebar",
                    value: "sidebar"
                },
                {
                    label: "floating",
                    value: "floating"
                },
                {
                    label: "inset",
                    value: "inset"
                }
            ], {
                default: "sidebar"
            }),
            p.select("collapsible", "Collapsible", "appearance", [
                {
                    label: "offcanvas",
                    value: "offcanvas"
                },
                {
                    label: "icon",
                    value: "icon"
                },
                {
                    label: "none",
                    value: "none"
                }
            ], {
                default: "offcanvas"
            })
        ]
    },
    spinner: {
        key: "spinner",
        name: "Spinner",
        group: "data",
        icon: "LoaderCircle",
        acceptsChildren: false,
        description: "Animated loading spinner.",
        svelteImport: importGroup("spinner", [
            "Spinner"
        ]),
        svelteTag: "Spinner",
        defaultProps: {
            size: "default"
        },
        props: [
            p.select("size", "Size", "appearance", [
                {
                    label: "default",
                    value: "default"
                },
                {
                    label: "sm",
                    value: "sm"
                },
                {
                    label: "lg",
                    value: "lg"
                }
            ], {
                default: "default"
            })
        ]
    },
    table: {
        key: "table",
        name: "Table (static)",
        group: "data",
        icon: "Table",
        acceptsChildren: true,
        description: "shadcn Table (one column per line; rows comma-separated). Optionally drop child rows — each child renders as an extra TableRow in the body.",
        svelteImport: importGroup("table", [
            "Table",
            "TableHeader",
            "TableBody",
            "TableRow",
            "TableHead",
            "TableCell",
            "TableCaption",
            "TableFooter"
        ]),
        svelteTag: "Table",
        defaultProps: {
            columns: "Name\nAge",
            rows: "Alice,30\nBob,25",
            caption: ""
        },
        props: [
            p.textarea("columns", "Columns (one per line)", "content", {
                default: "Name\nAge"
            }),
            p.textarea("rows", "Rows (comma-separated)", "content", {
                default: "Alice,30\nBob,25"
            }),
            p.text("caption", "Caption", "content", {
                default: ""
            })
        ]
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
            text: "The quick brown fox jumps over the lazy dog."
        },
        props: [
            p.select("variant", "Variant", "appearance", [
                {
                    label: "h1",
                    value: "h1"
                },
                {
                    label: "h2",
                    value: "h2"
                },
                {
                    label: "h3",
                    value: "h3"
                },
                {
                    label: "h4",
                    value: "h4"
                },
                {
                    label: "p",
                    value: "p"
                },
                {
                    label: "lead",
                    value: "lead"
                },
                {
                    label: "large",
                    value: "large"
                },
                {
                    label: "small",
                    value: "small"
                },
                {
                    label: "muted",
                    value: "muted"
                },
                {
                    label: "blockquote",
                    value: "blockquote"
                }
            ], {
                default: "p"
            }),
            p.text("text", "Text", "content", {
                default: "The quick brown fox jumps over the lazy dog."
            })
        ]
    }
};
// ---------------------------------------------------------------------------
// Composite container default children — pre-seed sensible defaults so a
// freshly-added container looks right out of the box.
// ---------------------------------------------------------------------------
/** Lightweight text-bearing child for list-like containers (menus, accordions, tabs). */ function textItem(text) {
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10),
        component: "item",
        variant: "normal",
        props: {
            text,
            variant: "default"
        },
        children: []
    };
}
/** A typography paragraph used as default Card/DialogContent. */ function para(text) {
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10),
        component: "typography",
        variant: "normal",
        props: {
            variant: "p",
            text
        },
        children: []
    };
}
/** A button (used as default button-group child, dialog trigger etc.). */ function buttonChild(text, variant = "default") {
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10),
        component: "button",
        variant: "normal",
        props: {
            variant,
            size: "default",
            text,
            disabled: false,
            type: "button"
        },
        children: []
    };
}
/**
 * Produce the default child set for a composite container key.
 * Returns a fresh deep-cloned array each call (new ids).
 */ function defaultChildrenFor(key) {
    switch(key){
        case "card":
            return [
                para("Card content goes here. Drop any component into me.")
            ];
        case "dialog":
            return [
                para("Dialog body. Drop any component into me.")
            ];
        case "alert-dialog":
            return [];
        case "sheet":
            return [
                para("Sheet body. Drop any component into me.")
            ];
        case "drawer":
            return [
                para("Drawer body. Drop any component into me.")
            ];
        case "popover":
            return [
                para("Popover body.")
            ];
        case "hover-card":
            return [
                para("Hover card body.")
            ];
        case "tooltip":
            return []; // trigger provided by triggerText default
        case "dropdown-menu":
            return [
                textItem("Edit"),
                textItem("Duplicate"),
                textItem("Delete")
            ];
        case "context-menu":
            return [
                textItem("Back"),
                textItem("Reload"),
                textItem("Copy")
            ];
        case "menubar":
            {
                // 2 menus, each with 2 item children
                const file = textItem("File");
                file.children = [
                    textItem("New"),
                    textItem("Open…")
                ];
                const edit = textItem("Edit");
                edit.children = [
                    textItem("Undo"),
                    textItem("Redo")
                ];
                return [
                    file,
                    edit
                ];
            }
        case "navigation-menu":
            {
                // 2 nav items, each with content children
                const home = textItem("Home");
                home.children = [
                    para("Welcome home.")
                ];
                const about = textItem("About");
                about.children = [
                    para("About us content.")
                ];
                return [
                    home,
                    about
                ];
            }
        case "tabs":
            {
                const t1 = textItem("Account");
                t1.children = [
                    para("Account settings.")
                ];
                const t2 = textItem("Password");
                t2.children = [
                    para("Password settings.")
                ];
                return [
                    t1,
                    t2
                ];
            }
        case "accordion":
            {
                const s1 = textItem("Section 1");
                s1.children = [
                    para("Content for section 1.")
                ];
                const s2 = textItem("Section 2");
                s2.children = [
                    para("Content for section 2.")
                ];
                return [
                    s1,
                    s2
                ];
            }
        case "carousel":
            {
                const make = (n)=>{
                    const node = textItem(`Slide ${n}`);
                    // Carousel items typically just have visual content; the item's
                    // text is the slide label and its children the slide body.
                    node.children = [
                        para(`Slide ${n} content.`)
                    ];
                    return node;
                };
                return [
                    make(1),
                    make(2),
                    make(3)
                ];
            }
        case "collapsible":
            return [
                para("Collapsible body.")
            ];
        case "button-group":
            return [
                buttonChild("Bold", "secondary"),
                buttonChild("Italic", "secondary"),
                buttonChild("Underline", "secondary")
            ];
        case "scroll-area":
            return [
                para("Line one of scrollable content."),
                para("Line two of scrollable content."),
                para("Line three of scrollable content."),
                para("Line four of scrollable content.")
            ];
        case "aspect-ratio":
            return [];
        case "resizable":
            return [
                para("Panel 1"),
                para("Panel 2")
            ];
        case "sidebar":
            return [
                textItem("Dashboard"),
                textItem("Projects"),
                textItem("Settings")
            ];
        case "command":
            return [
                textItem("Apple"),
                textItem("Banana"),
                textItem("Cherry")
            ];
        case "field":
            {
                const input = createNode("input");
                input.props.placeholder = "you@example.com";
                input.props.type = "email";
                return [
                    input
                ];
            }
        case "input-group":
            {
                const input = createNode("input");
                input.props.placeholder = "Amount";
                input.props.value = "";
                return [
                    input
                ];
            }
        case "empty":
            return [
                buttonChild("Try again", "outline")
            ];
        case "table":
            return []; // table uses columns/rows textareas by default; children optional
        default:
            return [];
    }
}
function getComponent(key) {
    const c = COMPONENTS[key];
    if (!c) {
        throw new Error(`[frame] unknown component key: "${key}"`);
    }
    return c;
}
function createNode(key) {
    const schema = getComponent(key);
    const props = {};
    for (const [k, v] of Object.entries(schema.defaultProps)){
        // copy primitives verbatim
        props[k] = v;
    }
    const variant = "normal";
    const children = schema.acceptsChildren ? defaultChildrenFor(key) : [];
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10),
        component: key,
        variant,
        props,
        children
    };
}
}),
"[project]/src/lib/frame/codegen.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateJSON",
    ()=>generateJSON,
    "generateSvelte",
    ()=>generateSvelte,
    "parseJSON",
    ()=>parseJSON
]);
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/frame/registry.ts [app-ssr] (ecmascript)");
;
// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------
/** Props whose value should always be emitted to markup even when default. */ const ALWAYS_EMIT = new Set([
    // content / value
    "text",
    "value",
    "variant",
    "title",
    "description",
    "triggerText",
    "placeholder",
    "label",
    "items",
    "options",
    "tabs",
    "menus",
    "columns",
    "rows",
    "data",
    "color",
    "name",
    "href",
    "actionText",
    "cancelText",
    "fallback",
    "src",
    "alt",
    "page",
    "totalPages",
    "width",
    "height",
    "size",
    "strokeWidth",
    "side",
    "orientation",
    "type",
    "cols",
    "gap",
    "min",
    "max",
    "step",
    "length",
    "position",
    "richColors",
    "closeButton",
    "expand",
    "duration",
    "visibleToasts",
    "pressed",
    "checked",
    "open",
    "disabled",
    "readonly",
    "target",
    "htmlFor",
    "id",
    "rows",
    "ratio",
    "numberOfMonths",
    "direction",
    "caption",
    "leftAddon",
    "rightAddon",
    "start",
    "end",
    "error",
    "align",
    "decorative",
    "sideOffset",
    "delayDuration",
    "skipDelayDuration",
    "openDelay",
    "closeDelay",
    "defaultValue",
    "loop",
    "activateOn",
    "modal",
    "shouldScaleBackground",
    "withHandle",
    "viewport",
    "collapsible",
    "showFooter",
    "footerText",
    "defaultOpen",
    "disableHoverableContent",
    // DataTable feature flags
    "sortable",
    "filterable",
    "paginated",
    "selectable",
    "pageSize"
]);
function escapeAttr(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}
/** Escape text content for Svelte — avoid HTML-injection issues. */ function escapeText(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/** PascalCase → kebab-case (used for @lucide/svelte icon import paths). */ function toKebab(name) {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
}
/** Convert any-case to PascalCase (icon name → Svelte component name). */ function toPascal(name) {
    if (!name) return "Check";
    const parts = name.replace(/[-_\s]+/g, " ").split(" ");
    return parts.map((p)=>p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p).join("");
}
/** Parse a CSV-ish textarea (first line = headers, rest = rows). */ function parseCSV(input) {
    const lines = input.trim().split(/\r?\n/).filter((l)=>l.length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map((h)=>h.trim());
    const rows = [];
    for(let i = 1; i < lines.length; i++){
        const cells = lines[i].split(",").map((c)=>c.trim());
        const row = {};
        headers.forEach((h, idx)=>{
            const v = cells[idx] ?? "";
            const num = Number(v);
            row[h] = v !== "" && !isNaN(num) ? num : v;
        });
        rows.push(row);
    }
    return rows;
}
function dataToJSLiteral(rows) {
    if (rows.length === 0) return "[]";
    const items = rows.map((r)=>{
        const pairs = Object.entries(r).map(([k, v])=>`${JSON.stringify(k)}: ${typeof v === "number" ? v : JSON.stringify(v)}`);
        return `  { ${pairs.join(", ")} }`;
    });
    return `[\n${items.join(",\n")}\n]`;
}
function indentBlock(text, levels) {
    if (levels <= 0) return text;
    const pad = "  ".repeat(levels);
    return text.split("\n").map((l)=>l.length > 0 ? pad + l : l).join("\n");
}
function splitLines(s) {
    return s.replace(/\r\n/g, "\n").split("\n").map((l)=>l.trim()).filter((l)=>l.length > 0);
}
/** Get the label of a child node — used by list containers (Tabs, Accordion, etc.). */ function childLabel(node, fallback = "Item") {
    const t = node.props.text ?? node.props.title ?? node.props.label ?? node.props.name;
    return t ? String(t) : fallback;
}
function newCtx() {
    return {
        imports: new Map(),
        chartVars: [],
        usedIcons: new Map(),
        constDecls: [],
        hasSkeleton: false,
        chartCounter: 0
    };
}
/**
 * Parse one or more `import { A, B } from "mod";` statements out of an
 * arbitrary string (registry svelteImport field). Returns one entry per
 * named-import statement. Default-import lines (e.g. lucide icons) and
 * comment-only lines produce no entries here — they're handled elsewhere.
 */ function parseNamedImports(stmt) {
    const out = [];
    const re = /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
    let m;
    while((m = re.exec(stmt)) !== null){
        const names = m[1].split(",").map((s)=>s.trim()).filter((s)=>s.length > 0);
        const modulePath = m[2];
        if (names.length > 0) out.push({
            names,
            modulePath
        });
    }
    return out;
}
/** Merge a parsed import statement into the ctx.imports map. */ function ensureImport(ctx, stmt) {
    const trimmed = stmt.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("//")) return;
    for (const { names, modulePath } of parseNamedImports(trimmed)){
        let set = ctx.imports.get(modulePath);
        if (!set) {
            set = new Set();
            ctx.imports.set(modulePath, set);
        }
        for (const n of names)set.add(n);
    }
}
function attrsToString(attrs) {
    const parts = [];
    for (const a of attrs){
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
 */ function buildAttrs(node, opts = {}) {
    const schema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getComponent"])(node.component);
    const out = [];
    for (const [key, value] of Object.entries(node.props)){
        if (opts.omit?.has(key)) continue;
        const isAlways = ALWAYS_EMIT.has(key);
        const def = schema.defaultProps[key];
        const differs = value !== def;
        if (!isAlways && !differs) continue;
        if (key === "className") {
            if (value === "" || value == null) continue;
            out.push({
                name: "class",
                value
            });
            continue;
        }
        out.push({
            name: key,
            value
        });
    }
    return out;
}
// ---------------------------------------------------------------------------
// Renderers — each returns a string (possibly multi-line) already indented
// to the requested `indent` level.
// ---------------------------------------------------------------------------
function renderChildren(ctx, children, indent) {
    if (children.length === 0) return "";
    return children.map((c)=>renderNode(ctx, c, indent)).join("\n\n");
}
function renderNode(ctx, node, indent) {
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
    switch(node.component){
        // ── inputs ──
        case "input":
            return renderInput(ctx, node, indent);
        case "textarea":
            return renderSimple(ctx, node, indent, "Textarea");
        case "label":
            return renderLabel(ctx, node, indent);
        case "checkbox":
            return renderCheckbox(ctx, node, indent);
        case "radio-group":
            return renderRadioGroup(ctx, node, indent);
        case "switch":
            return renderSwitch(ctx, node, indent);
        case "slider":
            return renderSlider(ctx, node, indent);
        case "select":
            return renderSelect(ctx, node, indent);
        case "combobox":
            return renderCombobox(ctx, node, indent);
        case "date-picker":
            return renderDatePicker(ctx, node, indent);
        case "input-otp":
            return renderInputOTP(ctx, node, indent);
        case "toggle-group":
            return renderToggleGroup(ctx, node, indent);
        case "calendar":
            return renderCalendar(ctx, node, indent);
        case "range-calendar":
            return renderRangeCalendar(ctx, node, indent);
        case "native-select":
            return renderNativeSelect(ctx, node, indent);
        case "input-group":
            return renderInputGroup(ctx, node, indent);
        case "command":
            return renderCommand(ctx, node, indent);
        case "field":
            return renderField(ctx, node, indent);
        // ── actions ──
        case "button":
            return renderButton(ctx, node, indent);
        case "button-group":
            return renderButtonGroup(ctx, node, indent);
        case "dropdown-menu":
            return renderDropdownMenu(ctx, node, indent);
        case "link":
            return renderLink(ctx, node, indent);
        case "toggle":
            return renderToggle(ctx, node, indent);
        // ── navigation ──
        case "tabs":
            return renderTabs(ctx, node, indent);
        case "breadcrumb":
            return renderBreadcrumb(ctx, node, indent);
        case "pagination":
            return renderPagination(ctx, node, indent);
        case "menubar":
            return renderMenubar(ctx, node, indent);
        case "navigation-menu":
            return renderNavigationMenu(ctx, node, indent);
        case "sidebar":
            return renderSidebar(ctx, node, indent);
        // ── data ──
        case "data-table":
            return renderDataTable(ctx, node, indent);
        case "table":
            return renderTable(ctx, node, indent);
        case "accordion":
            return renderAccordion(ctx, node, indent);
        case "badge":
            return renderBadge(ctx, node, indent);
        case "collapsible":
            return renderCollapsible(ctx, node, indent);
        case "tooltip":
            return renderTooltip(ctx, node, indent);
        case "avatar":
            return renderAvatar(ctx, node, indent);
        case "progress":
            return renderProgress(ctx, node, indent);
        case "skeleton":
            return renderSkeletonNode(ctx, node, indent);
        case "carousel":
            return renderCarousel(ctx, node, indent);
        case "context-menu":
            return renderContextMenu(ctx, node, indent);
        case "hover-card":
            return renderHoverCard(ctx, node, indent);
        case "aspect-ratio":
            return renderAspectRatio(ctx, node, indent);
        case "empty":
            return renderEmpty(ctx, node, indent);
        case "item":
            return renderItem(ctx, node, indent);
        case "kbd":
            return renderKbd(ctx, node, indent);
        case "spinner":
            return renderSpinner(ctx, node, indent);
        case "typography":
            return renderTypography(ctx, node, indent);
        // ── notifications ──
        case "alert":
            return renderAlert(ctx, node, indent);
        case "dialog":
            return renderDialog(ctx, node, indent);
        case "alert-dialog":
            return renderAlertDialog(ctx, node, indent);
        case "sheet":
            return renderSheet(ctx, node, indent);
        case "popover":
            return renderPopover(ctx, node, indent);
        case "drawer":
            return renderDrawer(ctx, node, indent);
        case "sonner":
            return renderSonner(ctx, node, indent);
        // ── charts ──
        case "chart-bar":
            return renderChart(ctx, node, indent, "BarChart");
        case "chart-line":
            return renderChart(ctx, node, indent, "LineChart");
        case "chart-area":
            return renderChart(ctx, node, indent, "AreaChart");
        case "chart-pie":
            return renderChart(ctx, node, indent, "PieChart");
        case "chart-donut":
            return renderChart(ctx, node, indent, "Donut");
        // ── icons ──
        case "icon":
            return renderIcon(ctx, node, indent);
        // ── containers-tailwind ──
        case "flex-row":
        case "flex-col":
        case "grid":
        case "box":
        case "stack":
            return renderHtmlContainer(ctx, node, indent);
        // ── containers-shadcn ──
        case "card":
            return renderCard(ctx, node, indent);
        case "separator":
            return renderSeparator(ctx, node, indent);
        case "scroll-area":
            return renderScrollArea(ctx, node, indent);
        case "resizable":
            return renderResizable(ctx, node, indent);
        default:
            return `${"  ".repeat(indent)}<!-- unimplemented: ${node.component} -->`;
    }
}
function getComponentSafe(key) {
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getComponent"])(key);
        return true;
    } catch  {
        return false;
    }
}
function ensureComponentImport(ctx, key) {
    const schema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getComponent"])(key);
    if (schema.svelteImport) {
        schema.svelteImport.split(/\s*;\s*/).forEach((s)=>ensureImport(ctx, s));
    }
}
// ── concrete renderers ──
function renderInput(ctx, node, indent) {
    ensureComponentImport(ctx, "input");
    const pad = "  ".repeat(indent);
    const attrs = buildAttrs(node, {
        omit: new Set([
            "label"
        ])
    });
    const label = String(node.props.label ?? "");
    const lines = [];
    if (label) {
        ensureComponentImport(ctx, "label");
        lines.push(`${pad}<label class="text-sm font-medium" for="${escapeAttr(node.id)}">${escapeText(label)}</label>`);
    }
    lines.push(`${pad}<Input${attrsToString(attrs)} id="${escapeAttr(node.id)}" />`);
    return lines.join("\n");
}
function renderSimple(ctx, node, indent, tag, importKey) {
    ensureComponentImport(ctx, importKey ?? tag.toLowerCase());
    const pad = "  ".repeat(indent);
    const attrs = buildAttrs(node, {
        omit: new Set([
            "label"
        ])
    });
    return `${pad}<${tag}${attrsToString(attrs)} />`;
}
function renderLabel(ctx, node, indent) {
    ensureComponentImport(ctx, "label");
    const pad = "  ".repeat(indent);
    const text = String(node.props.text ?? "");
    const attrs = buildAttrs(node, {
        omit: new Set([
            "text"
        ])
    });
    return `${pad}<Label${attrsToString(attrs)}>${escapeText(text)}</Label>`;
}
function renderCheckbox(ctx, node, indent) {
    ensureComponentImport(ctx, "checkbox");
    const pad = "  ".repeat(indent);
    const attrs = buildAttrs(node, {
        omit: new Set([
            "label"
        ])
    });
    const label = String(node.props.label ?? "");
    const lines = [
        `${pad}<div class="flex items-center gap-2">`,
        `${pad}  <Checkbox${attrsToString(attrs)} id="${escapeAttr(node.id)}" />`
    ];
    if (label) {
        ensureComponentImport(ctx, "label");
        lines.push(`${pad}  <Label for="${escapeAttr(node.id)}">${escapeText(label)}</Label>`);
    }
    lines.push(`${pad}</div>`);
    return lines.join("\n");
}
function renderRadioGroup(ctx, node, indent) {
    ensureComponentImport(ctx, "radio-group");
    const pad = "  ".repeat(indent);
    const items = splitLines(String(node.props.items ?? ""));
    const attrs = buildAttrs(node, {
        omit: new Set([
            "items",
            "disabled"
        ])
    });
    const disabled = node.props.disabled === true ? " disabled" : "";
    const lines = [
        `${pad}<RadioGroup${attrsToString(attrs)}>`
    ];
    items.forEach((it, i)=>{
        const id = `${node.id}-${i}`;
        lines.push(`${pad}  <div class="flex items-center gap-2">`);
        lines.push(`${pad}    <RadioGroupItem value="${escapeAttr(it)}" id="${escapeAttr(id)}"${disabled} />`);
        lines.push(`${pad}    <Label for="${escapeAttr(id)}">${escapeText(it)}</Label>`);
        lines.push(`${pad}  </div>`);
    });
    lines.push(`${pad}</RadioGroup>`);
    return lines.join("\n");
}
function renderSwitch(ctx, node, indent) {
    ensureComponentImport(ctx, "switch");
    const pad = "  ".repeat(indent);
    const attrs = buildAttrs(node, {
        omit: new Set([
            "label"
        ])
    });
    const label = String(node.props.label ?? "");
    const lines = [
        `${pad}<div class="flex items-center gap-2">`,
        `${pad}  <Switch${attrsToString(attrs)} id="${escapeAttr(node.id)}" />`
    ];
    if (label) {
        ensureComponentImport(ctx, "label");
        lines.push(`${pad}  <Label for="${escapeAttr(node.id)}">${escapeText(label)}</Label>`);
    }
    lines.push(`${pad}</div>`);
    return lines.join("\n");
}
function renderSlider(ctx, node, indent) {
    ensureComponentImport(ctx, "slider");
    const pad = "  ".repeat(indent);
    const value = node.props.value;
    const attrs = buildAttrs(node, {
        omit: new Set([
            "value"
        ])
    });
    const valueAttr = typeof value === "number" ? ` value={[${value}]}` : "";
    return `${pad}<Slider${attrsToString(attrs)}${valueAttr} />`;
}
function renderSelect(ctx, node, indent) {
    ensureComponentImport(ctx, "select");
    const pad = "  ".repeat(indent);
    const options = splitLines(String(node.props.options ?? ""));
    const value = String(node.props.value ?? "");
    const placeholder = String(node.props.placeholder ?? "Select…");
    const disabled = node.props.disabled === true;
    const lines = [
        `${pad}<Select${disabled ? " disabled" : ""}${value ? ` value="${escapeAttr(value)}"` : ""}>`
    ];
    lines.push(`${pad}  <SelectTrigger class="w-[180px]">`);
    lines.push(`${pad}    <SelectValue placeholder="${escapeAttr(placeholder)}" />`);
    lines.push(`${pad}  </SelectTrigger>`);
    lines.push(`${pad}  <SelectContent>`);
    options.forEach((o)=>{
        lines.push(`${pad}    <SelectItem value="${escapeAttr(o)}">${escapeText(o)}</SelectItem>`);
    });
    lines.push(`${pad}  </SelectContent>`, `${pad}</Select>`);
    return lines.join("\n");
}
function renderCombobox(ctx, node, indent) {
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
        `${pad}        <CommandGroup>`
    ];
    options.forEach((o)=>{
        lines.push(`${pad}          <CommandItem value="${escapeAttr(o)}">${escapeText(o)}</CommandItem>`);
    });
    lines.push(`${pad}        </CommandGroup>`, `${pad}      </CommandList>`, `${pad}    </Command>`, `${pad}  </PopoverContent>`, `${pad}</Popover>`);
    return lines.join("\n");
}
function renderDatePicker(ctx, node, indent) {
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
        `${pad}</Popover>`
    ].join("\n");
}
function renderInputOTP(ctx, node, indent) {
    ensureComponentImport(ctx, "input-otp");
    const pad = "  ".repeat(indent);
    const len = Math.max(1, Number(node.props.length ?? 6));
    const attrs = buildAttrs(node, {
        omit: new Set([
            "length"
        ])
    });
    const lines = [
        `${pad}<InputOTP maxlength={${len}}${attrsToString(attrs)}>`
    ];
    lines.push(`${pad}  <InputOTPGroup>`);
    for(let i = 0; i < len; i++){
        lines.push(`${pad}    <InputOTPSlot index={${i}} />`);
    }
    lines.push(`${pad}  </InputOTPGroup>`, `${pad}</InputOTP>`);
    return lines.join("\n");
}
function renderToggleGroup(ctx, node, indent) {
    ensureComponentImport(ctx, "toggle-group");
    const pad = "  ".repeat(indent);
    const items = splitLines(String(node.props.items ?? ""));
    const attrs = buildAttrs(node, {
        omit: new Set([
            "items"
        ])
    });
    const lines = [
        `${pad}<ToggleGroup${attrsToString(attrs)}>`
    ];
    items.forEach((it)=>{
        lines.push(`${pad}  <ToggleGroupItem value="${escapeAttr(it)}">${escapeText(it)}</ToggleGroupItem>`);
    });
    lines.push(`${pad}</ToggleGroup>`);
    return lines.join("\n");
}
function renderButton(ctx, node, indent) {
    ensureComponentImport(ctx, "button");
    const pad = "  ".repeat(indent);
    const text = String(node.props.text ?? "");
    const attrs = buildAttrs(node, {
        omit: new Set([
            "text"
        ])
    });
    return `${pad}<Button${attrsToString(attrs)}>${escapeText(text)}</Button>`;
}
/** Composite: ButtonGroup wraps children directly. */ function renderButtonGroup(ctx, node, indent) {
    ensureComponentImport(ctx, "button-group");
    const pad = "  ".repeat(indent);
    const attrs = buildAttrs(node, {
        omit: new Set([])
    });
    const childStr = renderChildren(ctx, node.children, indent + 1);
    if (!childStr) {
        return `${pad}<ButtonGroup${attrsToString(attrs)} />`;
    }
    return `${pad}<ButtonGroup${attrsToString(attrs)}>\n${childStr}\n${pad}</ButtonGroup>`;
}
/** Composite: DropdownMenu with trigger button + DropdownMenuContent wrapping each child as DropdownMenuItem. */ function renderDropdownMenu(ctx, node, indent) {
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
        `${pad}  <DropdownMenuContent>`
    ];
    node.children.forEach((c)=>{
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
function renderLink(ctx, node, indent) {
    const pad = "  ".repeat(indent);
    const href = String(node.props.href ?? "#");
    const text = String(node.props.text ?? "Link");
    const target = String(node.props.target ?? "_self");
    const cls = String(node.props.className ?? "");
    const classAttr = cls ? ` class="${escapeAttr(cls)}"` : "";
    return `${pad}<a href="${escapeAttr(href)}" target="${escapeAttr(target)}"${classAttr}>${escapeText(text)}</a>`;
}
function renderToggle(ctx, node, indent) {
    ensureComponentImport(ctx, "toggle");
    const pad = "  ".repeat(indent);
    const label = String(node.props.label ?? "");
    const attrs = buildAttrs(node, {
        omit: new Set([
            "label"
        ])
    });
    return `${pad}<Toggle${attrsToString(attrs)} aria-label="${escapeAttr(label)}">${escapeText(label)}</Toggle>`;
}
/** Composite: Tabs — each child becomes a TabsTrigger + a TabsContent with the child's children inside. */ function renderTabs(ctx, node, indent) {
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
    const lines = [
        `${pad}<Tabs${valueAttr}${orientationAttr}${loop}${activateAttr}>`
    ];
    lines.push(`${pad}  <TabsList>`);
    children.forEach((c, i)=>{
        const v = `tab${i + 1}`;
        lines.push(`${pad}    <TabsTrigger value="${escapeAttr(v)}">${escapeText(childLabel(c))}</TabsTrigger>`);
    });
    lines.push(`${pad}  </TabsList>`);
    children.forEach((c, i)=>{
        const v = `tab${i + 1}`;
        lines.push(`${pad}  <TabsContent value="${escapeAttr(v)}">`);
        const inner = renderChildren(ctx, c.children, indent + 2);
        if (inner) lines.push(indentBlock(inner, indent + 2));
        lines.push(`${pad}  </TabsContent>`);
    });
    lines.push(`${pad}</Tabs>`);
    return lines.join("\n");
}
function renderBreadcrumb(ctx, node, indent) {
    ensureComponentImport(ctx, "breadcrumb");
    const pad = "  ".repeat(indent);
    const items = splitLines(String(node.props.items ?? ""));
    const separatorStr = String(node.props.separator ?? "");
    // If the separator is a lucide icon name (PascalCase identifier), emit an icon element.
    const isIconSep = /^[A-Z][A-Za-z0-9]*$/.test(separatorStr);
    const lines = [
        `${pad}<Breadcrumb>`,
        `${pad}  <BreadcrumbList>`
    ];
    items.forEach((it, i)=>{
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
function renderPagination(ctx, node, indent) {
    ensureComponentImport(ctx, "pagination");
    const pad = "  ".repeat(indent);
    const page = Number(node.props.page ?? 1);
    const total = Number(node.props.totalPages ?? 10);
    const lines = [
        `${pad}<Pagination>`,
        `${pad}  <PaginationContent>`,
        `${pad}    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>`
    ];
    const start = Math.max(1, page - 1);
    const end = Math.min(total, start + 2);
    for(let i = start; i <= end; i++){
        const active = i === page ? ' class="bg-primary text-primary-foreground"' : "";
        lines.push(`${pad}    <PaginationItem><PaginationLink href="#"${active}>${i}</PaginationLink></PaginationItem>`);
    }
    lines.push(`${pad}    <PaginationItem><PaginationNext href="#" /></PaginationItem>`, `${pad}  </PaginationContent>`, `${pad}</Pagination>`);
    return lines.join("\n");
}
/** Composite: Menubar — each child becomes a MenubarMenu (trigger = child label) with its own children as MenubarItems. */ function renderMenubar(ctx, node, indent) {
    ensureComponentImport(ctx, "menubar");
    const pad = "  ".repeat(indent);
    const lines = [
        `${pad}<Menubar>`
    ];
    node.children.forEach((c)=>{
        const label = childLabel(c);
        lines.push(`${pad}  <MenubarMenu>`);
        lines.push(`${pad}    <MenubarTrigger>${escapeText(label)}</MenubarTrigger>`);
        if (c.children.length > 0) {
            lines.push(`${pad}    <MenubarContent>`);
            c.children.forEach((ci)=>{
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
/** Composite: NavigationMenu — each child becomes a NavigationMenuItem with a trigger + content (child's own children). */ function renderNavigationMenu(ctx, node, indent) {
    ensureComponentImport(ctx, "navigation-menu");
    const pad = "  ".repeat(indent);
    const viewport = node.props.viewport === false ? false : true;
    const viewportAttr = !viewport ? ` viewport={false}` : "";
    const lines = [
        `${pad}<NavigationMenuRoot${viewportAttr}>`,
        `${pad}  <NavigationMenuList>`
    ];
    node.children.forEach((c)=>{
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
/** DataTable — emit a real shadcn/svelte DataTable snippet using TanStack column defs. */ function renderDataTable(ctx, node, indent) {
    ensureComponentImport(ctx, "data-table"); // pulls Table* from the table barrel
    const pad = "  ".repeat(indent);
    const cols = splitLines(String(node.props.columns ?? ""));
    const rows = parseCSV(// build a CSV with header row
    [
        cols.join(",")
    ].concat(splitLines(String(node.props.rows ?? ""))).join("\n"));
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
    const colDefs = cols.map((c)=>{
        return `  { accessorKey: ${JSON.stringify(c)}, header: ${JSON.stringify(c)} }`;
    });
    const colsLiteral = `[\n${colDefs.join(",\n")}\n]`;
    ctx.constDecls.push(`const ${colsVar} = ${colsLiteral};`);
    // Feature flags as a comment block above the DataTable usage.
    const features = [];
    if (sortable) features.push("sortable");
    if (filterable) features.push("filterable");
    if (paginated) features.push(`paginated (pageSize=${pageSize})`);
    if (selectable) features.push("rowSelection");
    const featComment = features.length ? `${pad}<!-- DataTable features: ${features.join(", ")} — install via 'npx shadcn-svelte add data-table' -->\n` : `${pad}<!-- DataTable — install via 'npx shadcn-svelte add data-table' -->\n`;
    // Emit a `<DataTable {data} {columns} />` usage. We also render an inline
    // fallback Table markup so the output is visually meaningful even before
    // the user installs the DataTable component.
    const headerCells = cols.map((c)=>`${pad}        <TableHead>${escapeText(c)}</TableHead>`).join("\n");
    const bodyRows = rows.map((r)=>{
        const cells = cols.map((c)=>{
            const v = r[c];
            return `${pad}        <TableCell>${v == null ? "" : escapeText(String(v))}</TableCell>`;
        }).join("\n");
        return `${pad}      <TableRow>\n${cells}\n${pad}      </TableRow>`;
    }).join("\n");
    return featComment + [
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
        `${pad}</div>`
    ].join("\n");
}
/** Composite: Table — columns/rows textareas + optional child rows. */ function renderTable(ctx, node, indent) {
    ensureComponentImport(ctx, "table");
    const pad = "  ".repeat(indent);
    const cols = splitLines(String(node.props.columns ?? ""));
    const rowLines = splitLines(String(node.props.rows ?? ""));
    const rows = rowLines.map((r)=>r.split(",").map((c)=>c.trim()));
    const caption = String(node.props.caption ?? "");
    const lines = [
        `${pad}<Table>`
    ];
    if (caption) lines.push(`${pad}  <TableCaption>${escapeText(caption)}</TableCaption>`);
    lines.push(`${pad}  <TableHeader>`, `${pad}    <TableRow>`);
    cols.forEach((c)=>lines.push(`${pad}      <TableHead>${escapeText(c)}</TableHead>`));
    lines.push(`${pad}    </TableRow>`, `${pad}  </TableHeader>`, `${pad}  <TableBody>`);
    rows.forEach((r)=>{
        lines.push(`${pad}    <TableRow>`);
        cols.forEach((_, i)=>lines.push(`${pad}      <TableCell>${escapeText(r[i] ?? "")}</TableCell>`));
        lines.push(`${pad}    </TableRow>`);
    });
    // Optional child rows: each child rendered as a TableRow; child's text or
    // its children become the cell content.
    node.children.forEach((c)=>{
        lines.push(`${pad}    <TableRow>`);
        if (c.children.length > 0) {
            // spread each grandchild into its own cell
            c.children.forEach((gc)=>{
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
/** Composite: Accordion — each child becomes an AccordionItem with trigger (label) + content (child's children). */ function renderAccordion(ctx, node, indent) {
    ensureComponentImport(ctx, "accordion");
    const pad = "  ".repeat(indent);
    const type = String(node.props.type ?? "single");
    const orientation = String(node.props.orientation ?? "vertical");
    const disabled = node.props.disabled === true ? " disabled" : "";
    const loop = node.props.loop === false ? " loop={false}" : "";
    const orientationAttr = orientation !== "vertical" ? ` orientation="${escapeAttr(orientation)}"` : "";
    const defaultValue = String(node.props.defaultValue ?? "");
    const defaultAttr = defaultValue ? ` value="${escapeAttr(defaultValue)}"` : "";
    const lines = [
        `${pad}<Accordion type="${escapeAttr(type)}"${orientationAttr}${disabled}${loop}${defaultAttr} class="w-full">`
    ];
    node.children.forEach((c, i)=>{
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
function renderBadge(ctx, node, indent) {
    ensureComponentImport(ctx, "badge");
    const pad = "  ".repeat(indent);
    const text = String(node.props.text ?? "");
    const attrs = buildAttrs(node, {
        omit: new Set([
            "text"
        ])
    });
    return `${pad}<Badge${attrsToString(attrs)}>${escapeText(text)}</Badge>`;
}
/** Composite: Collapsible — trigger button (triggerText) + CollapsibleContent with children. */ function renderCollapsible(ctx, node, indent) {
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
        `${pad}  <CollapsibleContent>`
    ];
    if (childStr) lines.push(childStr);
    lines.push(`${pad}  </CollapsibleContent>`, `${pad}</Collapsible>`);
    return lines.join("\n");
}
/** Composite: Tooltip — wraps children as the trigger; text prop is content. */ function renderTooltip(ctx, node, indent) {
    ensureComponentImport(ctx, "tooltip");
    const pad = "  ".repeat(indent);
    const text = String(node.props.text ?? "");
    const side = String(node.props.side ?? "top");
    const align = String(node.props.align ?? "center");
    const delay = Number(node.props.delayDuration ?? 700);
    const skipDelay = Number(node.props.skipDelayDuration ?? 300);
    const disableHover = node.props.disableHoverableContent === true;
    const contentAttrs = [
        `side="${escapeAttr(side)}"`,
        `align="${escapeAttr(align)}"`
    ];
    if (delay !== 700) contentAttrs.push(`delayDuration={${delay}}`);
    if (skipDelay !== 300) contentAttrs.push(`skipDelayDuration={${skipDelay}}`);
    if (disableHover) contentAttrs.push("disableHoverableContent");
    const childStr = renderChildren(ctx, node.children, indent + 2);
    const lines = [
        `${pad}<Tooltip>`,
        `${pad}  <TooltipTrigger asChild>`
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
function renderAvatar(ctx, node, indent) {
    ensureComponentImport(ctx, "avatar");
    const pad = "  ".repeat(indent);
    const src = String(node.props.src ?? "");
    const fallback = String(node.props.fallback ?? "CN");
    const alt = String(node.props.alt ?? "");
    const lines = [
        `${pad}<Avatar>`
    ];
    if (src) lines.push(`${pad}  <AvatarImage src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />`);
    lines.push(`${pad}  <AvatarFallback>${escapeText(fallback)}</AvatarFallback>`, `${pad}</Avatar>`);
    return lines.join("\n");
}
function renderProgress(ctx, node, indent) {
    ensureComponentImport(ctx, "progress");
    const pad = "  ".repeat(indent);
    const value = Number(node.props.value ?? 0);
    const max = Number(node.props.max ?? 100);
    if (max !== 100) return `${pad}<Progress value={${value}} max={${max}} />`;
    return `${pad}<Progress value={${value}} />`;
}
function renderSkeletonNode(ctx, node, indent) {
    ensureComponentImport(ctx, "skeleton");
    const pad = "  ".repeat(indent);
    const width = String(node.props.width ?? "100%");
    const height = String(node.props.height ?? "20px");
    const extra = String(node.props.className ?? "");
    const style = `style="width: ${escapeAttr(width)}; height: ${escapeAttr(height)}"`;
    const classAttr = extra ? ` class="${escapeAttr(extra)}"` : "";
    return `${pad}<Skeleton${classAttr} ${style} />`;
}
function renderAlert(ctx, node, indent) {
    ensureComponentImport(ctx, "alert");
    const pad = "  ".repeat(indent);
    const title = String(node.props.title ?? "");
    const desc = String(node.props.description ?? "");
    const attrs = buildAttrs(node, {
        omit: new Set([
            "title",
            "description"
        ])
    });
    return [
        `${pad}<Alert${attrsToString(attrs)}>`,
        `${pad}  <AlertTitle>${escapeText(title)}</AlertTitle>`,
        `${pad}  <AlertDescription>${escapeText(desc)}</AlertDescription>`,
        `${pad}</Alert>`
    ].join("\n");
}
/** Composite: Dialog — trigger button + DialogContent with header + body (children) + optional footer. */ function renderDialog(ctx, node, indent) {
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
        `${pad}    </DialogHeader>`
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
/** Composite: AlertDialog — trigger button + content with header + body (children) + footer with cancel/action. */ function renderAlertDialog(ctx, node, indent) {
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
        `${pad}    </AlertDialogHeader>`
    ];
    if (childStr) lines.push(childStr);
    lines.push(`${pad}    <AlertDialogFooter>`, `${pad}      <AlertDialogCancel>${escapeText(cancelText)}</AlertDialogCancel>`, `${pad}      <AlertDialogAction>${escapeText(actionText)}</AlertDialogAction>`, `${pad}    </AlertDialogFooter>`, `${pad}  </AlertDialogContent>`, `${pad}</AlertDialog>`);
    return lines.join("\n");
}
/** Composite: Sheet — trigger + SheetContent (with header + children). */ function renderSheet(ctx, node, indent) {
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
        `${pad}      <SheetTitle>${escapeText(title)}</SheetTitle>`
    ];
    if (desc) lines.push(`${pad}      <SheetDescription>${escapeText(desc)}</SheetDescription>`);
    lines.push(`${pad}    </SheetHeader>`);
    if (childStr) lines.push(childStr);
    lines.push(`${pad}  </SheetContent>`, `${pad}</Sheet>`);
    return lines.join("\n");
}
/** Composite: Popover — trigger + PopoverContent with children. */ function renderPopover(ctx, node, indent) {
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
        `${pad}  <PopoverContent${alignAttr}${sideOffsetAttr}>`
    ];
    if (childStr) lines.push(childStr);
    lines.push(`${pad}  </PopoverContent>`, `${pad}</Popover>`);
    return lines.join("\n");
}
/** Composite: Drawer — trigger + DrawerContent (with header + children). */ function renderDrawer(ctx, node, indent) {
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
        `${pad}      <DrawerTitle>${escapeText(title)}</DrawerTitle>`
    ];
    if (desc) lines.push(`${pad}      <DrawerDescription>${escapeText(desc)}</DrawerDescription>`);
    lines.push(`${pad}    </DrawerHeader>`);
    if (childStr) lines.push(childStr);
    lines.push(`${pad}  </DrawerContent>`, `${pad}</Drawer>`);
    return lines.join("\n");
}
/** Sonner — singleton Toaster. Emit only non-default attrs. */ function renderSonner(ctx, node, indent) {
    ensureComponentImport(ctx, "sonner");
    const pad = "  ".repeat(indent);
    const attrs = [];
    const rc = node.props.richColors === true;
    const cb = node.props.closeButton === true;
    const pos = String(node.props.position ?? "bottom-right");
    const expand = node.props.expand === true;
    const dur = Number(node.props.duration ?? 4000);
    const vis = Number(node.props.visibleToasts ?? 3);
    if (rc) attrs.push({
        name: "richColors",
        value: true
    });
    if (cb) attrs.push({
        name: "closeButton",
        value: true
    });
    if (pos !== "bottom-right") attrs.push({
        name: "position",
        value: pos
    });
    if (expand) attrs.push({
        name: "expand",
        value: true
    });
    if (dur !== 4000) attrs.push({
        name: "duration",
        value: dur
    });
    if (vis !== 3) attrs.push({
        name: "visibleToasts",
        value: vis
    });
    return `${pad}<Toaster${attrsToString(attrs)} />`;
}
function renderChart(ctx, node, indent, tag) {
    ensureComponentImport(ctx, node.component);
    const pad = "  ".repeat(indent);
    const dataStr = String(node.props.data ?? "");
    const color = String(node.props.color ?? "#0f62fe");
    const rows = parseCSV(dataStr);
    ctx.chartCounter += 1;
    const varName = `chartData${ctx.chartCounter}`;
    ctx.chartVars.push({
        name: varName,
        literal: dataToJSLiteral(rows)
    });
    return [
        `${pad}<div class="flex flex-col gap-2">`,
        `${pad}  <${tag} data={${varName}} stroke="${escapeAttr(color)}" />`,
        `${pad}</div>`
    ].join("\n");
}
function renderIcon(ctx, node, indent) {
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
function renderHtmlContainer(ctx, node, indent) {
    // isHtmlElement containers — no import needed
    const pad = "  ".repeat(indent);
    const cls = String(node.props.className ?? "");
    const classAttr = cls ? ` class="${escapeAttr(cls)}"` : "";
    const childStr = renderChildren(ctx, node.children, indent + 1);
    if (!childStr) return `${pad}<div${classAttr} />`;
    return `${pad}<div${classAttr}>\n${childStr}\n${pad}</div>`;
}
/** Composite: Card — header (title/description) + CardContent (children) + optional CardFooter. */ function renderCard(ctx, node, indent) {
    ensureComponentImport(ctx, "card");
    const pad = "  ".repeat(indent);
    const title = String(node.props.title ?? "");
    const desc = String(node.props.description ?? "");
    const cls = String(node.props.className ?? "");
    const showFooter = node.props.showFooter === true;
    const footerText = String(node.props.footerText ?? "");
    const classAttr = cls ? ` class="${escapeAttr(cls)}"` : "";
    const childStr = renderChildren(ctx, node.children, indent + 2);
    const lines = [
        `${pad}<Card${classAttr}>`,
        `${pad}  <CardHeader>`
    ];
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
function renderSeparator(ctx, node, indent) {
    ensureComponentImport(ctx, "separator");
    const pad = "  ".repeat(indent);
    const orientation = String(node.props.orientation ?? "horizontal");
    const decorative = node.props.decorative === true;
    const attrs = [
        {
            name: "orientation",
            value: orientation
        }
    ];
    if (decorative) attrs.push({
        name: "decorative",
        value: true
    });
    return `${pad}<Separator${attrsToString(attrs)} />`;
}
function renderScrollArea(ctx, node, indent) {
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
function renderAspectRatio(ctx, node, indent) {
    ensureComponentImport(ctx, "aspect-ratio");
    const pad = "  ".repeat(indent);
    const ratio = Number(node.props.ratio ?? 1.7778);
    const childStr = renderChildren(ctx, node.children, indent + 1);
    if (!childStr) return `${pad}<AspectRatio ratio={${ratio}} />`;
    return `${pad}<AspectRatio ratio={${ratio}}>\n${childStr}\n${pad}</AspectRatio>`;
}
function renderCalendar(ctx, node, indent) {
    ensureComponentImport(ctx, "calendar");
    const pad = "  ".repeat(indent);
    const numberOfMonths = Number(node.props.numberOfMonths ?? 1);
    const value = String(node.props.value ?? "");
    const attrs = [];
    if (value) attrs.push(`value="${escapeAttr(value)}"`);
    if (numberOfMonths !== 1) attrs.push(`numberOfMonths={${numberOfMonths}}`);
    const attrStr = attrs.length ? " " + attrs.join(" ") : "";
    return `${pad}<Calendar${attrStr} />`;
}
function renderRangeCalendar(ctx, node, indent) {
    ensureComponentImport(ctx, "range-calendar");
    const pad = "  ".repeat(indent);
    const numberOfMonths = Number(node.props.numberOfMonths ?? 1);
    const attrs = [];
    if (numberOfMonths !== 1) attrs.push(`numberOfMonths={${numberOfMonths}}`);
    const attrStr = attrs.length ? " " + attrs.join(" ") : "";
    return `${pad}<RangeCalendar${attrStr} />`;
}
function renderNativeSelect(ctx, node, indent) {
    ensureComponentImport(ctx, "native-select");
    const pad = "  ".repeat(indent);
    const options = splitLines(String(node.props.options ?? ""));
    const disabled = node.props.disabled === true;
    const lines = [
        `${pad}<NativeSelect${disabled ? " disabled" : ""}>`
    ];
    options.forEach((o)=>{
        lines.push(`${pad}  <NativeSelectOption value="${escapeAttr(o)}">${escapeText(o)}</NativeSelectOption>`);
    });
    lines.push(`${pad}</NativeSelect>`);
    return lines.join("\n");
}
/** Composite: InputGroup — leftAddon + child input + rightAddon. */ function renderInputGroup(ctx, node, indent) {
    ensureComponentImport(ctx, "input-group");
    ensureComponentImport(ctx, "input");
    const pad = "  ".repeat(indent);
    const leftAddon = String(node.props.leftAddon ?? "");
    const rightAddon = String(node.props.rightAddon ?? "");
    const lines = [
        `${pad}<InputGroup>`
    ];
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
        const inputAttrs = [
            `type="${escapeAttr(type)}"`,
            `placeholder="${escapeAttr(placeholder)}"`
        ];
        if (value) inputAttrs.push(`value="${escapeAttr(value)}"`);
        lines.push(`${pad}  <InputGroupInput ${inputAttrs.join(" ")} />`);
    }
    if (rightAddon) {
        lines.push(`${pad}  <InputGroupText>${escapeText(rightAddon)}</InputGroupText>`);
    }
    lines.push(`${pad}</InputGroup>`);
    return lines.join("\n");
}
/** Composite: Command — CommandInput + CommandList + CommandGroup with each child as a CommandItem. */ function renderCommand(ctx, node, indent) {
    ensureComponentImport(ctx, "command");
    const pad = "  ".repeat(indent);
    const placeholder = String(node.props.placeholder ?? "Search…");
    const lines = [
        `${pad}<Command>`,
        `${pad}  <CommandInput placeholder="${escapeAttr(placeholder)}" />`,
        `${pad}  <CommandList>`,
        `${pad}    <CommandEmpty>No result.</CommandEmpty>`,
        `${pad}    <CommandGroup>`
    ];
    node.children.forEach((c)=>{
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
/** Composite: Field — FieldLabel + children (input) + FieldDescription + FieldError. */ function renderField(ctx, node, indent) {
    ensureComponentImport(ctx, "field");
    const pad = "  ".repeat(indent);
    const label = String(node.props.label ?? "Label");
    const description = String(node.props.description ?? "");
    const error = String(node.props.error ?? "");
    const orientation = String(node.props.orientation ?? "vertical");
    const orientAttr = orientation !== "vertical" ? ` orientation="${escapeAttr(orientation)}"` : "";
    const childStr = renderChildren(ctx, node.children, indent + 1);
    const lines = [
        `${pad}<Field${orientAttr}>`,
        `${pad}  <FieldLabel>${escapeText(label)}</FieldLabel>`
    ];
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
/** Composite: Carousel — CarouselContent with each child as CarouselItem + prev/next. */ function renderCarousel(ctx, node, indent) {
    ensureComponentImport(ctx, "carousel");
    const pad = "  ".repeat(indent);
    const loop = node.props["opts-loop"] === true;
    const align = String(node.props["opts-align"] ?? "start");
    const orientation = String(node.props.orientation ?? "horizontal");
    const orientAttr = orientation !== "horizontal" ? ` orientation="${escapeAttr(orientation)}"` : "";
    const lines = [
        `${pad}<Carousel opts={{ loop: ${loop}, align: "${escapeAttr(align)}" }}${orientAttr}>`,
        `${pad}  <CarouselContent>`
    ];
    node.children.forEach((c)=>{
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
/** Composite: ContextMenu — trigger area + ContextMenuContent with each child as ContextMenuItem. */ function renderContextMenu(ctx, node, indent) {
    ensureComponentImport(ctx, "context-menu");
    const pad = "  ".repeat(indent);
    const triggerText = String(node.props.triggerText ?? "Right-click");
    const modal = node.props.modal === false ? " modal={false}" : "";
    const lines = [
        `${pad}<ContextMenu${modal}>`,
        `${pad}  <ContextMenuTrigger class="flex h-24 w-full items-center justify-center rounded-md border border-dashed text-sm">`,
        `${pad}    ${escapeText(triggerText)}`,
        `${pad}  </ContextMenuTrigger>`,
        `${pad}  <ContextMenuContent>`
    ];
    node.children.forEach((c)=>{
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
/** Composite: HoverCard — trigger + HoverCardContent with text prop OR children. */ function renderHoverCard(ctx, node, indent) {
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
        `${pad}  <HoverCardContent${alignAttr}${sideOffsetAttr}${openDelayAttr}${closeDelayAttr}>`
    ];
    if (childStr) lines.push(childStr);
    else lines.push(`${pad}    ${escapeText(text)}`);
    lines.push(`${pad}  </HoverCardContent>`, `${pad}</HoverCard>`);
    return lines.join("\n");
}
/** Composite: Empty — EmptyMedia (icon) + EmptyHeader (title/description) + children. */ function renderEmpty(ctx, node, indent) {
    ensureComponentImport(ctx, "empty");
    const pad = "  ".repeat(indent);
    const title = String(node.props.title ?? "No results");
    const desc = String(node.props.description ?? "Try adjusting your search.");
    const iconName = String(node.props.icon ?? "");
    const childStr = renderChildren(ctx, node.children, indent + 1);
    const lines = [
        `${pad}<Empty>`
    ];
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
function renderItem(ctx, node, indent) {
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
function renderKbd(ctx, node, indent) {
    ensureComponentImport(ctx, "kbd");
    const pad = "  ".repeat(indent);
    const text = String(node.props.text ?? "⌘K");
    const size = String(node.props.size ?? "default");
    const cls = size === "sm" ? ` class="text-xs"` : size === "lg" ? ` class="text-base"` : "";
    return `${pad}<Kbd${cls}>${escapeText(text)}</Kbd>`;
}
function renderSpinner(ctx, node, indent) {
    ensureComponentImport(ctx, "spinner");
    const pad = "  ".repeat(indent);
    const size = String(node.props.size ?? "default");
    const cls = size === "sm" ? ' class="size-3"' : size === "lg" ? ' class="size-6"' : "";
    return `${pad}<Spinner${cls} />`;
}
/** Composite: Sidebar — SidebarProvider + Sidebar + SidebarContent + SidebarGroup + SidebarMenu (with each child as SidebarMenuItem). */ function renderSidebar(ctx, node, indent) {
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
        `${pad}        <SidebarMenu>`
    ];
    if (node.children.length > 0) {
        node.children.forEach((c)=>{
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
    lines.push(`${pad}        </SidebarMenu>`, `${pad}      </SidebarGroup>`, `${pad}    </SidebarContent>`, `${pad}  </Sidebar>`, `${pad}</SidebarProvider>`);
    return lines.join("\n");
}
/** Composite: Resizable — ResizablePaneGroup with children as Panes + Handles between. */ function renderResizable(ctx, node, indent) {
    ensureComponentImport(ctx, "resizable");
    const pad = "  ".repeat(indent);
    const direction = String(node.props.direction ?? "horizontal");
    const withHandle = node.props.withHandle !== false;
    const lines = [
        `${pad}<ResizablePaneGroup direction="${escapeAttr(direction)}">`
    ];
    node.children.forEach((c, i)=>{
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
/** shadcn typography classes (mirrors `docs/src/lib/registry/ui/typography`). */ const TYPOGRAPHY_CLASSES = {
    h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
    h2: "scroll-m-20 text-3xl font-semibold tracking-tight",
    h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
    h4: "scroll-m-20 text-xl font-semibold tracking-tight",
    p: "leading-7 [&:not(:first-child)]:mt-6",
    lead: "text-xl text-muted-foreground",
    large: "text-lg font-semibold",
    small: "text-sm font-medium leading-none",
    muted: "text-sm text-muted-foreground",
    blockquote: "mt-6 border-l-2 pl-6 italic"
};
function renderTypography(ctx, node, indent) {
    void ctx; // no imports needed
    const pad = "  ".repeat(indent);
    const variant = String(node.props.variant ?? "p");
    const text = String(node.props.text ?? "");
    const cls = TYPOGRAPHY_CLASSES[variant] ?? TYPOGRAPHY_CLASSES.p;
    const tag = variant === "blockquote" || [
        "h1",
        "h2",
        "h3",
        "h4",
        "p"
    ].includes(variant) ? variant : "p";
    return `${pad}<${tag} class="${escapeAttr(cls)}">${escapeText(text)}</${tag}>`;
}
/** Whether a child node is a "simple text-bearing" one — its label is the only meaningful content. */ function isSimpleTextChild(node) {
    return node.children.length === 0 && [
        "item",
        "label",
        "typography",
        "button",
        "badge",
        "link",
        "kbd"
    ].includes(node.component);
}
function generateSvelte(doc) {
    const ctx = newCtx();
    const body = renderNode(ctx, doc.tree, 0);
    // Skeleton import if any node used skeleton variant OR there is an explicit Skeleton node.
    if (ctx.hasSkeleton || hasExplicitSkeleton(doc.tree)) {
        ensureImport(ctx, 'import { Skeleton } from "$lib/components/ui/skeleton/index.js";');
    }
    // Build script block — one merged import per module, alphabetical by module path,
    // names sorted for determinism. Icon default-imports follow (one per icon).
    const importLines = [];
    const sortedModules = Array.from(ctx.imports.keys()).sort();
    for (const mod of sortedModules){
        const names = Array.from(ctx.imports.get(mod)).sort();
        importLines.push(`import { ${names.join(", ")} } from "${mod}";`);
    }
    // Icon imports — default imports from @lucide/svelte/icons/<kebab>
    const sortedIcons = Array.from(ctx.usedIcons.entries()).sort(([a], [b])=>a.localeCompare(b));
    for (const [, pascal] of sortedIcons){
        const kebab = toKebab(pascal);
        importLines.push(`import ${pascal} from "@lucide/svelte/icons/${kebab}";`);
    }
    const scriptParts = [];
    if (importLines.length > 0) {
        scriptParts.push(importLines.join("\n"));
    }
    // DataTable const declarations
    ctx.constDecls.forEach((d)=>scriptParts.push(d));
    ctx.chartVars.forEach((cv)=>{
        scriptParts.push(`const ${cv.name} = ${cv.literal};`);
    });
    const scriptBlock = scriptParts.length > 0 ? `<script lang="ts">\n${scriptParts.join("\n")}\n</script>\n\n` : "";
    const header = `<!-- Generated by FRAME — SvelteKit + shadcn/svelte -->\n`;
    return `${header}${scriptBlock}${body}\n`;
}
/** Walk tree checking for explicit `skeleton` component usage. */ function hasExplicitSkeleton(node) {
    if (node.component === "skeleton") return true;
    return node.children.some(hasExplicitSkeleton);
}
function generateJSON(doc) {
    return JSON.stringify(doc, null, 2);
}
function parseJSON(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
    }
    return validateDocument(parsed);
}
function validateDocument(d) {
    if (typeof d !== "object" || d === null) {
        throw new Error("Document must be an object");
    }
    const doc = d;
    if (typeof doc.id !== "string") throw new Error("Document.id must be a string");
    if (typeof doc.name !== "string") throw new Error("Document.name must be a string");
    if (typeof doc.theme !== "string" || ![
        "light",
        "dark"
    ].includes(doc.theme)) {
        throw new Error('Document.theme must be "light" or "dark"');
    }
    if (typeof doc.accent !== "string" || ![
        "zinc",
        "rose",
        "green",
        "orange"
    ].includes(doc.accent)) {
        throw new Error("Document.accent must be one of zinc|rose|green|orange");
    }
    if (typeof doc.updatedAt !== "number") throw new Error("Document.updatedAt must be a number");
    if (typeof doc.tree !== "object" || doc.tree === null) throw new Error("Document.tree must be an object");
    return {
        id: doc.id,
        name: doc.name,
        tree: validateNode(doc.tree),
        theme: doc.theme,
        accent: doc.accent,
        updatedAt: doc.updatedAt
    };
}
function validateNode(n) {
    if (typeof n !== "object" || n === null) throw new Error("Node must be an object");
    const node = n;
    if (typeof node.id !== "string") throw new Error("Node.id must be a string");
    if (typeof node.component !== "string") throw new Error("Node.component must be a string");
    if (typeof node.variant !== "string" || ![
        "normal",
        "skeleton"
    ].includes(node.variant)) {
        throw new Error('Node.variant must be "normal" or "skeleton"');
    }
    if (typeof node.props !== "object" || node.props === null) throw new Error("Node.props must be an object");
    if (!Array.isArray(node.children)) throw new Error("Node.children must be an array");
    return {
        id: node.id,
        component: node.component,
        variant: node.variant,
        props: node.props,
        children: node.children.map(validateNode)
    };
}
}),
"[project]/src/lib/frame/defaults.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createRootNode",
    ()=>createRootNode,
    "createStarterTree",
    ()=>createStarterTree,
    "newDocument",
    ()=>newDocument
]);
/**
 * FRAME — node/document factory helpers.
 *
 * Used by the store (hydrate, newDocument) and indirectly by codegen/store
 * tests. Keep these pure: no localStorage, no zustand.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/nanoid/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/frame/registry.ts [app-ssr] (ecmascript)");
;
;
function createRootNode() {
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10),
        component: "root",
        variant: "normal",
        props: {
            className: "flex flex-col gap-6 p-6"
        },
        children: []
    };
}
function createStarterTree() {
    const root = createRootNode();
    const card = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("card");
    card.props.title = "Welcome to FRAME";
    card.props.description = "Drag components from the left to build your UI.";
    // Replace the pre-seeded default CardContent child with a richer composition.
    card.children = [];
    const cardInner = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("flex-col");
    cardInner.props.className = "flex flex-col gap-3";
    cardInner.children.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("button"));
    const inputNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("input");
    inputNode.props.placeholder = "you@example.com";
    inputNode.props.label = "Email";
    inputNode.props.type = "email";
    cardInner.children.push(inputNode);
    card.children.push(cardInner);
    const row = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("flex-row");
    const b1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("badge");
    b1.props.text = "Beta";
    b1.props.variant = "secondary";
    const b2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("badge");
    b2.props.text = "v0.1";
    row.children.push(b1, b2);
    root.children.push(card, row);
    return root;
}
function newDocument(name) {
    const now = Date.now();
    return {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10),
        name: name?.trim() || `Untitled ${new Date(now).toLocaleString()}`,
        tree: createStarterTree(),
        theme: "light",
        accent: "zinc",
        updatedAt: now
    };
}
}),
"[project]/src/lib/frame/store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useActiveDocument",
    ()=>useActiveDocument,
    "useFrameStore",
    ()=>useFrameStore,
    "useTree",
    ()=>useTree
]);
/**
 * FRAME — Zustand store.
 *
 * One store, one source of truth. All tree mutations:
 *   1. deep-clone the active document (via `structuredClone`) so React sees fresh refs
 *   2. mutate the clone in place (helper tree functions)
 *   3. snapshot the *previous* active doc onto `past` (cap 50), clear `future`
 *
 * Persistence: localStorage key `"frame:documents"` holds `{ documents, activeDocumentId, version }`.
 * `hydrate()` loads it (or seeds a default doc) and installs a debounced autosave
 * subscription (~1.2s).
 *
 * Tree root: every document's `tree` is a `FrameNode` with `component: "root"`
 * (NOT in the registry). The root's `children` are the top-level page nodes.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/nanoid/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$codegen$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/frame/codegen.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/frame/defaults.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/frame/registry.ts [app-ssr] (ecmascript)");
;
;
;
;
;
// ---------------------------------------------------------------------------
// Constants & module-level singletons
// ---------------------------------------------------------------------------
const STORAGE_KEY = "frame:documents";
const HISTORY_LIMIT = 50;
const AUTOSAVE_DEBOUNCE_MS = 1200;
let saveTimer = null;
let hydrated = false;
let autosaveInstalled = false;
/** Stable fallback root used before hydration completes (avoids getServerSnapshot loop). */ const FALLBACK_ROOT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createRootNode"])();
// ---------------------------------------------------------------------------
// Tree helpers (operate on a single root, may mutate in place)
// ---------------------------------------------------------------------------
function findNodeInTree(root, id) {
    if (root.id === id) return root;
    for (const c of root.children){
        const f = findNodeInTree(c, id);
        if (f) return f;
    }
    return null;
}
function findParentInTree(root, id) {
    for (const c of root.children){
        if (c.id === id) return root;
        const f = findParentInTree(c, id);
        if (f) return f;
    }
    return null;
}
/** Remove the first node matching `id` from the tree (depth-first). Returns the removed node or null. Mutates. */ function removeNodeFromTree(root, id) {
    const idx = root.children.findIndex((c)=>c.id === id);
    if (idx >= 0) {
        return root.children.splice(idx, 1)[0];
    }
    for (const c of root.children){
        const r = removeNodeFromTree(c, id);
        if (r) return r;
    }
    return null;
}
/** Deep-clone with fresh ids for every node (used by duplicate / paste). */ function cloneWithNewIds(node) {
    // structuredClone is available in modern runtimes (Node 17+, all evergreen browsers)
    const copy = structuredClone(node);
    reassignIds(copy);
    return copy;
}
function reassignIds(node) {
    node.id = nanoid10();
    node.children.forEach(reassignIds);
}
function nanoid10() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nanoid$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nanoid"])(10);
}
/** Map a component key to its "primary text" prop key (first content-group prop, preferring text/title/value/label). */ function getPrimaryTextKey(componentKey) {
    const schema = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["COMPONENTS"][componentKey];
    if (!schema) return null;
    const contentProps = schema.props.filter((p)=>p.group === "content");
    if (contentProps.length === 0) return null;
    const preferred = contentProps.find((p)=>[
            "text",
            "title",
            "value",
            "label",
            "triggerText",
            "name",
            "placeholder"
        ].includes(p.key));
    return (preferred ?? contentProps[0]).key;
}
// ---------------------------------------------------------------------------
// Internal mutation helper
// ---------------------------------------------------------------------------
/**
 * Apply a mutation to the active document.
 * - deep-clones the active doc
 * - passes the clone to `mutator` which may mutate it in place and returns it
 * - pushes the previous snapshot to `past` (unless `history: false`)
 * - clears `future` (unless `history: false`)
 */ function mutateActiveDoc(set, get, mutator, opts = {}) {
    const useHistory = opts.history !== false;
    const state = get();
    const active = state.getActiveDocument();
    if (!active) return;
    const snapshot = useHistory ? structuredClone(active) : null;
    const next = mutator(structuredClone(active));
    next.updatedAt = Date.now();
    const past = snapshot ? [
        ...state.past,
        snapshot
    ].slice(-HISTORY_LIMIT) : state.past;
    set({
        documents: state.documents.map((d)=>d.id === next.id ? next : d),
        past,
        future: useHistory ? [] : state.future
    });
}
const useFrameStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        documents: [],
        activeDocumentId: null,
        selectedIds: [],
        clipboard: [],
        past: [],
        future: [],
        lastSavedAt: null,
        saveStatus: "idle",
        // ── derived getters ────────────────────────────────────────────────────
        getActiveDocument: ()=>{
            const { documents, activeDocumentId } = get();
            return documents.find((d)=>d.id === activeDocumentId);
        },
        getTree: ()=>{
            const doc = get().getActiveDocument();
            return doc?.tree ?? FALLBACK_ROOT;
        },
        findNode: (id)=>{
            const tree = get().getTree();
            return findNodeInTree(tree, id);
        },
        findParent: (id)=>{
            const tree = get().getTree();
            return findParentInTree(tree, id);
        },
        // ── document ops ───────────────────────────────────────────────────────
        newDocument: (name)=>{
            const doc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["newDocument"])(name);
            set((s)=>({
                    documents: [
                        ...s.documents,
                        doc
                    ],
                    activeDocumentId: doc.id,
                    selectedIds: [],
                    past: [],
                    future: []
                }));
            return doc.id;
        },
        switchDocument: (id)=>{
            const exists = get().documents.some((d)=>d.id === id);
            if (!exists) return;
            set({
                activeDocumentId: id,
                selectedIds: [],
                past: [],
                future: []
            });
        },
        deleteDocument: (id)=>{
            set((s)=>{
                const docs = s.documents.filter((d)=>d.id !== id);
                let activeId = s.activeDocumentId;
                if (activeId === id) {
                    activeId = docs[0]?.id ?? null;
                }
                // If we deleted the last doc, create a fresh one.
                if (docs.length === 0) {
                    const fresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["newDocument"])();
                    return {
                        documents: [
                            fresh
                        ],
                        activeDocumentId: fresh.id,
                        selectedIds: [],
                        past: [],
                        future: []
                    };
                }
                return {
                    documents: docs,
                    activeDocumentId: activeId,
                    selectedIds: [],
                    past: [],
                    future: []
                };
            });
        },
        renameDocument: (id, name)=>{
            set((s)=>({
                    documents: s.documents.map((d)=>d.id === id ? {
                            ...d,
                            name,
                            updatedAt: Date.now()
                        } : d)
                }));
        },
        // ── tree ops ───────────────────────────────────────────────────────────
        insertNode: (parentId, key, index)=>{
            const newNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])(key);
            const newId = newNode.id;
            mutateActiveDoc(set, get, (doc)=>{
                const parent = parentId === null ? doc.tree : findNodeInTree(doc.tree, parentId);
                if (!parent) return doc;
                if (index === undefined || index < 0 || index > parent.children.length) {
                    parent.children.push(newNode);
                } else {
                    parent.children.splice(index, 0, newNode);
                }
                return doc;
            });
            return newId;
        },
        insertNodeAtRoot: (key)=>{
            return get().insertNode(null, key);
        },
        removeNodes: (ids)=>{
            if (ids.length === 0) return;
            mutateActiveDoc(set, get, (doc)=>{
                for (const id of ids){
                    removeNodeFromTree(doc.tree, id);
                }
                return doc;
            });
            set((s)=>({
                    selectedIds: s.selectedIds.filter((sid)=>!ids.includes(sid))
                }));
        },
        duplicateNodes: (ids)=>{
            if (ids.length === 0) return [];
            const newIds = [];
            mutateActiveDoc(set, get, (doc)=>{
                for (const id of ids){
                    const parent = findParentInTree(doc.tree, id) ?? doc.tree;
                    const original = parent.children.find((c)=>c.id === id);
                    if (!original) continue;
                    const idx = parent.children.findIndex((c)=>c.id === id);
                    const copy = cloneWithNewIds(original);
                    newIds.push(copy.id);
                    parent.children.splice(idx + 1, 0, copy);
                }
                return doc;
            });
            if (newIds.length > 0) {
                set({
                    selectedIds: newIds
                });
            }
            return newIds;
        },
        moveNode: (id, newParentId, index)=>{
            mutateActiveDoc(set, get, (doc)=>{
                // prevent moving into self/descendant
                const subtree = findNodeInTree(doc.tree, id);
                if (!subtree) return doc;
                if (newParentId === id || findNodeInTree(subtree, newParentId)) return doc;
                const newParent = newParentId === null ? doc.tree : findNodeInTree(doc.tree, newParentId);
                if (!newParent) return doc;
                const removed = removeNodeFromTree(doc.tree, id);
                if (!removed) return doc;
                // re-find newParent in case it was the same as old parent (its children array mutated)
                const target = newParentId === null ? doc.tree : findNodeInTree(doc.tree, newParentId);
                if (!target) {
                    // fallback — push to root
                    doc.tree.children.push(removed);
                } else {
                    const at = index < 0 || index > target.children.length ? target.children.length : index;
                    target.children.splice(at, 0, removed);
                }
                return doc;
            });
        },
        reorderChild: (parentId, fromIndex, toIndex)=>{
            mutateActiveDoc(set, get, (doc)=>{
                const parent = parentId === null ? doc.tree : findNodeInTree(doc.tree, parentId);
                if (!parent) return doc;
                if (fromIndex < 0 || fromIndex >= parent.children.length) return doc;
                const arr = parent.children;
                const [moved] = arr.splice(fromIndex, 1);
                const at = toIndex < 0 ? 0 : toIndex > arr.length ? arr.length : toIndex;
                arr.splice(at, 0, moved);
                return doc;
            });
        },
        updateNodeProps: (id, partial)=>{
            mutateActiveDoc(set, get, (doc)=>{
                const node = findNodeInTree(doc.tree, id);
                if (!node) return doc;
                node.props = {
                    ...node.props,
                    ...partial
                };
                return doc;
            });
        },
        setNodeVariant: (id, variant)=>{
            mutateActiveDoc(set, get, (doc)=>{
                const node = findNodeInTree(doc.tree, id);
                if (!node) return doc;
                node.variant = variant;
                return doc;
            });
        },
        setNodeText: (id, text)=>{
            mutateActiveDoc(set, get, (doc)=>{
                const node = findNodeInTree(doc.tree, id);
                if (!node) return doc;
                const key = getPrimaryTextKey(node.component);
                if (!key) return doc;
                node.props = {
                    ...node.props,
                    [key]: text
                };
                return doc;
            });
        },
        // ── selection ──────────────────────────────────────────────────────────
        select: (ids)=>set({
                selectedIds: [
                    ...ids
                ]
            }),
        toggleSelect: (id)=>set((s)=>({
                    selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((x)=>x !== id) : [
                        ...s.selectedIds,
                        id
                    ]
                })),
        clearSelection: ()=>set({
                selectedIds: []
            }),
        // ── theme ──────────────────────────────────────────────────────────────
        setTheme: (t)=>{
            mutateActiveDoc(set, get, (doc)=>{
                doc.theme = t;
                return doc;
            });
        },
        setAccent: (a)=>{
            mutateActiveDoc(set, get, (doc)=>{
                doc.accent = a;
                return doc;
            });
        },
        // ── history ────────────────────────────────────────────────────────────
        undo: ()=>{
            const state = get();
            const active = state.getActiveDocument();
            if (!active || state.past.length === 0) return;
            const past = [
                ...state.past
            ];
            const previous = past.pop();
            const future = [
                structuredClone(active),
                ...state.future
            ].slice(0, HISTORY_LIMIT);
            set({
                documents: state.documents.map((d)=>d.id === previous.id ? previous : d),
                past,
                future,
                selectedIds: []
            });
        },
        redo: ()=>{
            const state = get();
            const active = state.getActiveDocument();
            if (!active || state.future.length === 0) return;
            const future = [
                ...state.future
            ];
            const next = future.shift();
            const past = [
                ...state.past,
                structuredClone(active)
            ].slice(-HISTORY_LIMIT);
            set({
                documents: state.documents.map((d)=>d.id === next.id ? next : d),
                past,
                future,
                selectedIds: []
            });
        },
        // ── clipboard ──────────────────────────────────────────────────────────
        copy: (ids)=>{
            const tree = get().getTree();
            const clips = [];
            for (const id of ids){
                const n = findNodeInTree(tree, id);
                if (n) clips.push(structuredClone(n));
            }
            if (clips.length > 0) set({
                clipboard: clips
            });
        },
        paste: (parentId, index)=>{
            const state = get();
            if (state.clipboard.length === 0) return [];
            const newIds = [];
            mutateActiveDoc(set, get, (doc)=>{
                const parent = parentId === null ? doc.tree : findNodeInTree(doc.tree, parentId);
                if (!parent) return doc;
                const at = index === undefined || index < 0 || index > parent.children.length ? parent.children.length : index;
                const copies = state.clipboard.map(cloneWithNewIds);
                copies.forEach((c)=>newIds.push(c.id));
                parent.children.splice(at, 0, ...copies);
                return doc;
            });
            if (newIds.length > 0) set({
                selectedIds: newIds
            });
            return newIds;
        },
        // ── grouping ───────────────────────────────────────────────────────────
        group: (ids)=>{
            if (ids.length === 0) return null;
            const state = get();
            const tree = state.getTree();
            // find parent of first id; all must share the same parent and be siblings
            const firstParent = findParentInTree(tree, ids[0]) ?? tree;
            const allSameParent = ids.every((id)=>{
                const p = findParentInTree(tree, id) ?? tree;
                return p.id === firstParent.id;
            });
            if (!allSameParent) return null;
            // indices in parent's children
            const indices = ids.map((id)=>firstParent.children.findIndex((c)=>c.id === id)).filter((i)=>i >= 0).sort((a, b)=>a - b);
            if (indices.length === 0) return null;
            const insertAt = indices[0];
            let groupId = null;
            mutateActiveDoc(set, get, (doc)=>{
                // re-resolve parent in the cloned tree
                const parent = firstParent.id === doc.tree.id ? doc.tree : findNodeInTree(doc.tree, firstParent.id) ?? doc.tree;
                // pull the nodes out (in reverse order so indices stay valid)
                const sortedIdx = [
                    ...indices
                ].sort((a, b)=>b - a);
                const pulled = [];
                for (const i of sortedIdx){
                    const node = parent.children.splice(i, 1)[0];
                    if (node) pulled.unshift(node);
                }
                const groupNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createNode"])("flex-col");
                groupNode.props.className = "flex flex-col gap-2 p-2 border rounded";
                groupNode.children = pulled;
                groupId = groupNode.id;
                parent.children.splice(insertAt, 0, groupNode);
                return doc;
            });
            if (groupId) set({
                selectedIds: [
                    groupId
                ]
            });
            return groupId;
        },
        ungroup: (groupId)=>{
            mutateActiveDoc(set, get, (doc)=>{
                const parent = findParentInTree(doc.tree, groupId);
                const groupNode = parent ? parent.children.find((c)=>c.id === groupId) : findNodeInTree(doc.tree, groupId);
                if (!groupNode) return doc;
                const idx = parent ? parent.children.findIndex((c)=>c.id === groupId) : -1;
                if (!parent || idx < 0) return doc;
                const kids = groupNode.children;
                parent.children.splice(idx, 1, ...kids);
                return doc;
            });
            set({
                selectedIds: []
            });
        },
        // ── persistence ────────────────────────────────────────────────────────
        hydrate: ()=>{
            if (hydrated) return;
            hydrated = true;
            if ("TURBOPACK compile-time truthy", 1) return; // SSR guard
            //TURBOPACK unreachable
            ;
        },
        forceSave: ()=>{
            if ("TURBOPACK compile-time truthy", 1) return;
            //TURBOPACK unreachable
            ;
            const state = undefined;
        },
        exportJSON: ()=>{
            const doc = get().getActiveDocument();
            return doc ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$codegen$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateJSON"])(doc) : "{}";
        },
        importJSON: (raw)=>{
            try {
                const doc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$codegen$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseJSON"])(raw);
                // ensure fresh id to avoid collision
                const newId = nanoid10();
                const newDoc = {
                    ...doc,
                    id: newId,
                    updatedAt: Date.now()
                };
                set((s)=>({
                        documents: [
                            ...s.documents,
                            newDoc
                        ],
                        activeDocumentId: newId,
                        selectedIds: [],
                        past: [],
                        future: []
                    }));
            } catch (e) {
                // swallow — caller may surface via toast in Task 2
                console.error("[frame] importJSON failed:", e);
            }
        }
    }));
// ---------------------------------------------------------------------------
// Module-local helpers
// ---------------------------------------------------------------------------
function seedDefault(set) {
    const doc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$frame$2f$defaults$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["newDocument"])();
    set({
        documents: [
            doc
        ],
        activeDocumentId: doc.id,
        saveStatus: "saved",
        lastSavedAt: Date.now()
    });
}
function installAutosave() {
    if (autosaveInstalled) return;
    autosaveInstalled = true;
    useFrameStore.subscribe((state, prevState)=>{
        // Only react to documents/activeDocumentId changes (not selection/save status).
        if (state.documents === prevState.documents && state.activeDocumentId === prevState.activeDocumentId) {
            return;
        }
        useFrameStore.setState({
            saveStatus: "saving"
        });
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(()=>{
            useFrameStore.getState().forceSave();
        }, AUTOSAVE_DEBOUNCE_MS);
    });
}
function useActiveDocument() {
    return useFrameStore((s)=>s.documents.find((d)=>d.id === s.activeDocumentId));
}
function useTree() {
    return useFrameStore((s)=>s.documents.find((d)=>d.id === s.activeDocumentId)?.tree ?? FALLBACK_ROOT);
}
}),
];

//# sourceMappingURL=src_lib_frame_1_uhyg6._.js.map