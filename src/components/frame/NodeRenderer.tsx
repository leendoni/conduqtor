"use client";

import { Fragment, useMemo, useState, type ElementType, type ReactNode } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { toast, Toaster as SonnerToaster } from "sonner";
import * as Shadcn from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FrameNode, PropValue } from "@/lib/frame/types";
import { NodeWrapper } from "./NodeWrapper";
import { DynamicIcon } from "./icons";
import { splitLines } from "./dnd";

// Variant string unions (the registry's select options already constrain these).
type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
type AlertVariant = "default" | "destructive";
type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";
type SheetSide = "left" | "right" | "top" | "bottom";
type TooltipSide = "top" | "right" | "bottom" | "left";
type SeparatorOrientation = "horizontal" | "vertical";

// ---------------------------------------------------------------------------
// prop value coercion helpers
// ---------------------------------------------------------------------------

const str = (v: PropValue | undefined): string => (v == null ? "" : String(v));
const num = (v: PropValue | undefined, d = 0): number =>
  typeof v === "number" ? v : v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : d;
const bool = (v: PropValue | undefined): boolean => v === true || v === "true";

/** Parse simple CSV (header row + data rows) into a recharts-compatible array. */
function parseCSV(csv: string): { headers: string[]; rows: Record<string, string | number>[] } {
  const lines = csv.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const obj: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const v = cells[i] ?? "";
      const n = Number(v);
      obj[h] = v !== "" && !isNaN(n) ? n : v;
    });
    return obj;
  });
  return { headers, rows };
}

/** Compute the label of a child node — used by list containers. */
function childLabel(node: FrameNode, fallback = "Item"): string {
  const t =
    node.props.text ?? node.props.title ?? node.props.label ?? node.props.name;
  return t ? String(t) : fallback;
}

/** Whether a child node is "simple text-bearing" — its label is its only meaningful content. */
function isSimpleTextChild(node: FrameNode): boolean {
  return (
    node.children.length === 0 &&
    ["item", "label", "typography", "button", "badge", "link", "kbd"].includes(
      node.component,
    )
  );
}

// ---------------------------------------------------------------------------
// NodeRenderer — entry point. Root renders children directly (no wrapper).
// Every other node is wrapped in <NodeWrapper>.
// ---------------------------------------------------------------------------

export function NodeRenderer({ node }: { node: FrameNode }): ReactNode {
  if (node.component === "root") {
    const cls = str(node.props.className) || "flex flex-col gap-6 p-6";
    return (
      <div className={cn(cls, "min-h-full")}>
        {node.children.map((c) => (
          <NodeRenderer key={c.id} node={c} />
        ))}
      </div>
    );
  }

  return (
    <NodeWrapper node={node}>
      <NodeContent node={node} />
    </NodeWrapper>
  );
}

/** Render a list of children, used inside containers. */
function renderChildren(node: FrameNode): ReactNode {
  return node.children.map((c) => <NodeRenderer key={c.id} node={c} />);
}

// ---------------------------------------------------------------------------
// NodeContent — renders the actual shadcn/HTML element for a node.
// For composite containers, children are recursively rendered via <NodeRenderer>
// into the appropriate sub-part slot.
// ---------------------------------------------------------------------------

