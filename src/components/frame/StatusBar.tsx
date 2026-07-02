"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useFrameStore, useActiveDocument, useTree } from "@/lib/frame/store";

/** Returns a relative-time string with a 1s tick. */
function useRelativeTime(ts: number | null): string {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!ts) return "never";
  const diff = Date.now() - ts;
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

/** Count all nodes in the tree (excluding root). */
function countNodes(node: { children: any[] }): number {
  let n = 0;
  for (const c of node.children) {
    n += 1 + countNodes(c);
  }
  return n;
}

export function StatusBar() {
  const saveStatus = useFrameStore((s) => s.saveStatus);
  const lastSavedAt = useFrameStore((s) => s.lastSavedAt);
  const selectedIds = useFrameStore((s) => s.selectedIds);
  const tree = useTree();
  const activeDoc = useActiveDocument();

  const rel = useRelativeTime(saveStatus === "saving" ? null : lastSavedAt);
  const nodeCount = countNodes(tree);
  const theme = activeDoc?.theme ?? "light";
  const accent = activeDoc?.accent ?? "zinc";

  return (
    <footer className="shrink-0 h-8 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center gap-3 px-4 text-xs font-mono text-zinc-500 tabular-nums">
      <span
        className={cn(
          "size-1.5 rounded-full",
          saveStatus === "saving"
            ? "bg-amber-500 animate-pulse"
            : saveStatus === "saved"
              ? "bg-emerald-500"
              : "bg-zinc-400",
        )}
      />
      <span className="text-zinc-900 dark:text-zinc-100">
        {saveStatus === "saving" ? "Saving…" : `Saved ${rel}`}
      </span>
      <Sep />
      <span>{selectedIds.length} selected</span>
      <Sep />
      <span>{nodeCount} nodes</span>
      <Sep />
      <span>theme {theme}</span>
      <Sep />
      <span>accent {accent}</span>
      <span className="ml-auto">zoom 100%</span>
    </footer>
  );
}

function Sep() {
  return <span className="text-zinc-300 dark:text-zinc-700">·</span>;
}
