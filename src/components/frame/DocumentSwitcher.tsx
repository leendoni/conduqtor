"use client";

import { Check, ChevronUp, FileText, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFrameStore, useActiveDocument } from "@/lib/frame/store";

/**
 * DocumentSwitcher — compact 64px footer docked at the bottom of the left
 * sidebar. Shows the active document name + a chevron button. Clicking opens
 * a dropdown (upward) listing every document; click to switch via
 * `switchDocument`. A footer item "Manage documents…" opens the full
 * DocumentsDialog (passed in via `onManage`).
 */
export function DocumentSwitcher({ onManage }: { onManage: () => void }) {
  const activeDoc = useActiveDocument();
  const documents = useFrameStore((s) => s.documents);
  const switchDocument = useFrameStore((s) => s.switchDocument);

  const sorted = [...documents].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="h-16 border-t border-gray-200 dark:border-gray-800 w-full flex items-center px-2 bg-white dark:bg-zinc-950 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-12 justify-between gap-2 px-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            aria-label="Switch document"
          >
            <span className="flex items-center gap-2 min-w-0">
              <FileText className="size-3.5 text-zinc-500 shrink-0" />
              <span className="flex flex-col min-w-0 items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                  Document
                </span>
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-full">
                  {activeDoc?.name ?? "—"}
                </span>
              </span>
            </span>
            <ChevronUp className="size-3.5 text-zinc-500 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="w-60 shadow-float"
        >
          <DropdownMenuLabel className="eyebrow">Switch document</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sorted.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-zinc-500">No documents.</div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {sorted.map((doc) => {
              const isActive = doc.id === activeDoc?.id;
              return (
                <DropdownMenuItem
                  key={doc.id}
                  onClick={() => switchDocument(doc.id)}
                  className="gap-2 text-sm cursor-pointer"
                >
                  <FileText className="size-3.5 text-zinc-500 shrink-0" />
                  <span
                    className={cn(
                      "truncate flex-1",
                      isActive && "font-medium text-zinc-900 dark:text-zinc-100",
                    )}
                  >
                    {doc.name}
                  </span>
                  {isActive && <Check className="size-3.5 text-blue-500" />}
                </DropdownMenuItem>
              );
            })}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onManage}
            className="gap-2 text-sm cursor-pointer"
          >
            <Settings2 className="size-3.5 text-zinc-500" />
            Manage documents…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
