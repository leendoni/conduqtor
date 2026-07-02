"use client";

import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFrameStore, useActiveDocument } from "@/lib/frame/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { applyTheme } from "./theme";
import { useShortcuts } from "./useShortcuts";
import { LogoBlock, TopbarCenter, LoadSaveExportBlock } from "./Topbar";
import { LeftSidebar } from "./LeftSidebar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { DocumentSwitcher } from "./DocumentSwitcher";
import { DocumentsDialog } from "./DocumentsDialog";
import { CodegenDialog } from "./CodegenDialog";

export function Builder() {
  // hydrate once on mount
  useEffect(() => {
    useFrameStore.getState().hydrate();
  }, []);

  // mount global shortcuts
  useShortcuts();

  const activeDoc = useActiveDocument();

  // apply theme + accent whenever the active doc's theme/accent changes
  useEffect(() => {
    if (!activeDoc) return;
    applyTheme(activeDoc.theme, activeDoc.accent);
  }, [activeDoc?.theme, activeDoc?.accent, activeDoc?.id]);

  const isMobile = useIsMobile();
  const [docsOpen, setDocsOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* ── Topbar row: h-16, three columns (LOGO | CENTER | LOAD-SAVE-EXPORT) ── */}
        <header className="flex flex-row justify-between h-16 border-b border-gray-200 dark:border-gray-800 w-full shrink-0">
          <LogoBlock onOpenLeft={isMobile ? () => setLeftOpen(true) : undefined} />
          <TopbarCenter />
          <LoadSaveExportBlock
            onOpenCode={() => setCodeOpen(true)}
            onOpenRight={isMobile ? () => setRightOpen(true) : undefined}
          />
        </header>

        {/* ── Body row: three columns (LEFT+SWITCHER | CANVAS+STATUSBAR | RIGHT) ── */}
        <main className="flex flex-row justify-between h-full overflow-hidden">
          {isMobile ? (
            // Mobile: just canvas + status bar; sidebars become Sheets.
            <div className="flex flex-col w-full overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <Canvas />
              </div>
              <StatusBar />
            </div>
          ) : (
            <>
              {/* Left sidebar column (w-1/6) with the DocumentSwitcher docked at its bottom */}
              <div className="flex flex-col justify-between w-1/6 border-r border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="h-full overflow-hidden">
                  <LeftSidebar />
                </div>
                <DocumentSwitcher onManage={() => setDocsOpen(true)} />
              </div>

              {/* Center column (w-4/6): canvas + h-8 status bar at the bottom of THIS column only */}
              <div className="flex flex-col w-4/6 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <Canvas />
                </div>
                <StatusBar />
              </div>

              {/* Right sidebar column (w-1/6) */}
              <div className="w-1/6 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
                <PropertiesPanel />
              </div>
            </>
          )}
        </main>

        {/* Mobile sidebars as sheets */}
        <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
          <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
            <SheetHeader className="sr-only">
              <SheetTitle>Components</SheetTitle>
            </SheetHeader>
            <LeftSidebar />
          </SheetContent>
        </Sheet>
        <Sheet open={rightOpen} onOpenChange={setRightOpen}>
          <SheetContent side="right" className="w-80 p-0" aria-describedby={undefined}>
            <SheetHeader className="sr-only">
              <SheetTitle>Properties</SheetTitle>
            </SheetHeader>
            <PropertiesPanel />
          </SheetContent>
        </Sheet>

        {/* Dialogs */}
        <DocumentsDialog open={docsOpen} onOpenChange={setDocsOpen} />
        <CodegenDialog open={codeOpen} onOpenChange={setCodeOpen} />
      </div>
    </TooltipProvider>
  );
}
