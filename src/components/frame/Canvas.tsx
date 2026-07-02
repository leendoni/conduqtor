"use client";

import { useState } from "react";
import { PackageOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFrameStore, useTree } from "@/lib/frame/store";
import { NodeRenderer } from "./NodeRenderer";
import { AlignmentToolbar } from "./AlignmentToolbar";
import { SelectionContext } from "./NodeWrapper";
import { MIME_KEY, MIME_NODE_ID, readDragPayload } from "./dnd";

/**
 * Canvas — the live render surface.
 * Renders the active document's tree via <NodeRenderer> on a plain flat
 * background (bg-background — white in light, zinc-950 in dark). The whole
 * canvas is also a root-level drop target. No dot-grid, no page card.
 *
 * Provides a SelectionContext (Task ID 9 Part E) so NodeWrappers can dim
 * themselves when something else on the canvas is selected.
 */
export function Canvas() {
  const tree = useTree();
  const selectedIds = useFrameStore((s) => s.selectedIds);
  const clearSelection = useFrameStore((s) => s.clearSelection);
  const insertNode = useFrameStore((s) => s.insertNode);
  const moveNode = useFrameStore((s) => s.moveNode);

  const [rootHover, setRootHover] = useState(false);

  const isEmpty = tree.children.length === 0;
  const hasSelection = selectedIds.length > 0;

  const handleDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types.includes(MIME_KEY) && !types.includes(MIME_NODE_ID)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = types.includes(MIME_KEY) ? "copy" : "move";
    setRootHover(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) setRootHover(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    const payload = readDragPayload(e);
    if (!payload) return;
    e.preventDefault();
    setRootHover(false);
    if (payload.kind === "key") {
      insertNode(null, payload.payload);
    } else {
      // move to end of root
      moveNode(payload.payload, null, tree.children.length);
    }
  };

  return (
    <SelectionContext.Provider value={{ hasSelection }}>
      <div
        className={cn(
          "relative h-full overflow-auto bg-background frame-scroll",
          rootHover && "ring-1 ring-inset ring-blue-500/30",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
      >
        {/* Alignment toolbar appears when 2+ nodes selected */}
        {selectedIds.length >= 2 && <AlignmentToolbar />}

        <div className="min-h-full w-full p-8">
          {isEmpty ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3 py-24 px-6 text-center",
                "mx-auto max-w-xl rounded-lg border border-dashed",
                "border-zinc-300 dark:border-zinc-700",
                rootHover && "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20",
              )}
            >
              <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-zinc-400">
                <PackageOpen className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Empty canvas
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Drag a component here, or double-click one in the palette.
                </p>
              </div>
            </div>
          ) : (
            <NodeRenderer node={tree} />
          )}
        </div>
      </div>
    </SelectionContext.Provider>
  );
}
