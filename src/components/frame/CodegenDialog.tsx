"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFrameStore, useActiveDocument } from "@/lib/frame/store";
import { generateJSON, generateSvelte } from "@/lib/frame/codegen";

export function CodegenDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const activeDoc = useActiveDocument();
  const [tab, setTab] = useState<"svelte" | "json">("svelte");

  const svelte = useMemo(() => (activeDoc ? generateSvelte(activeDoc) : ""), [activeDoc]);
  const json = useMemo(() => (activeDoc ? generateJSON(activeDoc) : ""), [activeDoc]);

  const copy = (text: string, kind: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${kind} copied`))
      .catch(() => toast.error("Copy failed"));
  };

  const download = (text: string, filename: string, kind: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${kind} downloaded`);
  };

  const safeName = (activeDoc?.name ?? "frame")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase() || "frame";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col shadow-float" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Code · <span className="font-mono text-xs text-zinc-500">{activeDoc?.name ?? "—"}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "svelte" | "json")} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <TabsList className="bg-transparent p-0 h-auto gap-3">
              <TabsTrigger
                value="svelte"
                className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-900 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100 dark:text-zinc-400 px-0 py-1.5"
              >
                Svelte
              </TabsTrigger>
              <TabsTrigger
                value="json"
                className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-900 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100 dark:text-zinc-400 px-0 py-1.5"
              >
                JSON
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                onClick={() => copy(tab === "svelte" ? svelte : json, tab)}
              >
                <Copy className="size-3" />
                Copy
              </Button>
              {tab === "svelte" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  onClick={() => download(svelte, `${safeName}.svelte`, "Svelte")}
                >
                  <Download className="size-3" />
                  .svelte
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  onClick={() => download(json, `${safeName}.json`, "JSON")}
                >
                  <Download className="size-3" />
                  .json
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="svelte" className="flex-1 mt-3 overflow-hidden">
            <ScrollArea className="h-full rounded-md border border-zinc-800 bg-zinc-950">
              <SyntaxHighlighter
                language="markup"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  fontSize: "12px",
                  background: "transparent",
                  color: "#e4e4e7",
                }}
                wrapLongLines
              >
                {svelte}
              </SyntaxHighlighter>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="json" className="flex-1 mt-3 overflow-hidden">
            <ScrollArea className="h-full rounded-md border border-zinc-800 bg-zinc-950">
              <SyntaxHighlighter
                language="json"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  fontSize: "12px",
                  background: "transparent",
                  color: "#e4e4e7",
                }}
                wrapLongLines
              >
                {json}
              </SyntaxHighlighter>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
