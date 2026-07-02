"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFrameStore } from "@/lib/frame/store";
import type { FrameNode, PropSchema, PropValue } from "@/lib/frame/types";
import { IconPicker } from "./IconPicker";

/**
 * PropField — renders one editable prop input based on its PropSchema type.
 * On change → updateNodeProps(id, { [key]: value }).
 *
 * Single-line layout (Task 6): label on the LEFT, control on the RIGHT.
 *  - text/number/select/color/icon/boolean → `flex items-center justify-between gap-3`
 *  - textarea → two-line (label above, full-width control below) — multi-line control
 *  - label: text-xs font-medium text-zinc-600 truncate
 *  - control: sized (h-8, w-40 for text/select, w-20 for number, switch, swatch+input for color)
 */
export function PropField({ node, schema }: { node: FrameNode; schema: PropSchema }) {
  const updateNodeProps = useFrameStore((s) => s.updateNodeProps);
  const value = node.props[schema.key];

  const set = (v: PropValue) => updateNodeProps(node.id, { [schema.key]: v });

  const isMono = schema.key === "id" || schema.key === "name" || schema.key === "className";
  const isTextarea = schema.type === "textarea";

  return (
    <div
      className={cn(
        "py-1",
        isTextarea ? "grid gap-1" : "flex items-center justify-between gap-3",
      )}
    >
      <Label
        htmlFor={`prop-${node.id}-${schema.key}`}
        className={cn(
          "text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate",
          isMono && "font-mono",
          !isTextarea && "min-w-0",
        )}
      >
        {schema.label}
      </Label>
      <div
        className={cn(
          "min-w-0",
          !isTextarea && "shrink-0 max-w-[60%] flex justify-end items-center",
        )}
      >
        {renderControl(schema, value, set, node.id)}
        {schema.help && (
          <p className="mt-0.5 text-[10px] text-zinc-500">{schema.help}</p>
        )}
      </div>
    </div>
  );
}

function renderControl(
  schema: PropSchema,
  value: PropValue,
  set: (v: PropValue) => void,
  nodeId: string,
) {
  const id = `prop-${nodeId}-${schema.key}`;
  switch (schema.type) {
    case "text":
      return (
        <Input
          id={id}
          value={value == null ? "" : String(value)}
          onChange={(e) => set(e.target.value)}
          className="h-8 w-40 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          placeholder={schema.placeholder}
        />
      );
    case "textarea":
      return (
        <Textarea
          id={id}
          value={value == null ? "" : String(value)}
          onChange={(e) => set(e.target.value)}
          className="text-xs min-h-20 resize-y bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          placeholder={schema.placeholder}
        />
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          value={value == null ? "" : Number(value)}
          onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))}
          className="h-8 w-20 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        />
      );
    case "boolean": {
      // Switch toggle (Task 6: reverted from yes/no ToggleGroup)
      const isOn = value === true || value === "true";
      return (
        <Switch
          id={id}
          checked={isOn}
          onCheckedChange={(v) => set(v)}
          aria-label={schema.label}
        />
      );
    }
    case "select":
      return (
        <Select value={value == null ? "" : String(value)} onValueChange={(v) => set(v)}>
          <SelectTrigger id={id} className="h-8 text-sm w-40 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {schema.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "color":
      return (
        <div className="flex items-center gap-1.5 w-40">
          <input
            id={id}
            type="color"
            value={value == null ? "#000000" : String(value)}
            onChange={(e) => set(e.target.value)}
            className="size-8 rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer p-1 bg-transparent shrink-0"
          />
          <Input
            value={value == null ? "" : String(value)}
            onChange={(e) => set(e.target.value)}
            className="h-8 text-sm font-mono text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 min-w-0 flex-1"
          />
        </div>
      );
    case "icon":
      return (
        <div className="w-40">
          <IconPicker value={value == null ? "" : String(value)} onChange={(v) => set(v)} />
        </div>
      );
    default:
      return null;
  }
}

/** A small "reset to default" button — nice-to-have. */
export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="size-5 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      onClick={onClick}
      aria-label="Reset to default"
      type="button"
    >
      ↺
    </Button>
  );
}
