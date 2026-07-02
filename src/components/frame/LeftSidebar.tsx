"use client";

import { Layers as LayersIcon, LayoutGrid } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette } from "./Palette";
import { Layers } from "./Layers";

/**
 * LeftSidebar — tabs: Components | Layers.
 * Underline tab style. Used inside the desktop left column and the mobile Sheet.
 */
export function LeftSidebar() {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      <Tabs defaultValue="components" className="flex h-full flex-col gap-0">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-zinc-200 dark:border-zinc-800 bg-transparent h-9 p-0">
          <TabsTrigger
            value="components"
            className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-900 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <LayoutGrid className="size-3.5" />
            Components
          </TabsTrigger>
          <TabsTrigger
            value="layers"
            className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-900 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <LayersIcon className="size-3.5" />
            Layers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="components" className="flex-1 overflow-hidden mt-0">
          <Palette />
        </TabsContent>
        <TabsContent value="layers" className="flex-1 overflow-hidden mt-0">
          <Layers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
