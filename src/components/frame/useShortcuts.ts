/**
 * FRAME — global keyboard shortcuts.
 *
 * Mounted once by the Builder. Ignores key events while the user is typing
 * into an input/textarea/contenteditable or interacting with an element
 * annotated `[data-shortcut-ignore]`.
 */

import { useEffect } from "react";
import { toast } from "sonner";

import { useFrameStore } from "@/lib/frame/store";

function isEditable(el: HTMLElement | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  if (el.closest("[data-shortcut-ignore]")) return true;
  // Radix popovers/dialogs sit inside portals — mark their triggers via role.
  if (el.closest('[role="combobox"]')) return true;
  return false;
}

export function useShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useFrameStore.getState();
      const target = e.target as HTMLElement | null;
      const mod = e.ctrlKey || e.metaKey;

      // Save (always allow, even in inputs — common UX expectation)
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        s.forceSave();
        toast.success("Saved");
        return;
      }

      if (isEditable(target)) return;

      // Undo / Redo
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
        return;
      }

      // Duplicate
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (s.selectedIds.length > 0) s.duplicateNodes(s.selectedIds);
        return;
      }

      // Group / Ungroup
      if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          if (s.selectedIds.length === 1) s.ungroup(s.selectedIds[0]);
        } else {
          if (s.selectedIds.length >= 2) s.group(s.selectedIds);
        }
        return;
      }

      // Copy / Paste
      if (mod && e.key.toLowerCase() === "c") {
        if (s.selectedIds.length > 0) {
          e.preventDefault();
          s.copy(s.selectedIds);
        }
        return;
      }
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        if (s.clipboard.length > 0) {
          // paste into selected container if exactly one is selected, else root
          const sel = s.selectedIds;
          const parentId = sel.length === 1 ? sel[0] : null;
          s.paste(parentId);
        }
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (s.selectedIds.length > 0) {
          e.preventDefault();
          s.removeNodes(s.selectedIds);
        }
        return;
      }

      // Escape
      if (e.key === "Escape") {
        s.clearSelection();
        return;
      }

      // Arrow reorder
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (s.selectedIds.length === 1) {
          e.preventDefault();
          const id = s.selectedIds[0];
          const parent = s.findParent(id);
          const parentId = parent ? parent.id : null;
          const siblings = parent ? parent.children : s.getTree().children;
          const idx = siblings.findIndex((c) => c.id === id);
          if (idx < 0) return;
          const dir = e.key === "ArrowUp" ? -1 : 1;
          s.reorderChild(parentId, idx, idx + dir);
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