function NodeContent({ node }: { node: FrameNode }): ReactNode {
  // skeleton variant overrides everything
  if (node.variant === "skeleton") {
    return <Shadcn.Skeleton className="w-full h-6" />;
  }

  const p = node.props;
  switch (node.component) {
    // ── inputs ────────────────────────────────────────────────────────────
    case "input": {
      return (
        <div className="flex flex-col gap-1.5 w-full max-w-sm">
          {str(p.label) && <Shadcn.Label>{str(p.label)}</Shadcn.Label>}
          <Shadcn.Input
            type={str(p.type)}
            placeholder={str(p.placeholder)}
            defaultValue={str(p.value)}
            disabled={bool(p.disabled)}
          />
        </div>
      );
    }
    case "textarea": {
      return (
        <div className="flex flex-col gap-1.5 w-full max-w-sm">
          {str(p.label) && <Shadcn.Label>{str(p.label)}</Shadcn.Label>}
          <Shadcn.Textarea
            placeholder={str(p.placeholder)}
            defaultValue={str(p.value)}
            rows={num(p.rows, 4)}
            disabled={bool(p.disabled)}
            readOnly={bool(p.readonly)}
          />
        </div>
      );
    }
    case "label":
      return <Shadcn.Label>{str(p.text)}</Shadcn.Label>;

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Shadcn.Checkbox defaultChecked={bool(p.checked)} disabled={bool(p.disabled)} />
          <Shadcn.Label>{str(p.label)}</Shadcn.Label>
        </div>
      );

    case "radio-group": {
      const items = splitLines(str(p.items));
      const horiz = str(p.orientation) === "horizontal";
      return (
        <Shadcn.RadioGroup
          defaultValue={str(p.value)}
          disabled={bool(p.disabled)}
          className={horiz ? "flex flex-wrap gap-4" : "flex flex-col gap-2"}
        >
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Shadcn.RadioGroupItem value={item} id={`rg-${node.id}-${i}`} />
              <Shadcn.Label htmlFor={`rg-${node.id}-${i}`}>{item}</Shadcn.Label>
            </div>
          ))}
        </Shadcn.RadioGroup>
      );
    }

    case "switch":
      return (
        <div className="flex items-center gap-2">
          <Shadcn.Switch defaultChecked={bool(p.checked)} disabled={bool(p.disabled)} />
          <Shadcn.Label>{str(p.label)}</Shadcn.Label>
        </div>
      );

    case "slider":
      return (
        <Shadcn.Slider
          defaultValue={[num(p.value, 50)]}
          min={num(p.min, 0)}
          max={num(p.max, 100)}
          step={num(p.step, 1)}
          disabled={bool(p.disabled)}
          orientation={str(p.orientation) as "horizontal" | "vertical"}
          className="w-full max-w-sm"
        />
      );

    case "select": {
      const options = splitLines(str(p.options));
      return (
        <Shadcn.Select disabled={bool(p.disabled)}>
          <Shadcn.SelectTrigger className="w-full max-w-sm">
            <Shadcn.SelectValue placeholder={str(p.placeholder)} />
          </Shadcn.SelectTrigger>
          <Shadcn.SelectContent>
            {options.map((o, i) => (
              <Shadcn.SelectItem key={i} value={o}>
                {o}
              </Shadcn.SelectItem>
            ))}
          </Shadcn.SelectContent>
        </Shadcn.Select>
      );
    }

    case "combobox": {
      const options = splitLines(str(p.options));
      return (
        <div className="flex flex-col gap-1 w-full max-w-sm">
          <Shadcn.Input placeholder={str(p.placeholder)} list={`cb-${node.id}`} />
          <datalist id={`cb-${node.id}`}>
            {options.map((o, i) => (
              <option key={i} value={o} />
            ))}
          </datalist>
        </div>
      );
    }

    case "date-picker":
      return (
        <div className="flex flex-col gap-1.5 w-full max-w-sm">
          <Shadcn.Label>{str(p.placeholder)}</Shadcn.Label>
          <Shadcn.Input type="date" />
        </div>
      );

    case "input-otp": {
      const len = num(p.length, 6);
      return (
        <Shadcn.InputOTP
          maxLength={len}
          defaultValue={str(p.value)}
          disabled={bool(p.disabled)}
        >
          <Shadcn.InputOTPGroup>
            {Array.from({ length: len }).map((_, i) => (
              <Shadcn.InputOTPSlot key={i} index={i} />
            ))}
          </Shadcn.InputOTPGroup>
        </Shadcn.InputOTP>
      );
    }

    case "toggle-group": {
      const items = splitLines(str(p.items));
      const type = str(p.type) === "multiple" ? "multiple" : "single";
      const value = type === "multiple" ? [str(p.value)] : str(p.value);
      return (
        <Shadcn.ToggleGroup
          type={type}
          defaultValue={value as string | string[]}
          variant={str(p.variant) as "default" | "outline"}
          size={str(p.size) as "default" | "sm" | "lg"}
          orientation={str(p.orientation) as "horizontal" | "vertical"}
          className="flex-wrap"
        >
          {items.map((item, i) => (
            <Shadcn.ToggleGroupItem key={i} value={item}>
              {item}
            </Shadcn.ToggleGroupItem>
          ))}
        </Shadcn.ToggleGroup>
      );
    }

    // ── actions ───────────────────────────────────────────────────────────
    case "button":
      return (
        <Shadcn.Button
          variant={str(p.variant) as ButtonVariant}
          size={str(p.size) as ButtonSize}
          disabled={bool(p.disabled)}
          type={str(p.type) as "button" | "submit" | "reset"}
        >
          {str(p.text)}
        </Shadcn.Button>
      );

    case "button-group": {
      const orientation = str(p.orientation) as "horizontal" | "vertical";
      return (
        <div
          className={cn(
            "inline-flex p-1 rounded-md border bg-muted/30",
            orientation === "vertical" ? "flex-col" : "flex-row items-center",
          )}
        >
          {node.children.length > 0 ? (
            renderChildren(node)
          ) : (
            <span className="text-xs text-muted-foreground px-2 py-1">drop buttons here</span>
          )}
        </div>
      );
    }

    case "dropdown-menu": {
      return (
        <Shadcn.DropdownMenu>
          <Shadcn.DropdownMenuTrigger asChild>
            <Shadcn.Button variant="outline">{str(p.triggerText)}</Shadcn.Button>
          </Shadcn.DropdownMenuTrigger>
          <Shadcn.DropdownMenuContent>
            {node.children.length === 0 ? (
              <Shadcn.DropdownMenuItem>
                <span className="text-xs text-muted-foreground">drop items here</span>
              </Shadcn.DropdownMenuItem>
            ) : (
              node.children.map((c, i) =>
                isSimpleTextChild(c) ? (
                  <Shadcn.DropdownMenuItem key={c.id}>
                    {childLabel(c)}
                  </Shadcn.DropdownMenuItem>
                ) : (
                  <Shadcn.DropdownMenuItem key={c.id} className="p-0">
                    <div className="w-full">
                      <NodeRenderer node={c} />
                    </div>
                  </Shadcn.DropdownMenuItem>
                ),
              )
            )}
          </Shadcn.DropdownMenuContent>
        </Shadcn.DropdownMenu>
      );
    }

    case "link":
      return (
        <a
          href={str(p.href) || "#"}
          target={str(p.target)}
          className={str(p.className) || "text-primary hover:underline"}
          onClick={(e) => e.preventDefault()}
        >
          {str(p.text)}
        </a>
      );

    case "toggle":
      return (
        <Shadcn.Toggle
          defaultPressed={bool(p.pressed)}
          disabled={bool(p.disabled)}
          variant={str(p.variant) as ToggleVariant}
          size={str(p.size) as ToggleSize}
        >
          {str(p.label)}
        </Shadcn.Toggle>
      );

    // ── navigation ────────────────────────────────────────────────────────
    case "tabs": {
      const children = node.children;
      const defaultVal = str(p.value) || `tab1`;
      return (
        <Shadcn.Tabs defaultValue={defaultVal} className="w-full max-w-md">
          <Shadcn.TabsList>
            {children.map((c, i) => (
              <Shadcn.TabsTrigger key={c.id} value={`tab${i + 1}`}>
                {childLabel(c)}
              </Shadcn.TabsTrigger>
            ))}
          </Shadcn.TabsList>
          {children.map((c, i) => (
            <Shadcn.TabsContent key={c.id} value={`tab${i + 1}`}>
              {c.children.length > 0 ? (
                renderChildren(c)
              ) : (
                <p className="text-sm text-muted-foreground p-2">
                  {childLabel(c)} content
                </p>
              )}
            </Shadcn.TabsContent>
          ))}
        </Shadcn.Tabs>
      );
    }

    case "breadcrumb": {
      const items = splitLines(str(p.items));
      const sep = str(p.separator);
      return (
        <Shadcn.Breadcrumb>
          <Shadcn.BreadcrumbList>
            {items.map((item, i) => (
              <Fragment key={i}>
                <Shadcn.BreadcrumbItem>
                  {i === items.length - 1 ? (
                    <Shadcn.BreadcrumbPage>{item}</Shadcn.BreadcrumbPage>
                  ) : (
                    <Shadcn.BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                      {item}
                    </Shadcn.BreadcrumbLink>
                  )}
                </Shadcn.BreadcrumbItem>
                {i < items.length - 1 && (
                  <Shadcn.BreadcrumbSeparator>
                    {sep ? (
                      /^[A-Z][A-Za-z0-9]*$/.test(sep) ? (
                        <DynamicIcon name={sep} size={14} />
                      ) : (
                        <span>{sep}</span>
                      )
                    ) : undefined}
                  </Shadcn.BreadcrumbSeparator>
                )}
              </Fragment>
            ))}
          </Shadcn.BreadcrumbList>
        </Shadcn.Breadcrumb>
      );
    }

    case "pagination": {
      const totalPages = num(p.totalPages, 10);
      const current = num(p.page, 1);
      const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);
      return (
        <Shadcn.Pagination>
          <Shadcn.PaginationContent>
            <Shadcn.PaginationItem>
              <Shadcn.PaginationPrevious href="#" onClick={(e) => e.preventDefault()} />
            </Shadcn.PaginationItem>
            {pages.map((pg) => (
              <Shadcn.PaginationItem key={pg}>
                <Shadcn.PaginationLink
                  href="#"
                  isActive={pg === current}
                  onClick={(e) => e.preventDefault()}
                >
                  {pg}
                </Shadcn.PaginationLink>
              </Shadcn.PaginationItem>
            ))}
            <Shadcn.PaginationItem>
              <Shadcn.PaginationNext href="#" onClick={(e) => e.preventDefault()} />
            </Shadcn.PaginationItem>
          </Shadcn.PaginationContent>
        </Shadcn.Pagination>
      );
    }

    case "menubar": {
      return (
        <Shadcn.Menubar>
          {node.children.length === 0 ? (
            <Shadcn.MenubarMenu>
              <Shadcn.MenubarTrigger>Menu</Shadcn.MenubarTrigger>
              <Shadcn.MenubarContent>
                <Shadcn.MenubarItem>
                  <span className="text-xs text-muted-foreground">drop menus here</span>
                </Shadcn.MenubarItem>
              </Shadcn.MenubarContent>
            </Shadcn.MenubarMenu>
          ) : (
            node.children.map((c) => (
              <Shadcn.MenubarMenu key={c.id}>
                <Shadcn.MenubarTrigger>{childLabel(c)}</Shadcn.MenubarTrigger>
                <Shadcn.MenubarContent>
                  {c.children.length === 0 ? (
                    <Shadcn.MenubarItem>
                      <span className="text-xs text-muted-foreground">drop items here</span>
                    </Shadcn.MenubarItem>
                  ) : (
                    c.children.map((ci) => (
                      <Shadcn.MenubarItem key={ci.id}>{childLabel(ci)}</Shadcn.MenubarItem>
                    ))
                  )}
                </Shadcn.MenubarContent>
              </Shadcn.MenubarMenu>
            ))
          )}
        </Shadcn.Menubar>
      );
    }

    case "navigation-menu": {
      return (
        <Shadcn.NavigationMenu>
          <Shadcn.NavigationMenuList>
            {node.children.length === 0 ? (
              <Shadcn.NavigationMenuItem>
                <Shadcn.NavigationMenuTrigger>Menu</Shadcn.NavigationMenuTrigger>
              </Shadcn.NavigationMenuItem>
            ) : (
              node.children.map((c) => (
                <Shadcn.NavigationMenuItem key={c.id}>
                  <Shadcn.NavigationMenuTrigger>{childLabel(c)}</Shadcn.NavigationMenuTrigger>
                  {c.children.length > 0 && (
                    <Shadcn.NavigationMenuContent>
                      <div className="flex flex-col gap-2 p-2 w-[200px]">
                        {renderChildren(c)}
                      </div>
                    </Shadcn.NavigationMenuContent>
                  )}
                </Shadcn.NavigationMenuItem>
              ))
            )}
          </Shadcn.NavigationMenuList>
        </Shadcn.NavigationMenu>
      );
    }

    // ── data ──────────────────────────────────────────────────────────────
    case "data-table": {
      return <DataTablePreview node={node} />;
    }

    case "accordion": {
      const children = node.children;
      const type = str(p.type) === "multiple" ? "multiple" : "single";
      const dv =
        type === "single" && !str(p.defaultValue) ? "item-1" : str(p.defaultValue);
      return (
        <Shadcn.Accordion
          type={type as "single" | "multiple"}
          defaultValue={dv || undefined}
          disabled={bool(p.disabled)}
          className="w-full max-w-md"
        >
          {children.length === 0 ? (
            <Shadcn.AccordionItem value="item-1">
              <Shadcn.AccordionTrigger>Section 1</Shadcn.AccordionTrigger>
              <Shadcn.AccordionContent>
                <span className="text-xs text-muted-foreground">drop sections here</span>
              </Shadcn.AccordionContent>
            </Shadcn.AccordionItem>
          ) : (
            children.map((c, i) => (
              <Shadcn.AccordionItem key={c.id} value={`item-${i + 1}`}>
                <Shadcn.AccordionTrigger>{childLabel(c)}</Shadcn.AccordionTrigger>
                <Shadcn.AccordionContent>
                  {c.children.length > 0 ? (
                    renderChildren(c)
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Content for {childLabel(c)}.
                    </p>
                  )}
                </Shadcn.AccordionContent>
              </Shadcn.AccordionItem>
            ))
          )}
        </Shadcn.Accordion>
      );
    }

    case "badge":
      return (
        <Shadcn.Badge variant={str(p.variant) as BadgeVariant}>
          {str(p.text)}
        </Shadcn.Badge>
      );

    case "collapsible":
      return (
        <Shadcn.Collapsible defaultOpen={bool(p.defaultOpen) || bool(p.open)}>
          <div className="flex flex-col gap-2 w-full max-w-md">
            <Shadcn.CollapsibleTrigger className="self-start">
              <Shadcn.Button variant="ghost" size="sm">
                {str(p.triggerText)}
              </Shadcn.Button>
            </Shadcn.CollapsibleTrigger>
            <Shadcn.CollapsibleContent>
              {node.children.length > 0 ? (
                renderChildren(node)
              ) : (
                <span className="text-xs text-muted-foreground">drop children here</span>
              )}
            </Shadcn.CollapsibleContent>
          </div>
        </Shadcn.Collapsible>
      );

    case "tooltip": {
      const side = str(p.side) as TooltipSide;
      const align = str(p.align) as "start" | "center" | "end";
      const hasChildren = node.children.length > 0;
      return (
        <Shadcn.Tooltip>
          <Shadcn.TooltipTrigger asChild>
            {hasChildren ? (
              <span className="inline-flex">{renderChildren(node)}</span>
            ) : (
              <Shadcn.Button variant="outline" size="sm">
                {str(p.triggerText) || "Hover me"}
              </Shadcn.Button>
            )}
          </Shadcn.TooltipTrigger>
          <Shadcn.TooltipContent side={side} align={align}>
            {str(p.text)}
          </Shadcn.TooltipContent>
        </Shadcn.Tooltip>
      );
    }

    case "avatar":
      return (
        <Shadcn.Avatar>
          {str(p.src) && (
            <Shadcn.AvatarImage src={str(p.src)} alt={str(p.alt)} />
          )}
          <Shadcn.AvatarFallback>{str(p.fallback) || "CN"}</Shadcn.AvatarFallback>
        </Shadcn.Avatar>
      );

    case "progress":
      return (
        <Shadcn.Progress
          value={num(p.value, 33)}
          max={num(p.max, 100)}
          className="w-full max-w-sm"
        />
      );

    case "skeleton": {
      const w = str(p.width) || "100%";
      const h = str(p.height) || "20px";
      return (
        <Shadcn.Skeleton
          className={cn("rounded", str(p.className))}
          style={{ width: w, height: h }}
        />
      );
    }

    // ── notifications ─────────────────────────────────────────────────────
    case "alert":
      return (
        <Shadcn.Alert
          variant={str(p.variant) as AlertVariant}
          className="max-w-md"
        >
          <Shadcn.AlertTitle>{str(p.title)}</Shadcn.AlertTitle>
          <Shadcn.AlertDescription>{str(p.description)}</Shadcn.AlertDescription>
        </Shadcn.Alert>
      );

    case "dialog":
      return (
        <Shadcn.Dialog>
          <Shadcn.DialogTrigger asChild>
            <Shadcn.Button variant="outline">{str(p.triggerText)}</Shadcn.Button>
          </Shadcn.DialogTrigger>
          <Shadcn.DialogContent>
            <Shadcn.DialogHeader>
              <Shadcn.DialogTitle>{str(p.title)}</Shadcn.DialogTitle>
              <Shadcn.DialogDescription>{str(p.description)}</Shadcn.DialogDescription>
            </Shadcn.DialogHeader>
            <div className="flex flex-col gap-3">
              {node.children.length > 0 ? (
                renderChildren(node)
              ) : (
                <p className="text-sm text-muted-foreground">drop children here</p>
              )}
            </div>
            {bool(p.showFooter) && (
              <Shadcn.DialogFooter>
                <Shadcn.Button>{str(p.footerText) || "Save changes"}</Shadcn.Button>
              </Shadcn.DialogFooter>
            )}
          </Shadcn.DialogContent>
        </Shadcn.Dialog>
      );

    case "alert-dialog":
      return (
        <Shadcn.AlertDialog>
          <Shadcn.AlertDialogTrigger asChild>
            <Shadcn.Button variant="destructive">{str(p.triggerText)}</Shadcn.Button>
          </Shadcn.AlertDialogTrigger>
          <Shadcn.AlertDialogContent>
            <Shadcn.AlertDialogHeader>
              <Shadcn.AlertDialogTitle>{str(p.title)}</Shadcn.AlertDialogTitle>
              <Shadcn.AlertDialogDescription>
                {str(p.description)}
              </Shadcn.AlertDialogDescription>
            </Shadcn.AlertDialogHeader>
            {node.children.length > 0 && (
              <div className="flex flex-col gap-2">{renderChildren(node)}</div>
            )}
            <Shadcn.AlertDialogFooter>
              <Shadcn.AlertDialogCancel>{str(p.cancelText)}</Shadcn.AlertDialogCancel>
              <Shadcn.AlertDialogAction>{str(p.actionText)}</Shadcn.AlertDialogAction>
            </Shadcn.AlertDialogFooter>
          </Shadcn.AlertDialogContent>
        </Shadcn.AlertDialog>
      );

    case "sheet": {
      const side = str(p.side) as SheetSide;
      return (
        <Shadcn.Sheet>
          <Shadcn.SheetTrigger asChild>
            <Shadcn.Button variant="outline">{str(p.triggerText)}</Shadcn.Button>
          </Shadcn.SheetTrigger>
          <Shadcn.SheetContent side={side}>
            <Shadcn.SheetHeader>
              <Shadcn.SheetTitle>{str(p.title)}</Shadcn.SheetTitle>
              {str(p.description) && (
                <Shadcn.SheetDescription>{str(p.description)}</Shadcn.SheetDescription>
              )}
            </Shadcn.SheetHeader>
            <div className="flex flex-col gap-3 p-4">
              {node.children.length > 0 ? (
                renderChildren(node)
              ) : (
                <p className="text-sm text-muted-foreground">drop children here</p>
              )}
            </div>
          </Shadcn.SheetContent>
        </Shadcn.Sheet>
      );
    }

    case "popover": {
      const align = str(p.align) as "start" | "center" | "end";
      return (
        <Shadcn.Popover>
          <Shadcn.PopoverTrigger asChild>
            <Shadcn.Button variant="outline">{str(p.triggerText)}</Shadcn.Button>
          </Shadcn.PopoverTrigger>
          <Shadcn.PopoverContent align={align} sideOffset={num(p.sideOffset, 4)}>
            <div className="flex flex-col gap-2">
              {node.children.length > 0 ? (
                renderChildren(node)
              ) : (
                <p className="text-sm text-muted-foreground">drop children here</p>
              )}
            </div>
          </Shadcn.PopoverContent>
        </Shadcn.Popover>
      );
    }

    case "drawer": {
      const side = str(p.side) as "top" | "bottom" | "left" | "right";
      return (
        <Shadcn.Drawer>
          <Shadcn.DrawerTrigger asChild>
            <Shadcn.Button variant="outline">{str(p.triggerText)}</Shadcn.Button>
          </Shadcn.DrawerTrigger>
          <Shadcn.DrawerContent
            className={side === "top" || side === "bottom" ? "" : "flex flex-row"}
          >
            <div className="p-4 flex flex-col gap-2 max-w-md mx-auto w-full">
              <Shadcn.DrawerHeader>
                <Shadcn.DrawerTitle>{str(p.title)}</Shadcn.DrawerTitle>
                {str(p.description) && (
                  <Shadcn.DrawerDescription>{str(p.description)}</Shadcn.DrawerDescription>
                )}
              </Shadcn.DrawerHeader>
              {node.children.length > 0 && (
                <div className="flex flex-col gap-2">{renderChildren(node)}</div>
              )}
            </div>
          </Shadcn.DrawerContent>
        </Shadcn.Drawer>
      );
    }

    case "sonner": {
      return <SonnerPreview node={node} />;
    }

    // ── charts ────────────────────────────────────────────────────────────
    case "chart-bar": {
      const { headers, rows } = parseCSV(str(p.data));
      const color = str(p.color) || "#0f62fe";
      return (
        <div className="w-full max-w-md">
          {str(p.title) && <p className="text-sm font-medium mb-2">{str(p.title)}</p>}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={headers[0]} fontSize={12} />
              <YAxis fontSize={12} />
              <Bar dataKey={headers[1]} fill={color} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    case "chart-line": {
      const { headers, rows } = parseCSV(str(p.data));
      const color = str(p.color) || "#0f62fe";
      return (
        <div className="w-full max-w-md">
          {str(p.title) && <p className="text-sm font-medium mb-2">{str(p.title)}</p>}
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={headers[0]} fontSize={12} />
              <YAxis fontSize={12} />
              <Line type="monotone" dataKey={headers[1]} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    case "chart-area": {
      const { headers, rows } = parseCSV(str(p.data));
      const color = str(p.color) || "#0f62fe";
      return (
        <div className="w-full max-w-md">
          {str(p.title) && <p className="text-sm font-medium mb-2">{str(p.title)}</p>}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={rows}>
              <defs>
                <linearGradient id={`area-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey={headers[0]} fontSize={12} />
              <YAxis fontSize={12} />
              <Area
                type="monotone"
                dataKey={headers[1]}
                stroke={color}
                fill={`url(#area-${node.id})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }
    case "chart-pie":
    case "chart-donut": {
      const { headers, rows } = parseCSV(str(p.data));
      const color = str(p.color) || "#0f62fe";
      const isDonut = node.component === "chart-donut";
      return (
        <div className="w-full max-w-md">
          {str(p.title) && <p className="text-sm font-medium mb-2">{str(p.title)}</p>}
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={rows}
                dataKey={headers[1]}
                nameKey={headers[0]}
                outerRadius={80}
                innerRadius={isDonut ? 40 : 0}
                label
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // ── icons ─────────────────────────────────────────────────────────────
    case "icon": {
      return (
        <DynamicIcon
          name={str(p.name)}
          size={num(p.size, 20)}
          color={str(p.color) || "currentColor"}
          strokeWidth={num(p.strokeWidth, 2)}
        />
      );
    }

    // ── containers-tailwind ───────────────────────────────────────────────
    case "flex-row":
    case "flex-col":
    case "grid":
    case "box":
    case "stack": {
      const cls = str(p.className) || "flex flex-col gap-2";
      return (
        <div className={cls}>
          {node.children.length > 0 ? (
            renderChildren(node)
          ) : (
            <div className="text-xs text-muted-foreground border border-dashed rounded p-4 text-center">
              drop components here
            </div>
          )}
        </div>
      );
    }

    // ── containers-shadcn ─────────────────────────────────────────────────
    case "card":
      return (
        <Shadcn.Card className={cn("w-full max-w-md", str(p.className))}>
          <Shadcn.CardHeader>
            <Shadcn.CardTitle>{str(p.title)}</Shadcn.CardTitle>
            {str(p.description) && (
              <Shadcn.CardDescription>{str(p.description)}</Shadcn.CardDescription>
            )}
          </Shadcn.CardHeader>
          <Shadcn.CardContent className="flex flex-col gap-3">
            {node.children.length > 0 ? (
              renderChildren(node)
            ) : (
              <span className="text-xs text-muted-foreground">drop children here</span>
            )}
          </Shadcn.CardContent>
          {bool(p.showFooter) && (
            <Shadcn.CardFooter>
              <span className="text-sm text-muted-foreground">
                {str(p.footerText) || "Footer"}
              </span>
            </Shadcn.CardFooter>
          )}
        </Shadcn.Card>
      );

    case "separator":
      return (
        <Shadcn.Separator
          orientation={str(p.orientation) as SeparatorOrientation}
          decorative={bool(p.decorative)}
          className={str(p.orientation) === "vertical" ? "h-6" : "w-full"}
        />
      );

    case "scroll-area":
      return (
        <Shadcn.ScrollArea className={str(p.className) || "h-72 w-full"}>
          {node.children.length > 0 ? (
            renderChildren(node)
          ) : (
            <span className="text-xs text-muted-foreground p-2">drop children here</span>
          )}
        </Shadcn.ScrollArea>
      );

    case "resizable": {
      const direction = str(p.direction) as "horizontal" | "vertical";
      const children = node.children;
      // If fewer than 2 children, fall back to two default panes.
      const panes =
        children.length >= 2
          ? children
          : [
              { id: "p1", component: "typography", variant: "normal", props: { variant: "p", text: "Panel 1" }, children: [] } as FrameNode,
              { id: "p2", component: "typography", variant: "normal", props: { variant: "p", text: "Panel 2" }, children: [] } as FrameNode,
            ];
      return (
        <div className="w-full max-w-md h-48 rounded-md border">
          <Shadcn.ResizablePanelGroup direction={direction}>
            {panes.map((c, i) => (
              <Fragment key={c.id}>
                <Shadcn.ResizablePanel defaultSize={50}>
                  <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                    {c.children.length > 0 ? (
                      <NodeRenderer node={c} />
                    ) : (
                      childLabel(c, `Panel ${i + 1}`)
                    )}
                  </div>
                </Shadcn.ResizablePanel>
                {i < panes.length - 1 && <Shadcn.ResizableHandle withHandle />}
              </Fragment>
            ))}
          </Shadcn.ResizablePanelGroup>
        </div>
      );
    }

    // ─── Task ID 4 + Task ID 9 additions ───────────────────────────────────
    case "aspect-ratio": {
      const ratio = num(p.ratio, 1.7778);
      return (
        <Shadcn.AspectRatio
          ratio={ratio}
          className="overflow-hidden rounded-md border bg-muted"
        >
          {node.children.length > 0 ? (
            renderChildren(node)
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              {ratio.toFixed(2)} ratio
            </div>
          )}
        </Shadcn.AspectRatio>
      );
    }

    case "calendar":
      return (
        <Shadcn.Calendar
          mode="single"
          className="rounded-md border"
          numberOfMonths={num(p.numberOfMonths, 1)}
        />
      );

    case "carousel": {
      const carouselItems =
        node.children.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <Shadcn.CarouselItem key={`ph-${i}`}>
                <div className="flex items-center justify-center p-6 border rounded">
                  {i + 1}
                </div>
              </Shadcn.CarouselItem>
            ))
          : node.children.map((c) => (
              <Shadcn.CarouselItem key={c.id}>
                <div className="flex items-center justify-center p-6 border rounded">
                  {c.children.length > 0 ? (
                    renderChildren(c)
                  ) : (
                    <span>{childLabel(c)}</span>
                  )}
                </div>
              </Shadcn.CarouselItem>
            ));
      return (
        <div className="w-full max-w-md">
          <Shadcn.Carousel
            opts={{
              loop: bool(p["opts-loop"]),
              align: str(p["opts-align"]) as "start" | "center" | "end",
            }}
            orientation={str(p.orientation) as "horizontal" | "vertical"}
          >
            <Shadcn.CarouselContent>{carouselItems}</Shadcn.CarouselContent>
            <Shadcn.CarouselPrevious />
            <Shadcn.CarouselNext />
          </Shadcn.Carousel>
        </div>
      );
    }

    case "command": {
      return (
        <Shadcn.Command className="max-w-md rounded-md border shadow-sm">
          <Shadcn.CommandInput placeholder={str(p.placeholder)} />
          <Shadcn.CommandList>
            <Shadcn.CommandEmpty>No result.</Shadcn.CommandEmpty>
            <Shadcn.CommandGroup>
              {node.children.length === 0 ? (
                <Shadcn.CommandItem>
                  <span className="text-xs text-muted-foreground">drop items here</span>
                </Shadcn.CommandItem>
              ) : (
                node.children.map((c) => (
                  <Shadcn.CommandItem key={c.id}>{childLabel(c)}</Shadcn.CommandItem>
                ))
              )}
            </Shadcn.CommandGroup>
          </Shadcn.CommandList>
        </Shadcn.Command>
      );
    }

    case "context-menu": {
      return (
        <Shadcn.ContextMenu>
          <Shadcn.ContextMenuTrigger asChild>
            <div className="flex h-24 w-full max-w-md items-center justify-center rounded-md border border-dashed text-sm">
              {str(p.triggerText)}
            </div>
          </Shadcn.ContextMenuTrigger>
          <Shadcn.ContextMenuContent>
            {node.children.length === 0 ? (
              <Shadcn.ContextMenuItem>
                <span className="text-xs text-muted-foreground">drop items here</span>
              </Shadcn.ContextMenuItem>
            ) : (
              node.children.map((c) => (
                <Shadcn.ContextMenuItem key={c.id}>{childLabel(c)}</Shadcn.ContextMenuItem>
              ))
            )}
          </Shadcn.ContextMenuContent>
        </Shadcn.ContextMenu>
      );
    }

    case "empty": {
      const title = str(p.title);
      const description = str(p.description);
      const iconName = str(p.icon) || "Search";
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center max-w-md border rounded-md bg-card">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <DynamicIcon name={iconName} size={24} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {node.children.length > 0 && <div className="flex gap-2">{renderChildren(node)}</div>}
        </div>
      );
    }

    case "field": {
      const label = str(p.label);
      const description = str(p.description);
      const error = str(p.error);
      const orientation = str(p.orientation);
      const flexCls =
        orientation === "horizontal"
          ? "flex-row items-center gap-3"
          : orientation === "responsive"
          ? "flex-col @md:flex-row @md:items-center gap-1.5"
          : "flex-col gap-1.5";
      return (
        <div className={cn("flex w-full max-w-sm", flexCls)}>
          <Shadcn.Label className="shrink-0">{label}</Shadcn.Label>
          <div className="flex flex-col gap-1 flex-1">
            {node.children.length > 0 ? (
              renderChildren(node)
            ) : (
              <Shadcn.Input placeholder="Enter…" />
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      );
    }

    case "hover-card": {
      const align = str(p.align) as "start" | "center" | "end";
      const text = str(p.text);
      return (
        <Shadcn.HoverCard
          openDelay={num(p.openDelay, 700)}
          closeDelay={num(p.closeDelay, 300)}
        >
          <Shadcn.HoverCardTrigger asChild>
            <button className="text-sm underline cursor-default">
              {str(p.triggerText)}
            </button>
          </Shadcn.HoverCardTrigger>
          <Shadcn.HoverCardContent align={align} sideOffset={num(p.sideOffset, 4)}>
            {node.children.length > 0 ? (
              <div className="flex flex-col gap-2">{renderChildren(node)}</div>
            ) : (
              <p className="text-sm">{text}</p>
            )}
          </Shadcn.HoverCardContent>
        </Shadcn.HoverCard>
      );
    }

    case "input-group": {
      const leftAddon = str(p.leftAddon);
      const rightAddon = str(p.rightAddon);
      return (
        <div className="flex items-center w-full max-w-sm rounded-md border focus-within:ring-2 focus-within:ring-ring overflow-hidden">
          {leftAddon && (
            <span className="inline-flex items-center px-3 bg-muted text-sm text-muted-foreground border-r">
              {leftAddon}
            </span>
          )}
          {node.children.length > 0 ? (
            <div className="flex-1 flex">
              {renderChildren(node)}
            </div>
          ) : (
            <input
              type={str(p.type) as React.InputHTMLAttributes<HTMLInputElement>["type"]}
              placeholder={str(p.placeholder)}
              defaultValue={str(p.value)}
              disabled={bool(p.disabled)}
              className="flex h-9 w-full bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          )}
          {rightAddon && (
            <span className="inline-flex items-center px-3 bg-muted text-sm text-muted-foreground border-l">
              {rightAddon}
            </span>
          )}
        </div>
      );
    }

    case "item": {
      const variant = str(p.variant) as "default" | "destructive";
      return (
        <div
          className={cn(
            "flex items-center gap-3 rounded-md border p-3 max-w-md",
            variant === "destructive"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "bg-card",
          )}
        >
          <span className="text-sm font-medium">{str(p.text)}</span>
          {node.children.length > 0 && renderChildren(node)}
        </div>
      );
    }

    case "kbd": {
      const size = str(p.size);
      const cls =
        size === "sm" ? "text-xs px-1.5 py-0.5" : size === "lg" ? "text-base px-2.5 py-1" : "text-sm px-2 py-0.5";
      return (
        <kbd
          className={cn(
            "inline-flex items-center justify-center rounded border bg-muted font-mono font-medium",
            cls,
          )}
        >
          {str(p.text)}
        </kbd>
      );
    }

    case "native-select": {
      const options = splitLines(str(p.options));
      return (
        <select
          disabled={bool(p.disabled)}
          defaultValue={str(p.value) || undefined}
          className="inline-flex h-9 w-full max-w-sm items-center rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map((o, i) => (
            <option key={i} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }

    case "range-calendar":
      return (
        <Shadcn.Calendar
          mode="range"
          numberOfMonths={num(p.numberOfMonths, 1)}
          className="rounded-md border"
        />
      );

    case "sidebar": {
      const label = str(p.label);
      return (
        <div className="w-full max-w-md overflow-hidden rounded-md border">
          <div className="flex min-h-[400px]">
            <div className="flex w-56 flex-col gap-1 border-r bg-card p-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                {label}
              </div>
              {node.children.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                  {label}
                </div>
              ) : (
                node.children.map((c) => (
                  <div key={c.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                      {childLabel(c)}
                    </div>
                    {c.children.length > 0 && (
                      <div className="pl-4 flex flex-col gap-1">
                        {renderChildren(c)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
              Main content
            </div>
          </div>
        </div>
      );
    }

    case "spinner": {
      const size = str(p.size);
      const sz = size === "sm" ? "size-3" : size === "lg" ? "size-6" : "size-4";
      return (
        <DynamicIcon name="LoaderCircle" className={cn(sz, "animate-spin text-muted-foreground")} />
      );
    }

    case "table": {
      const cols = splitLines(str(p.columns));
      const rows = splitLines(str(p.rows)).map((r) => r.split(",").map((c) => c.trim()));
      const caption = str(p.caption);
      return (
        <div className="border rounded-md w-full overflow-auto max-w-2xl">
          <Shadcn.Table>
            {caption && <Shadcn.TableCaption>{caption}</Shadcn.TableCaption>}
            <Shadcn.TableHeader>
              <Shadcn.TableRow>
                {cols.map((c, i) => (
                  <Shadcn.TableHead key={i}>{c}</Shadcn.TableHead>
                ))}
              </Shadcn.TableRow>
            </Shadcn.TableHeader>
            <Shadcn.TableBody>
              {rows.length === 0 && node.children.length === 0 ? (
                <Shadcn.TableRow>
                  <Shadcn.TableCell colSpan={cols.length} className="text-muted-foreground text-sm">
                    No rows
                  </Shadcn.TableCell>
                </Shadcn.TableRow>
              ) : (
                <>
                  {rows.map((row, i) => (
                    <Shadcn.TableRow key={`r-${i}`}>
                      {cols.map((_, j) => (
                        <Shadcn.TableCell key={j}>{row[j] ?? ""}</Shadcn.TableCell>
                      ))}
                    </Shadcn.TableRow>
                  ))}
                  {node.children.map((c) => (
                    <Shadcn.TableRow key={c.id}>
                      {c.children.length > 0 ? (
                        c.children.map((gc) => (
                          <Shadcn.TableCell key={gc.id}>
                            <NodeRenderer node={gc} />
                          </Shadcn.TableCell>
                        ))
                      ) : (
                        <Shadcn.TableCell colSpan={cols.length}>
                          {childLabel(c)}
                        </Shadcn.TableCell>
                      )}
                    </Shadcn.TableRow>
                  ))}
                </>
              )}
            </Shadcn.TableBody>
          </Shadcn.Table>
        </div>
      );
    }

    case "typography": {
      const variant = str(p.variant);
      const text = str(p.text);
      const clsMap: Record<string, string> = {
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
      const cls = clsMap[variant] ?? clsMap.p;
      const Tag = (variant === "blockquote" || ["h1", "h2", "h3", "h4", "p"].includes(variant)
        ? variant
        : "p") as ElementType;
      return <Tag className={cls}>{text}</Tag>;
    }

    default: {
      return (
        <div className="border border-dashed border-destructive/50 rounded p-2 text-xs text-destructive">
          Unknown component: {node.component}
        </div>
      );
    }
  }
}

// ---------------------------------------------------------------------------
// SonnerPreview — render a labeled box showing the position + a "Show sample
// toast" button that calls toast(...). Also mount a real <Toaster /> (React
// sonner) so the user can see the toast render.
// ---------------------------------------------------------------------------

function SonnerPreview({ node }: { node: FrameNode }) {
  const p = node.props;
  const richColors = bool(p.richColors);
  const closeButton = bool(p.closeButton);
  const position = str(p.position) as
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
  const expand = bool(p.expand);
  const duration = num(p.duration, 4000);
  const visibleToasts = num(p.visibleToasts, 3);

  return (
    <div className="inline-flex flex-col gap-2 max-w-sm">
      <div className="inline-flex items-center gap-3 px-3 py-2 rounded-md border bg-card shadow-sm">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <DynamicIcon name="Bell" size={16} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold">Sonner Toaster</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            position: {position}
            {richColors ? " · rich" : ""}
            {closeButton ? " · close" : ""}
          </span>
        </div>
        <Shadcn.Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => {
            toast.success("Sample notification", {
              description: "This is what your toasts will look like.",
              duration,
            });
          }}
        >
          Show sample
        </Shadcn.Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Mounts a single &lt;Toaster /&gt; at this position. visibleToasts={visibleToasts}
        {expand ? " · expanded" : ""}
      </p>
      <SonnerToaster
        richColors={richColors}
        closeButton={closeButton}
        position={position}
        expand={expand}
        duration={duration}
        visibleToasts={visibleToasts}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataTablePreview — TanStack-table-backed React preview of the data-table
// node. Honors the sortable/filterable/paginated/selectable booleans.
// ---------------------------------------------------------------------------

function DataTablePreview({ node }: { node: FrameNode }) {
  const p = node.props;
  const cols = splitLines(str(p.columns));
  const rows = splitLines(str(p.rows)).map((r) => r.split(",").map((c) => c.trim()));
  const sortable = bool(p.sortable);
  const filterable = bool(p.filterable);
  const paginated = bool(p.paginated);
  const selectable = bool(p.selectable);
  const pageSize = num(p.pageSize, 10);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const data = useMemo(() => {
    return rows.map((r) => {
      const obj: Record<string, string | number> = {};
      cols.forEach((c, i) => {
        const accessor = c.toLowerCase().replace(/\s+/g, "_");
        const v = r[i] ?? "";
        const n = Number(v);
        obj[accessor] = v !== "" && !isNaN(n) ? n : v;
      });
      return obj;
    });
  }, [cols, rows]);

  const columns = useMemo<ColumnDef<Record<string, string | number>>[]>(() => {
    const base = cols.map((c) => {
      const accessor = c.toLowerCase().replace(/\s+/g, "_");
      return {
        accessorKey: accessor,
        header: c,
        cell: (info) => String(info.getValue() ?? ""),
      } as ColumnDef<Record<string, string | number>>;
    });
    if (selectable) {
      return [
        {
          id: "select",
          header: ({ table }) => (
            <Shadcn.Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Shadcn.Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        ...base,
      ];
    }
    return base;
  }, [cols, selectable]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getFilteredRowModel: filterable ? getFilteredRowModel() : undefined,
    getPaginationRowModel: paginated ? getPaginationRowModel() : undefined,
    initialState: paginated ? { pagination: { pageSize, pageIndex: 0 } } : undefined,
    enableSorting: sortable,
    enableGlobalFilter: filterable,
    enableRowSelection: selectable,
  });

  return (
    <div className="flex flex-col gap-2 w-full max-w-2xl">
      {filterable && (
        <Shadcn.Input
          placeholder="Filter…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 max-w-xs text-sm"
        />
      )}
      <div className="border rounded-md overflow-auto">
        <Shadcn.Table>
          <Shadcn.TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <Shadcn.TableRow key={hg.id}>
                {hg.headers.map((h) => {
                  const canSort = h.column.getCanSort();
                  const sorted = h.column.getIsSorted();
                  return (
                    <Shadcn.TableHead
                      key={h.id}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                      className={canSort ? "cursor-pointer select-none" : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === "asc" && " ▲"}
                        {sorted === "desc" && " ▼"}
                      </span>
                    </Shadcn.TableHead>
                  );
                })}
              </Shadcn.TableRow>
            ))}
          </Shadcn.TableHeader>
          <Shadcn.TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <Shadcn.TableRow>
                <Shadcn.TableCell colSpan={columns.length} className="text-muted-foreground text-sm">
                  No rows
                </Shadcn.TableCell>
              </Shadcn.TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Shadcn.TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <Shadcn.TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Shadcn.TableCell>
                  ))}
                </Shadcn.TableRow>
              ))
            )}
          </Shadcn.TableBody>
        </Shadcn.Table>
      </div>
      {paginated && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-1">
            <Shadcn.Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </Shadcn.Button>
            <Shadcn.Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Shadcn.Button>
          </div>
        </div>
      )}
    </div>
  );
}
