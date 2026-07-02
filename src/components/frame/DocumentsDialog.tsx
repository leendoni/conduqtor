"use client";

import { useState } from "react";
import {
  Check,
  Download,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useFrameStore } from "@/lib/frame/store";
import { generateJSON } from "@/lib/frame/codegen";
import type { FrameDocument } from "@/lib/frame/types";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function DocumentsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const documents = useFrameStore((s) => s.documents);
  const activeDocumentId = useFrameStore((s) => s.activeDocumentId);
  const newDocument = useFrameStore((s) => s.newDocument);
  const switchDocument = useFrameStore((s) => s.switchDocument);
  const deleteDocument = useFrameStore((s) => s.deleteDocument);
  const renameDocument = useFrameStore((s) => s.renameDocument);
  const importJSON = useFrameStore((s) => s.importJSON);
  const getActiveDocument = useFrameStore((s) => s.getActiveDocument);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...documents].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleExport = () => {
    const doc = getActiveDocument();
    if (!doc) return;
    const blob = new Blob([generateJSON(doc)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frame-${doc.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported JSON");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importJSON(String(reader.result));
        toast.success("Imported document");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const startEdit = (doc: FrameDocument) => {
    setEditingId(doc.id);
    setEditName(doc.name);
  };

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      renameDocument(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg shadow-float" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Documents
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Manage your FRAME documents. Switch, rename, delete, import or export.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              newDocument();
              toast.success("New document created");
            }}
            className="gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="size-3.5" />
            New
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="gap-1.5 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Download className="size-3.5" />
            Export JSON
          </Button>
          <label className="cursor-pointer">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 pointer-events-none bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              asChild
            >
              <span>
                <Upload className="size-3.5" />
                Import JSON
              </span>
            </Button>
            <input type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
          </label>
        </div>

        <ScrollArea className="h-72 pr-2">
          <div className="space-y-1">
            {sorted.map((doc) => {
              const isActive = doc.id === activeDocumentId;
              const isEditing = editingId === doc.id;
              const isConfirming = confirmDeleteId === doc.id;
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2 bg-white dark:bg-zinc-950",
                    isActive
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900",
                  )}
                >
                  <FileText className="size-4 text-zinc-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-7 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] truncate font-medium text-zinc-900 dark:text-zinc-100">{doc.name}</span>
                        {isActive && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] h-4 px-1 font-mono bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-500 font-mono">Saved {relativeTime(doc.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {isConfirming ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          onClick={() => {
                            deleteDocument(doc.id);
                            setConfirmDeleteId(null);
                            toast.success("Document deleted");
                          }}
                          aria-label="Confirm delete"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                          onClick={() => setConfirmDeleteId(null)}
                          aria-label="Cancel"
                        >
                          <span className="text-xs">×</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                          onClick={() => startEdit(doc)}
                          aria-label="Rename"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:bg-red-950/40"
                          onClick={() => setConfirmDeleteId(doc.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            onClick={() => {
                              switchDocument(doc.id);
                              onOpenChange(false);
                            }}
                          >
                            <FolderOpen className="size-3" />
                            Open
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <p className="text-xs text-zinc-500 p-4 text-center">No documents.</p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
