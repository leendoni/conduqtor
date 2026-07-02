"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ALL_ICON_NAMES, DynamicIcon, getLucideIcon } from "./icons";

const COLS = 8;
const ROW_H = 40; // px

/**
 * IconPicker — virtualized searchable lucide icon grid.
 * Renders only the visible slice of the ~1500-icon list for smooth scrolling.
 */
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ICON_NAMES;
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  const viewportH = 280;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - 2);
  const end = Math.min(filtered.length, start + Math.ceil(viewportH / ROW_H) + 4);
  const visible = filtered.slice(start, end);
  const totalH = filtered.length * ROW_H;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          type="button"
        >
          <DynamicIcon name={value || "CircleHelp"} className="size-4 text-zinc-500" />
          <span className="truncate flex-1 text-left text-xs font-mono text-zinc-700 dark:text-zinc-300">
            {value || "Pick icon"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-float" align="start">
        <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons…"
              className="h-9 pl-8 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            />
          </div>
        </div>
        <ScrollArea
          className="h-[280px]"
          onScroll={(e) => setScrollTop((e.target as HTMLElement).scrollTop)}
        >
          {filtered.length === 0 ? (
            <p className="text-xs text-zinc-500 p-4 text-center">No icons found.</p>
          ) : (
            <div className="relative w-full" style={{ height: totalH }}>
              <div
                className="absolute left-0 right-0 grid gap-1 p-1"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  top: start * ROW_H,
                }}
              >
                {visible.map((name) => {
                  if (!getLucideIcon(name)) return null;
                  const active = name === value;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => {
                        onChange(name);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex items-center justify-center rounded-md h-10",
                        "text-zinc-700 dark:text-zinc-300",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                        active && "bg-blue-500 text-white hover:bg-blue-600",
                      )}
                    >
                      <DynamicIcon name={name} className="size-4" />
                      {active && <Check className="absolute top-0.5 right-0.5 size-2.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
