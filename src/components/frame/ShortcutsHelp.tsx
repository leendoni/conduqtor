"use client";

import { Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Ctrl/Cmd + S", action: "Save" },
  { keys: "Ctrl/Cmd + Z", action: "Undo" },
  { keys: "Ctrl/Cmd + Shift + Z", action: "Redo" },
  { keys: "Ctrl/Cmd + D", action: "Duplicate selected" },
  { keys: "Ctrl/Cmd + G", action: "Group selected" },
  { keys: "Ctrl/Cmd + Shift + G", action: "Ungroup" },
  { keys: "Ctrl/Cmd + C", action: "Copy" },
  { keys: "Ctrl/Cmd + V", action: "Paste" },
  { keys: "Delete / Backspace", action: "Remove selected" },
  { keys: "Escape", action: "Clear selection" },
  { keys: "↑ / ↓", action: "Reorder within parent" },
  { keys: "Shift + Click", action: "Toggle selection" },
  { keys: "Double-click palette", action: "Insert at root" },
];

export function ShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 shadow-float">
        <div className="space-y-1">
          <p className="eyebrow mb-2">Shortcuts</p>
          {SHORTCUTS.map((s) => (
            <div
              key={s.action}
              className="flex items-center justify-between gap-2 text-xs py-0.5"
            >
              <span className="text-zinc-600 dark:text-zinc-400">{s.action}</span>
              <kbd className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
