"use client";

import {
  AlignCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  Copy,
  Group,
  Trash2,
  Ungroup,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFrameStore } from "@/lib/frame/store";

/**
 * AlignmentToolbar — floating bar shown at the top of the canvas when 2+
 * nodes are selected. Provides align/distribute/delete/duplicate/group ops.
 *
 * NOTE: the canvas uses flow layout, so true pixel alignment isn't applicable.
 * We implement alignment by setting the common parent's flex justify/items
 * classes. Distribute = justify-between/around. Buttons are disabled (with a
 * tooltip) when the selected nodes don't share a single parent.
 */
export function AlignmentToolbar() {
  const selectedIds = useFrameStore((s) => s.selectedIds);
  const findParent = useFrameStore((s) => s.findParent);
  const findNode = useFrameStore((s) => s.findNode);
  const getTree = useFrameStore((s) => s.getTree);
  const updateNodeProps = useFrameStore((s) => s.updateNodeProps);
  const removeNodes = useFrameStore((s) => s.removeNodes);
  const duplicateNodes = useFrameStore((s) => s.duplicateNodes);
  const group = useFrameStore((s) => s.group);
  const ungroup = useFrameStore((s) => s.ungroup);

  // Determine if all selected share a common parent.
  const parents = selectedIds.map((id) => findParent(id)?.id ?? "__root__");
  const commonParentId = parents[0];
  const sameParent = parents.every((p) => p === commonParentId);
  const commonParent = sameParent
    ? commonParentId === "__root__"
      ? getTree()
      : findParent(selectedIds[0])
    : null;

  // Ungroup is enabled when exactly one flex-col container is selected
  // (group() creates flex-col nodes, but a user-made flex-col also qualifies).
  const isGroupSelected =
    selectedIds.length === 1 && findNode(selectedIds[0])?.component === "flex-col";

  const setParentClass = (cls: string) => {
    if (!commonParent) return;
    updateNodeProps(commonParent.id, { className: cls });
  };

  const alignLeft = () => setParentClass("flex flex-row justify-start items-center gap-4");
  const alignCenterH = () => setParentClass("flex flex-row justify-center items-center gap-4");
  const alignRight = () => setParentClass("flex flex-row justify-end items-center gap-4");
  const alignTop = () => setParentClass("flex flex-col justify-start items-start gap-4");
  const alignMiddle = () => setParentClass("flex flex-col justify-center items-center gap-4");
  const alignBottom = () => setParentClass("flex flex-col justify-end items-end gap-4");
  const distributeH = () => setParentClass("flex flex-row justify-between items-center gap-4");
  const distributeV = () => setParentClass("flex flex-col justify-between items-center gap-4");

  const handleDelete = () => removeNodes(selectedIds);
  const handleDuplicate = () => duplicateNodes(selectedIds);
  const handleGroup = () => {
    const gid = group(selectedIds);
    if (!gid) toast.error("Group requires siblings sharing one parent");
    else toast.success("Grouped");
  };
  const handleUngroup = () => {
    if (selectedIds.length === 1) ungroup(selectedIds[0]);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="sticky top-3 z-40 mx-auto flex w-fit items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-float">
        <ToolbarButton
          label="Align left"
          disabled={!sameParent}
          onClick={alignLeft}
        >
          <AlignStartVertical className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center (horizontal)"
          disabled={!sameParent}
          onClick={alignCenterH}
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          disabled={!sameParent}
          onClick={alignRight}
        >
          <AlignEndVertical className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Distribute horizontally"
          disabled={!sameParent}
          onClick={distributeH}
        >
          <AlignHorizontalDistributeCenter className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

        <ToolbarButton
          label="Align top"
          disabled={!sameParent}
          onClick={alignTop}
        >
          <AlignStartHorizontal className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align middle (vertical)"
          disabled={!sameParent}
          onClick={alignMiddle}
        >
          <AlignVerticalDistributeCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align bottom"
          disabled={!sameParent}
          onClick={alignBottom}
        >
          <AlignEndHorizontal className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Distribute vertically"
          disabled={!sameParent}
          onClick={distributeV}
        >
          <AlignVerticalDistributeCenter className="size-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

        <ToolbarButton label="Group (Ctrl+G)" onClick={handleGroup} disabled={selectedIds.length < 2}>
          <Group className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Ungroup (Ctrl+Shift+G)" onClick={handleUngroup} disabled={!isGroupSelected}>
          <Ungroup className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Duplicate (Ctrl+D)" onClick={handleDuplicate}>
          <Copy className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Delete (Del)" onClick={handleDelete} destructive>
          <Trash2 className="size-4" />
        </ToolbarButton>

        <span className="ml-2 mr-1 text-xs font-mono text-zinc-500 tabular-nums">
          {selectedIds.length} selected
        </span>
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-8 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
            destructive && "text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40",
          )}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
        {disabled && label !== "Ungroup (Ctrl+Shift+G)" && " (needs same parent)"}
      </TooltipContent>
    </Tooltip>
  );
}
