"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Search, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFrameStore } from "@/lib/frame/store";
import { COMPONENTS } from "@/lib/frame/registry";
import type { FrameNode, PropGroup, PropSchema } from "@/lib/frame/types";
import { DynamicIcon } from "./icons";
import { PropField } from "./PropField";

const GROUP_ORDER: PropGroup[] = ["content", "appearance", "state", "advanced"];
const GROUP_LABELS: Record<PropGroup, string> = {
  content: "Content",
  appearance: "Appearance",
  state: "State",
  advanced: "Advanced",
};
const DEFAULT_OPEN: Record<PropGroup, boolean> = {
  content: true,
  appearance: true,
  state: false,
  advanced: false,
};

export function PropertiesPanel() {
  const selectedIds = useFrameStore((s) => s.selectedIds);
  const findNode = useFrameStore((s) => s.findNode);
  const [query, setQuery] = useState("");

  const singleId = selectedIds.length === 1 ? selectedIds[0] : null;
  const node = singleId ? findNode(singleId) : null;

  if (selectedIds.length === 0) {
    return (
      <PanelShell title="Properties">
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-zinc-400">
            <Search className="size-4" />
          </div>
          <p className="text-sm text-zinc-500">
            Select a component to edit its props.
          </p>
        </div>
      </PanelShell>
    );
  }

  if (selectedIds.length > 1 || !node) {
    return <MultiSelectPanel count={selectedIds.length} ids={selectedIds} />;
  }

  const schema = COMPONENTS[node.component];
  if (!schema) {
    return (
      <PanelShell title="Properties">
        <p className="p-4 text-xs text-zinc-500">Unknown component: {node.component}</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title={schema.name}
      subtitle={node.component}
      icon={<DynamicIcon name={schema.icon} className="size-4 text-zinc-500" />}
    >
      <PropsBody node={node} query={query} setQuery={setQuery} />
    </PanelShell>
  );
}

function PanelShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-3 h-10 shrink-0">
        {icon}
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {title}
        </span>
        {subtitle && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="text-xs font-mono text-zinc-500 truncate">{subtitle}</span>
          </>
        )}
      </div>
      {children}
    </div>
  );
}

function PropsBody({
  node,
  query,
  setQuery,
}: {
  node: FrameNode;
  query: string;
  setQuery: (s: string) => void;
}) {
  const schema = COMPONENTS[node.component];
  const setNodeVariant = useFrameStore((s) => s.setNodeVariant);
  const updateNodeProps = useFrameStore((s) => s.updateNodeProps);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const g of GROUP_ORDER) m[g] = DEFAULT_OPEN[g];
    return m;
  });

  const variantProp = schema.props.find((p) => p.key === "variant");

  const grouped = useMemo(() => {
    const map: Record<PropGroup, PropSchema[]> = {
      content: [],
      appearance: [],
      state: [],
      advanced: [],
    };
    const q = query.trim().toLowerCase();
    for (const p of schema.props) {
      if (q && !p.label.toLowerCase().includes(q) && !p.key.toLowerCase().includes(q)) continue;
      map[p.group].push(p);
    }
    return map;
  }, [schema, query]);

  const searching = query.trim() !== "";

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search props…"
            className="h-9 pl-8 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 placeholder:text-zinc-400"
          />
        </div>

        {/* Variant + skeleton — top card (single-line rows) */}
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-2 bg-zinc-50/60 dark:bg-zinc-900/40">
          {variantProp && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">
                Variant
              </span>
              <Select
                value={String(node.props.variant ?? "")}
                onValueChange={(v) => updateNodeProps(node.id, { variant: v })}
              >
                <SelectTrigger className="h-8 text-sm w-40 shrink-0 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {variantProp.options?.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">
              Show as skeleton
            </span>
            <Switch
              checked={node.variant === "skeleton"}
              onCheckedChange={(v) => setNodeVariant(node.id, v ? "skeleton" : "normal")}
              aria-label="Show as skeleton"
            />
          </div>
        </div>

        {/* Props by group */}
        {searching ? (
          <div className="space-y-1">
            <p className="eyebrow px-1">
              {Object.values(grouped).flat().length} match
              {Object.values(grouped).flat().length === 1 ? "" : "es"}
            </p>
            {Object.values(grouped).flat().length === 0 && (
              <p className="text-xs text-zinc-500 p-2">No props match.</p>
            )}
            <div className="space-y-1">
              {Object.values(grouped).flat().map((p) => (
                <PropField key={p.key} node={node} schema={p} />
              ))}
            </div>
          </div>
        ) : (
          GROUP_ORDER.map((g) => {
            const props = grouped[g];
            if (props.length === 0) return null;
            const open = openMap[g];
            return (
              <Collapsible
                key={g}
                open={open}
                onOpenChange={() => setOpenMap((m) => ({ ...m, [g]: !m[g] }))}
                className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="group w-full flex items-center gap-1.5 px-1 pt-3 pb-2 text-left hover:opacity-80 transition-opacity"
                  >
                    {open ? (
                      <ChevronDown className="size-3 text-zinc-400" />
                    ) : (
                      <ChevronRight className="size-3 text-zinc-400" />
                    )}
                    <span className="eyebrow">{GROUP_LABELS[g]}</span>
                    <span className="ml-auto text-[10px] font-mono text-zinc-400 tabular-nums">
                      {props.length}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-1 pb-3 space-y-1">
                    {props.map((p) => (
                      <PropField key={p.key} node={node} schema={p} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}

function MultiSelectPanel({ count, ids }: { count: number; ids: string[] }) {
  const removeNodes = useFrameStore((s) => s.removeNodes);
  const duplicateNodes = useFrameStore((s) => s.duplicateNodes);
  const group = useFrameStore((s) => s.group);
  const ungroup = useFrameStore((s) => s.ungroup);
  const findNode = useFrameStore((s) => s.findNode);

  const firstIsGroup = ids.length === 1 && findNode(ids[0])?.component === "flex-col";

  return (
    <PanelShell title={`${count} selected`} subtitle="batch">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <p className="text-xs text-zinc-500">
            Batch actions apply to all {count} selected nodes.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            onClick={() => duplicateNodes(ids)}
          >
            <Copy className="size-3.5" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 bg-white dark:bg-zinc-950"
            onClick={() => removeNodes(ids)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
          {count >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => group(ids)}
            >
              <ChevronRight className="size-3.5" />
              Group
            </Button>
          )}
          {firstIsGroup && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => ungroup(ids[0])}
            >
              <ChevronDown className="size-3.5" />
              Ungroup
            </Button>
          )}
        </div>
      </ScrollArea>
    </PanelShell>
  );
}
