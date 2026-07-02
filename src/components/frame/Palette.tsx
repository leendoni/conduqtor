"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useFrameStore } from "@/lib/frame/store";
import { COMPONENTS, PALETTE_GROUPS } from "@/lib/frame/registry";
import type { ComponentSchema } from "@/lib/frame/types";
import { DynamicIcon } from "./icons";
import { MIME_KEY } from "./dnd";

/** Hardcoded "New" set — the components added most recently (Task 4). */
const NEW_KEYS = new Set<string>([
  "carousel",
  "drawer",
  "typography",
  "sidebar",
  "spinner",
  "command",
]);

/**
 * Palette — searchable, grouped list of components in the left sidebar.
 * Items are draggable (native HTML5) and double-click inserts at root.
 *
 * Spec styling:
 *  - search: h-9 bg-zinc-50 border-zinc-200
 *  - group headers: .eyebrow class (uppercase 11px semibold)
 *  - row: flex items-center gap-2 px-3 h-9 rounded-md hover:bg-zinc-50
 *         16px lucide icon text-zinc-500 + name text-[13px] font-medium text-zinc-900
 *  - optional New badge (.new-badge) right-aligned
 */
export function Palette() {
  const insertNodeAtRoot = useFrameStore((s) => s.insertNodeAtRoot);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    PALETTE_GROUPS.reduce(
      (acc, g) => {
        acc[g.key] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sortByName = (a: ComponentSchema, b: ComponentSchema) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    if (!q) {
      return PALETTE_GROUPS.map((g) => ({
        group: g,
        items: Object.values(COMPONENTS)
          .filter((c) => c.group === g.key)
          .sort(sortByName),
      }));
    }
    return PALETTE_GROUPS.map((g) => ({
      group: g,
      items: Object.values(COMPONENTS)
        .filter((c) => c.group === g.key && c.name.toLowerCase().includes(q))
        .sort(sortByName),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const toggleGroup = (key: string) =>
    setOpenGroups((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="flex h-full flex-col">
      <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components…"
            className="h-9 pl-8 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 placeholder:text-zinc-400"
          />
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-500">
          Drag onto canvas, or double-click to add.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 frame-scroll">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-500 p-4 text-center">No matches.</p>
        )}
        {filtered.map(({ group, items }) => {
          const isOpen = query.trim() !== "" ? true : openGroups[group.key];
          return (
            <Collapsible
              key={group.key}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.key)}
              className="mb-0.5"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group w-full flex items-center gap-1 px-3 pt-3 pb-1 text-left hover:opacity-80 transition-opacity"
                >
                  {isOpen ? (
                    <ChevronDown className="size-3 text-zinc-400" />
                  ) : (
                    <ChevronRight className="size-3 text-zinc-400" />
                  )}
                  <span className="eyebrow">{group.label}</span>
                  <span className="ml-auto text-[10px] font-mono text-zinc-400 tabular-nums">
                    {items.length}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-0.5 pb-1 px-1.5">
                  {items.map((c) => (
                    <PaletteItem
                      key={c.key}
                      component={c}
                      isNew={NEW_KEYS.has(c.key)}
                      onDoubleClick={() => insertNodeAtRoot(c.key)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

function PaletteItem({
  component,
  isNew,
  onDoubleClick,
}: {
  component: ComponentSchema;
  isNew: boolean;
  onDoubleClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(MIME_KEY, component.key);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group flex items-center gap-2 px-2.5 h-9 rounded-md",
        "cursor-grab active:cursor-grabbing select-none",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
        "active:bg-zinc-100 dark:active:bg-zinc-800",
        "transition-colors",
      )}
      title={component.description ?? component.name}
    >
      <DynamicIcon
        name={component.icon}
        className="size-4 shrink-0 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
      />
      <span className="flex-1 truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
        {component.name}
      </span>
      {isNew && <span className="new-badge">New</span>}
    </div>
  );
}
