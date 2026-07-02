"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFrameStore } from "@/lib/frame/store";
import { COMPONENTS } from "@/lib/frame/registry";
import type { FrameNode } from "@/lib/frame/types";
import {
  MIME_KEY,
  MIME_NODE_ID,
  computeDropPosition,
  readDragPayload,
  type DropPosition,
} from "./dnd";

// ---------------------------------------------------------------------------
// SelectionContext — provides `hasSelection` to every NodeWrapper so it can
// dim itself when something else is selected on the canvas. The provider is
// mounted inside Canvas (Task ID 9 Part E).
// ---------------------------------------------------------------------------

export const SelectionContext = createContext<{ hasSelection: boolean }>({
  hasSelection: false,
});

/** Helper hook for consumers. */
export function useSelectionContext() {
  return useContext(SelectionContext);
}

/**
 * Wraps every rendered node. Handles:
 *  - click / shift-click selection
 *  - hover outline + selected outline + small tag label on top-left corner
 *  - drag handle (draggable) that sets the node-id drag flavor
 *  - drop target (palette key drops + existing-node moves) with before/after/inside indicators
 *  - opacity dimming of UNSELECTED nodes when at least one node is selected on the canvas
 *
 * Highlight style (Task ID 9 Part E):
 *  - selected → thin 1px solid zinc-400 outline + SMALL TAG chip at top-left
 *    corner showing the component name (text-[10px] font-medium, bg-zinc-900
 *    text-white in light / bg-zinc-100 text-zinc-900 in dark, compact pill
 *    NOT spanning the width). Positioned `absolute -top-2 left-2` slightly
 *    overlapping the top edge.
 *  - hover → outline outline-1 outline-zinc-300 (subtle)
 *  - drop indicator between siblings: bg-blue-500 h-0.5
 *  - container nest-hover: ring-2 ring-blue-400 ring-dashed
 *  - unselected when `hasSelection && !selected` → opacity-40 + transition
 *
 * The wrapper is a `relative` block element so it works as a flex/grid child.
 */
export function NodeWrapper({
  node,
  children,
}: {
  node: FrameNode;
  children: ReactNode;
}) {
  const selected = useFrameStore((s) => s.selectedIds.includes(node.id));
  const select = useFrameStore((s) => s.select);
  const toggleSelect = useFrameStore((s) => s.toggleSelect);
  const insertNode = useFrameStore((s) => s.insertNode);
  const moveNode = useFrameStore((s) => s.moveNode);
  const findParent = useFrameStore((s) => s.findParent);

  const { hasSelection } = useContext(SelectionContext);

  const [dropPos, setDropPos] = useState<DropPosition | null>(null);

  const schema = node.component === "root" ? null : COMPONENTS[node.component];
  const acceptsChildren =
    node.component === "root" ? true : (schema?.acceptsChildren ?? false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const types = e.dataTransfer.types;
    if (!types.includes(MIME_KEY) && !types.includes(MIME_NODE_ID)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = types.includes(MIME_KEY) ? "copy" : "move";
    const rect = e.currentTarget.getBoundingClientRect();
    setDropPos(computeDropPosition(e.clientY, rect, acceptsChildren));
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDropPos(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const payload = readDragPayload(e);
    if (!payload) return;
    e.preventDefault();
    e.stopPropagation();
    setDropPos(null);

    const parent = findParent(node.id);
    const parentId = parent ? parent.id : null;
    const siblings = parent ? parent.children : [];
    const myIndex = siblings.findIndex((c) => c.id === node.id);

    if (payload.kind === "key") {
      if (dropPos === "inside" && acceptsChildren) {
        insertNode(node.id, payload.payload);
      } else if (dropPos === "before") {
        insertNode(parentId, payload.payload, myIndex);
      } else {
        insertNode(parentId, payload.payload, myIndex + 1);
      }
    } else {
      const draggedId = payload.payload;
      if (draggedId === node.id) return;
      if (dropPos === "inside" && acceptsChildren) {
        moveNode(draggedId, node.id, node.children.length);
      } else if (dropPos === "before") {
        moveNode(draggedId, parentId, myIndex);
      } else {
        moveNode(draggedId, parentId, myIndex + 1);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) toggleSelect(node.id);
    else select([node.id]);
  };

  const handleHandleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData(MIME_NODE_ID, node.id);
    e.dataTransfer.effectAllowed = "move";
    const wrapper = e.currentTarget.parentElement;
    if (wrapper) {
      try {
        e.dataTransfer.setDragImage(wrapper, 0, 0);
      } catch {
        // ignore — some browsers don't allow custom drag images
      }
    }
  };

  // Dim unselected nodes when there is a selection on the canvas. Selected
  // nodes (and their descendants, by virtue of the selection set) keep full
  // opacity. We use `opacity` only — pointer events stay enabled so the
  // underlying inputs/controls remain interactive.
  const dimmed = hasSelection && !selected;

  return (
    <div
      className={cn(
        "group/node relative rounded-[inherit] transition-opacity duration-150",
        // subtle hover outline
        "hover:outline hover:outline-1 hover:outline-zinc-300 dark:hover:outline-zinc-600",
        // selected → thin gray outline (per reference image)
        selected && "outline outline-1 outline-zinc-400 dark:outline-zinc-500",
        // container nest-hover → dashed blue ring (functional drop indicator)
        dropPos === "inside" && "ring-2 ring-blue-400 ring-dashed",
        // dim when something else is selected
        dimmed && "opacity-40",
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-frame-node={node.id}
    >
      {dropPos === "before" && (
        <div className="pointer-events-none absolute -top-px left-0 right-0 h-0.5 rounded-full bg-blue-500 z-30" />
      )}
      {dropPos === "after" && (
        <div className="pointer-events-none absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-blue-500 z-30" />
      )}

      {selected && (
        <div
          className="pointer-events-none absolute -top-2 left-2 z-30 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
        >
          {schema?.name ?? node.component}
        </div>
      )}

      <button
        type="button"
        aria-label={`Drag ${schema?.name ?? node.component}`}
        draggable
        onDragStart={handleHandleDragStart}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-4 opacity-0 group-hover/node:opacity-100 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-opacity"
        data-shortcut-ignore
      >
        <GripVertical className="size-3.5" />
      </button>

      {children}
    </div>
  );
}
