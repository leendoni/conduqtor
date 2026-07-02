"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFrameStore, useTree } from "@/lib/frame/store";
import { COMPONENTS } from "@/lib/frame/registry";
import type { FrameNode } from "@/lib/frame/types";
import { DynamicIcon } from "./icons";
import { MIME_NODE_ID, computeDropPosition, readDragPayload, type DropPosition } from "./dnd";

/**
 * Layers — tree outline of the active document.
 * Recursive rows with depth indentation. Click = select, shift-click = toggle.
 * Drag reorder via native HTML5 (same flavor as canvas).
 *
 * Spec styling:
 *  - h-8 rows, 16px indent per level, 16px lucide icon text-zinc-500
 *  - name text-[13px] text-zinc-700
 *  - hover bg-zinc-50, selected bg-zinc-100 text-zinc-900
 *  - chevron for collapse
 *  - hover actions (duplicate/delete) as ghost icon buttons opacity-0 group-hover:opacity-100
 */
export function Layers() {
  const tree = useTree();
  return (
    <div className="h-full overflow-y-auto p-1.5 frame-scroll">
      <LayerRow node={tree} depth={0} />
    </div>
  );
}

function LayerRow({ node, depth }: { node: FrameNode; depth: number }) {
  const selectedIds = useFrameStore((s) => s.selectedIds);
  const select = useFrameStore((s) => s.select);
  const toggleSelect = useFrameStore((s) => s.toggleSelect);
  const duplicateNodes = useFrameStore((s) => s.duplicateNodes);
  const removeNodes = useFrameStore((s) => s.removeNodes);
  const findParent = useFrameStore((s) => s.findParent);
  const moveNode = useFrameStore((s) => s.moveNode);

  const [expanded, setExpanded] = useState(true);
  const [dropPos, setDropPos] = useState<DropPosition | null>(null);

  const isRoot = node.component === "root";
  const schema = isRoot ? null : COMPONENTS[node.component];
  const selected = !isRoot && selectedIds.includes(node.id);
  const hasChildren = node.children.length > 0;
  const acceptsChildren = isRoot || (schema?.acceptsChildren ?? false);

  const iconName = isRoot ? null : (schema?.icon ?? "Box");
  const label = isRoot ? "Root" : schema?.name ?? node.component;

  // Prop snippet for the row.
  const snippet = isRoot
    ? `${node.children.length} child${node.children.length === 1 ? "" : "ren"}`
    : (() => {
        const firstContent = schema?.props.find((p) => p.group === "content");
        if (!firstContent) return "";
        const v = node.props[firstContent.key];
        if (v == null || v === "") return "";
        const s = String(v);
        return s.length > 24 ? s.slice(0, 24) + "…" : s;
      })();

  const handleDragStart = (e: React.DragEvent) => {
    if (isRoot) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(MIME_NODE_ID, node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types.includes(MIME_NODE_ID)) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropPos(computeDropPosition(e.clientY, rect, acceptsChildren));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) setDropPos(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    const payload = readDragPayload(e);
    if (!payload || payload.kind !== "node") return;
    e.preventDefault();
    e.stopPropagation();
    setDropPos(null);
    const draggedId = payload.payload;
    if (draggedId === node.id) return;
    const parent = findParent(node.id);
    const parentId = parent ? parent.id : null;
    const siblings = parent ? parent.children : [];
    const myIndex = siblings.findIndex((c) => c.id === node.id);
    if (dropPos === "inside" && acceptsChildren) {
      moveNode(draggedId, node.id, node.children.length);
    } else if (dropPos === "before") {
      moveNode(draggedId, parentId, myIndex);
    } else if (dropPos === "after") {
      moveNode(draggedId, parentId, myIndex + 1);
    } else if (isRoot) {
      // drop on root → append
      moveNode(draggedId, null, node.children.length);
    }
  };

  return (
    <div>
      <div
        draggable={!isRoot}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          e.stopPropagation();
          if (isRoot) return;
          if (e.shiftKey) toggleSelect(node.id);
          else select([node.id]);
        }}
        className={cn(
          "group relative flex items-center gap-1 h-8 rounded-md pr-1 text-xs",
          "cursor-default select-none",
          !isRoot && "cursor-grab active:cursor-grabbing hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
          selected && "bg-zinc-100 text-zinc-900 font-medium dark:bg-zinc-800 dark:text-zinc-100",
          dropPos === "inside" && "ring-2 ring-blue-500",
        )}
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        {dropPos === "before" && (
          <div className="absolute left-1 right-1 -top-px h-0.5 bg-blue-500 rounded-full" />
        )}

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 shrink-0 grid place-items-center size-4"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {iconName && (
          <DynamicIcon name={iconName} className="size-3.5 shrink-0 text-zinc-500" />
        )}

        <span className="truncate flex-1 text-[13px] text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        {node.variant === "skeleton" && (
          <span className="text-[9px] uppercase tracking-wide text-amber-600 dark:text-amber-500 font-mono">
            skel
          </span>
        )}
        {snippet && (
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-24">
            {snippet}
          </span>
        )}

        {!isRoot && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              onClick={(e) => {
                e.stopPropagation();
                duplicateNodes([node.id]);
              }}
              aria-label="Duplicate"
            >
              <Copy className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={(e) => {
                e.stopPropagation();
                removeNodes([node.id]);
              }}
              aria-label="Delete"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((c) => (
            <LayerRow key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}

      {dropPos === "after" && (
        <div
          className="h-0.5 bg-blue-500 rounded-full mx-1"
          style={{ marginLeft: depth * 16 + 4 }}
        />
      )}
    </div>
  );
}
