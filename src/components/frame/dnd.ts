/**
 * FRAME — drag-and-drop helpers + constants.
 *
 * Two drag flavors are used (native HTML5 DnD):
 *   - `application/x-frame-key`     palette → canvas (copy a fresh node)
 *   - `application/x-frame-node-id`  canvas/layers → canvas/layers (move)
 *
 * The whole wrapper accepts drops. The drop *position* (before / after /
 * inside) is computed from the cursor Y relative to the wrapper's height.
 */

import type { DragEvent } from "react";

export const MIME_KEY = "application/x-frame-key";
export const MIME_NODE_ID = "application/x-frame-node-id";

export type DropPosition = "before" | "after" | "inside";

/**
 * Read which flavor is being dragged. Returns `{ kind, payload }` or null.
 */
export function readDragPayload(
  e: DragEvent | React.DragEvent,
): { kind: "key"; payload: string } | { kind: "node"; payload: string } | null {
  const key = e.dataTransfer?.getData(MIME_KEY);
  if (key) return { kind: "key", payload: key };
  const id = e.dataTransfer?.getData(MIME_NODE_ID);
  if (id) return { kind: "node", payload: id };
  return null;
}

/** True if the drag event carries either FRAME flavor. */
export function isFrameDrag(e: DragEvent | React.DragEvent): boolean {
  return readDragPayload(e) !== null;
}

/**
 * Compute the drop position from the cursor Y within the target element.
 * - top 30% → "before"
 * - bottom 30% → "after"
 * - middle 40% → "inside" (if the target accepts children, else "before"/"after")
 */
export function computeDropPosition(
  clientY: number,
  rect: DOMRect,
  acceptsChildren: boolean,
): DropPosition {
  const y = clientY - rect.top;
  const h = rect.height;
  if (h === 0) return "after";
  const ratio = y / h;
  if (ratio < 0.3) return "before";
  if (ratio > 0.7) return "after";
  if (acceptsChildren) return "inside";
  return ratio < 0.5 ? "before" : "after";
}

/** Helper: parse a multi-line textarea into trimmed non-empty lines. */
export function splitLines(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
