"use client";

import { useEffect, useRef, useState } from "react";
import {
  Code2,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  Save,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFrameStore, useActiveDocument } from "@/lib/frame/store";
import { ThemeMenu } from "./ThemeMenu";
import { ShortcutsHelp } from "./ShortcutsHelp";

// ---------------------------------------------------------------------------
// LogoBlock — left column of the topbar (w-1/6). FRAME wordmark + product
// label. On mobile, includes the left-sheet open button.
// ---------------------------------------------------------------------------

export function LogoBlock({ onOpenLeft }: { onOpenLeft?: () => void }) {
  return (
    <div className="w-1/6 flex items-center gap-2 px-3 border-r border-gray-200 dark:border-gray-800 min-w-0">
      {onOpenLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 md:hidden"
          onClick={onOpenLeft}
          aria-label="Open components"
        >
          <PanelLeft className="size-4" />
        </Button>
      )}
      <span className="font-mono text-sm font-semibold tracking-wider text-zinc-900 dark:text-zinc-100 select-none">
        FRAME
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hidden lg:inline">
        UI Builder
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TopbarCenter — middle column (w-4/6). Editable document name + undo/redo
// + theme menu + shortcuts help. Centered horizontally with `gap`.
// ---------------------------------------------------------------------------

export function TopbarCenter() {
  const activeDoc = useActiveDocument();
  const pastLen = useFrameStore((s) => s.past.length);
  const futureLen = useFrameStore((s) => s.future.length);
  const renameDocument = useFrameStore((s) => s.renameDocument);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.select();
  }, [editingName]);

  const commitName = () => {
    if (activeDoc && nameDraft.trim()) {
      renameDocument(activeDoc.id, nameDraft.trim());
    }
    setEditingName(false);
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="w-4/6 flex items-center justify-center gap-2 px-3 min-w-0">
        {activeDoc && (
          <>
            {editingName ? (
              <Input
                ref={nameRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="h-7 w-32 sm:w-48 text-sm font-medium"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(activeDoc.name);
                  setEditingName(true);
                }}
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4 decoration-zinc-400 rounded px-2 py-1 truncate max-w-32 sm:max-w-48 text-left"
                title="Click to rename"
              >
                {activeDoc.name}
              </button>
            )}
          </>
        )}

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 disabled:opacity-40"
                onClick={() => useFrameStore.getState().undo()}
                disabled={pastLen === 0}
                aria-label="Undo"
              >
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Undo (Ctrl+Z) · {pastLen}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 disabled:opacity-40"
                onClick={() => useFrameStore.getState().redo()}
                disabled={futureLen === 0}
                aria-label="Redo"
              >
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Redo (Ctrl+Shift+Z) · {futureLen}
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 bg-zinc-200 dark:bg-zinc-800" />

        <ThemeMenu />
        <ShortcutsHelp />
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// LoadSaveExportBlock — right column (w-1/6). New / Load (JSON file) / Save /
// Export (Code dialog). Compact icon buttons. On mobile, includes the
// right-sheet open button.
// ---------------------------------------------------------------------------

export function LoadSaveExportBlock({
  onOpenCode,
  onOpenRight,
}: {
  onOpenCode: () => void;
  onOpenRight?: () => void;
}) {
  const newDocument = useFrameStore((s) => s.newDocument);
  const forceSave = useFrameStore((s) => s.forceSave);
  const importJSON = useFrameStore((s) => s.importJSON);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importJSON(String(reader.result));
        toast.success("Imported document");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="w-1/6 flex items-center justify-end gap-1 px-2 border-l border-gray-200 dark:border-gray-800 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              onClick={() => newDocument()}
              aria-label="New document"
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            New document
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <label className="cursor-pointer">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 pointer-events-none text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                asChild
              >
                <span>
                  <Upload className="size-4" />
                </span>
              </Button>
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Load JSON
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="size-8 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={() => forceSave()}
              aria-label="Save"
            >
              <Save className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Save (Ctrl+S)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              onClick={onOpenCode}
              aria-label="Export code"
            >
              <Code2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Export code
          </TooltipContent>
        </Tooltip>

        {onOpenRight && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 md:hidden"
            onClick={onOpenRight}
            aria-label="Open properties"
          >
            <PanelRight className="size-4" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
