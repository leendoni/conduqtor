/**
 * FRAME — Zustand store.
 *
 * One store, one source of truth. All tree mutations:
 *   1. deep-clone the active document (via `structuredClone`) so React sees fresh refs
 *   2. mutate the clone in place (helper tree functions)
 *   3. snapshot the *previous* active doc onto `past` (cap 50), clear `future`
 *
 * Persistence: localStorage key `"frame:documents"` holds `{ documents, activeDocumentId, version }`.
 * `hydrate()` loads it (or seeds a default doc) and installs a debounced autosave
 * subscription (~1.2s).
 *
 * Tree root: every document's `tree` is a `FrameNode` with `component: "root"`
 * (NOT in the registry). The root's `children` are the top-level page nodes.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";

import { generateJSON, parseJSON } from "./codegen";
import { createRootNode, newDocument } from "./defaults";
import { COMPONENTS, createNode } from "./registry";
import type {
  AccentName,
  FrameDocument,
  FrameNode,
  PropValue,
  ThemeName,
  Variant,
} from "./types";

// ---------------------------------------------------------------------------
// Constants & module-level singletons
// ---------------------------------------------------------------------------

const STORAGE_KEY = "frame:documents";
const HISTORY_LIMIT = 50;
const AUTOSAVE_DEBOUNCE_MS = 1200;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let hydrated = false;
let autosaveInstalled = false;

/** Stable fallback root used before hydration completes (avoids getServerSnapshot loop). */
const FALLBACK_ROOT = createRootNode();

// ---------------------------------------------------------------------------
// Tree helpers (operate on a single root, may mutate in place)
// ---------------------------------------------------------------------------

function findNodeInTree(root: FrameNode, id: string): FrameNode | null {
  if (root.id === id) return root;
  for (const c of root.children) {
    const f = findNodeInTree(c, id);
    if (f) return f;
  }
  return null;
}

function findParentInTree(root: FrameNode, id: string): FrameNode | null {
  for (const c of root.children) {
    if (c.id === id) return root;
    const f = findParentInTree(c, id);
    if (f) return f;
  }
  return null;
}

/** Remove the first node matching `id` from the tree (depth-first). Returns the removed node or null. Mutates. */
function removeNodeFromTree(root: FrameNode, id: string): FrameNode | null {
  const idx = root.children.findIndex((c) => c.id === id);
  if (idx >= 0) {
    return root.children.splice(idx, 1)[0];
  }
  for (const c of root.children) {
    const r = removeNodeFromTree(c, id);
    if (r) return r;
  }
  return null;
}

/** Deep-clone with fresh ids for every node (used by duplicate / paste). */
function cloneWithNewIds(node: FrameNode): FrameNode {
  // structuredClone is available in modern runtimes (Node 17+, all evergreen browsers)
  const copy = structuredClone(node);
  reassignIds(copy);
  return copy;
}

function reassignIds(node: FrameNode): void {
  node.id = nanoid10();
  node.children.forEach(reassignIds);
}

function nanoid10(): string {
  return nanoid(10);
}

/** Map a component key to its "primary text" prop key (first content-group prop, preferring text/title/value/label). */
function getPrimaryTextKey(componentKey: string): string | null {
  const schema = COMPONENTS[componentKey];
  if (!schema) return null;
  const contentProps = schema.props.filter((p) => p.group === "content");
  if (contentProps.length === 0) return null;
  const preferred = contentProps.find((p) =>
    ["text", "title", "value", "label", "triggerText", "name", "placeholder"].includes(p.key),
  );
  return (preferred ?? contentProps[0]).key;
}

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface FrameState {
  // documents
  documents: FrameDocument[];
  activeDocumentId: string | null;
  selectedIds: string[];
  clipboard: FrameNode[];

  // history (snapshots of entire active doc — tree + theme + accent)
  past: FrameDocument[];
  future: FrameDocument[];

  lastSavedAt: number | null;
  saveStatus: "idle" | "saving" | "saved";

  // derived getters
  getActiveDocument: () => FrameDocument | undefined;
  getTree: () => FrameNode;
  findNode: (id: string) => FrameNode | null;
  findParent: (id: string) => FrameNode | null;

  // document ops
  newDocument: (name?: string) => string;
  switchDocument: (id: string) => void;
  deleteDocument: (id: string) => void;
  renameDocument: (id: string, name: string) => void;

  // tree ops
  insertNode: (parentId: string | null, key: string, index?: number) => string;
  insertNodeAtRoot: (key: string) => string;
  removeNodes: (ids: string[]) => void;
  duplicateNodes: (ids: string[]) => string[];
  moveNode: (id: string, newParentId: string, index: number) => void;
  reorderChild: (parentId: string, fromIndex: number, toIndex: number) => void;
  updateNodeProps: (id: string, partial: Record<string, PropValue>) => void;
  setNodeVariant: (id: string, variant: Variant) => void;
  setNodeText: (id: string, text: string) => void;

  // selection
  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;

  // theme
  setTheme: (t: ThemeName) => void;
  setAccent: (a: AccentName) => void;

  // history
  undo: () => void;
  redo: () => void;

  // clipboard
  copy: (ids: string[]) => void;
  paste: (parentId: string | null, index?: number) => string[];

  // grouping
  group: (ids: string[]) => string | null;
  ungroup: (groupId: string) => void;

  // persistence
  hydrate: () => void;
  forceSave: () => void;
  exportJSON: () => string;
  importJSON: (raw: string) => void;
}

// ---------------------------------------------------------------------------
// Internal mutation helper
// ---------------------------------------------------------------------------

/**
 * Apply a mutation to the active document.
 * - deep-clones the active doc
 * - passes the clone to `mutator` which may mutate it in place and returns it
 * - pushes the previous snapshot to `past` (unless `history: false`)
 * - clears `future` (unless `history: false`)
 */
function mutateActiveDoc(
  set: (partial: Partial<FrameState>) => void,
  get: () => FrameState,
  mutator: (doc: FrameDocument) => FrameDocument,
  opts: { history?: boolean } = {},
): void {
  const useHistory = opts.history !== false;
  const state = get();
  const active = state.getActiveDocument();
  if (!active) return;
  const snapshot = useHistory ? structuredClone(active) : null;
  const next = mutator(structuredClone(active));
  next.updatedAt = Date.now();
  const past = snapshot
    ? [...state.past, snapshot].slice(-HISTORY_LIMIT)
    : state.past;
  set({
    documents: state.documents.map((d) => (d.id === next.id ? next : d)),
    past,
    future: useHistory ? [] : state.future,
  });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFrameStore = create<FrameState>((set, get) => ({
  documents: [],
  activeDocumentId: null,
  selectedIds: [],
  clipboard: [],
  past: [],
  future: [],
  lastSavedAt: null,
  saveStatus: "idle",

  // ── derived getters ────────────────────────────────────────────────────
  getActiveDocument: () => {
    const { documents, activeDocumentId } = get();
    return documents.find((d) => d.id === activeDocumentId);
  },

  getTree: () => {
    const doc = get().getActiveDocument();
    return doc?.tree ?? FALLBACK_ROOT;
  },

  findNode: (id) => {
    const tree = get().getTree();
    return findNodeInTree(tree, id);
  },

  findParent: (id) => {
    const tree = get().getTree();
    return findParentInTree(tree, id);
  },

  // ── document ops ───────────────────────────────────────────────────────
  newDocument: (name) => {
    const doc = newDocument(name);
    set((s) => ({
      documents: [...s.documents, doc],
      activeDocumentId: doc.id,
      selectedIds: [],
      past: [],
      future: [],
    }));
    return doc.id;
  },

  switchDocument: (id) => {
    const exists = get().documents.some((d) => d.id === id);
    if (!exists) return;
    set({ activeDocumentId: id, selectedIds: [], past: [], future: [] });
  },

  deleteDocument: (id) => {
    set((s) => {
      const docs = s.documents.filter((d) => d.id !== id);
      let activeId = s.activeDocumentId;
      if (activeId === id) {
        activeId = docs[0]?.id ?? null;
      }
      // If we deleted the last doc, create a fresh one.
      if (docs.length === 0) {
        const fresh = newDocument();
        return {
          documents: [fresh],
          activeDocumentId: fresh.id,
          selectedIds: [],
          past: [],
          future: [],
        };
      }
      return {
        documents: docs,
        activeDocumentId: activeId,
        selectedIds: [],
        past: [],
        future: [],
      };
    });
  },

  renameDocument: (id, name) => {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id ? { ...d, name, updatedAt: Date.now() } : d,
      ),
    }));
  },

  // ── tree ops ───────────────────────────────────────────────────────────
  insertNode: (parentId, key, index) => {
    const newNode = createNode(key);
    const newId = newNode.id;
    mutateActiveDoc(set, get, (doc) => {
      const parent = parentId === null ? doc.tree : findNodeInTree(doc.tree, parentId);
      if (!parent) return doc;
      if (index === undefined || index < 0 || index > parent.children.length) {
        parent.children.push(newNode);
      } else {
        parent.children.splice(index, 0, newNode);
      }
      return doc;
    });
    return newId;
  },

  insertNodeAtRoot: (key) => {
    return get().insertNode(null, key);
  },

  removeNodes: (ids) => {
    if (ids.length === 0) return;
    mutateActiveDoc(set, get, (doc) => {
      for (const id of ids) {
        removeNodeFromTree(doc.tree, id);
      }
      return doc;
    });
    set((s) => ({
      selectedIds: s.selectedIds.filter((sid) => !ids.includes(sid)),
    }));
  },

  duplicateNodes: (ids) => {
    if (ids.length === 0) return [];
    const newIds: string[] = [];
    mutateActiveDoc(set, get, (doc) => {
      for (const id of ids) {
        const parent = findParentInTree(doc.tree, id) ?? doc.tree;
        const original = parent.children.find((c) => c.id === id);
        if (!original) continue;
        const idx = parent.children.findIndex((c) => c.id === id);
        const copy = cloneWithNewIds(original);
        newIds.push(copy.id);
        parent.children.splice(idx + 1, 0, copy);
      }
      return doc;
    });
    if (newIds.length > 0) {
      set({ selectedIds: newIds });
    }
    return newIds;
  },

  moveNode: (id, newParentId, index) => {
    mutateActiveDoc(set, get, (doc) => {
      // prevent moving into self/descendant
      const subtree = findNodeInTree(doc.tree, id);
      if (!subtree) return doc;
      if (newParentId === id || findNodeInTree(subtree, newParentId)) return doc;
      const newParent =
        newParentId === null ? doc.tree : findNodeInTree(doc.tree, newParentId);
      if (!newParent) return doc;
      const removed = removeNodeFromTree(doc.tree, id);
      if (!removed) return doc;
      // re-find newParent in case it was the same as old parent (its children array mutated)
      const target =
        newParentId === null ? doc.tree : findNodeInTree(doc.tree, newParentId);
      if (!target) {
        // fallback — push to root
        doc.tree.children.push(removed);
      } else {
        const at = index < 0 || index > target.children.length ? target.children.length : index;
        target.children.splice(at, 0, removed);
      }
      return doc;
    });
  },

  reorderChild: (parentId, fromIndex, toIndex) => {
    mutateActiveDoc(set, get, (doc) => {
      const parent = parentId === null ? doc.tree : findNodeInTree(doc.tree, parentId);
      if (!parent) return doc;
      if (fromIndex < 0 || fromIndex >= parent.children.length) return doc;
      const arr = parent.children;
      const [moved] = arr.splice(fromIndex, 1);
      const at = toIndex < 0 ? 0 : toIndex > arr.length ? arr.length : toIndex;
      arr.splice(at, 0, moved);
      return doc;
    });
  },

  updateNodeProps: (id, partial) => {
    mutateActiveDoc(set, get, (doc) => {
      const node = findNodeInTree(doc.tree, id);
      if (!node) return doc;
      node.props = { ...node.props, ...partial };
      return doc;
    });
  },

  setNodeVariant: (id, variant) => {
    mutateActiveDoc(set, get, (doc) => {
      const node = findNodeInTree(doc.tree, id);
      if (!node) return doc;
      node.variant = variant;
      return doc;
    });
  },

  setNodeText: (id, text) => {
    mutateActiveDoc(set, get, (doc) => {
      const node = findNodeInTree(doc.tree, id);
      if (!node) return doc;
      const key = getPrimaryTextKey(node.component);
      if (!key) return doc;
      node.props = { ...node.props, [key]: text };
      return doc;
    });
  },

  // ── selection ──────────────────────────────────────────────────────────
  select: (ids) => set({ selectedIds: [...ids] }),
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),

  // ── theme ──────────────────────────────────────────────────────────────
  setTheme: (t) => {
    mutateActiveDoc(set, get, (doc) => {
      doc.theme = t;
      return doc;
    });
  },
  setAccent: (a) => {
    mutateActiveDoc(set, get, (doc) => {
      doc.accent = a;
      return doc;
    });
  },

  // ── history ────────────────────────────────────────────────────────────
  undo: () => {
    const state = get();
    const active = state.getActiveDocument();
    if (!active || state.past.length === 0) return;
    const past = [...state.past];
    const previous = past.pop()!;
    const future = [structuredClone(active), ...state.future].slice(0, HISTORY_LIMIT);
    set({
      documents: state.documents.map((d) => (d.id === previous.id ? previous : d)),
      past,
      future,
      selectedIds: [],
    });
  },

  redo: () => {
    const state = get();
    const active = state.getActiveDocument();
    if (!active || state.future.length === 0) return;
    const future = [...state.future];
    const next = future.shift()!;
    const past = [...state.past, structuredClone(active)].slice(-HISTORY_LIMIT);
    set({
      documents: state.documents.map((d) => (d.id === next.id ? next : d)),
      past,
      future,
      selectedIds: [],
    });
  },

  // ── clipboard ──────────────────────────────────────────────────────────
  copy: (ids) => {
    const tree = get().getTree();
    const clips: FrameNode[] = [];
    for (const id of ids) {
      const n = findNodeInTree(tree, id);
      if (n) clips.push(structuredClone(n));
    }
    if (clips.length > 0) set({ clipboard: clips });
  },

  paste: (parentId, index) => {
    const state = get();
    if (state.clipboard.length === 0) return [];
    const newIds: string[] = [];
    mutateActiveDoc(set, get, (doc) => {
      const parent = parentId === null ? doc.tree : findNodeInTree(doc.tree, parentId);
      if (!parent) return doc;
      const at =
        index === undefined || index < 0 || index > parent.children.length
          ? parent.children.length
          : index;
      const copies = state.clipboard.map(cloneWithNewIds);
      copies.forEach((c) => newIds.push(c.id));
      parent.children.splice(at, 0, ...copies);
      return doc;
    });
    if (newIds.length > 0) set({ selectedIds: newIds });
    return newIds;
  },

  // ── grouping ───────────────────────────────────────────────────────────
  group: (ids) => {
    if (ids.length === 0) return null;
    const state = get();
    const tree = state.getTree();
    // find parent of first id; all must share the same parent and be siblings
    const firstParent = findParentInTree(tree, ids[0]) ?? tree;
    const allSameParent = ids.every((id) => {
      const p = findParentInTree(tree, id) ?? tree;
      return p.id === firstParent.id;
    });
    if (!allSameParent) return null;
    // indices in parent's children
    const indices = ids
      .map((id) => firstParent.children.findIndex((c) => c.id === id))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    if (indices.length === 0) return null;
    const insertAt = indices[0];
    let groupId: string | null = null;
    mutateActiveDoc(set, get, (doc) => {
      // re-resolve parent in the cloned tree
      const parent =
        firstParent.id === doc.tree.id
          ? doc.tree
          : findNodeInTree(doc.tree, firstParent.id) ?? doc.tree;
      // pull the nodes out (in reverse order so indices stay valid)
      const sortedIdx = [...indices].sort((a, b) => b - a);
      const pulled: FrameNode[] = [];
      for (const i of sortedIdx) {
        const node = parent.children.splice(i, 1)[0];
        if (node) pulled.unshift(node);
      }
      const groupNode = createNode("flex-col");
      groupNode.props.className = "flex flex-col gap-2 p-2 border rounded";
      groupNode.children = pulled;
      groupId = groupNode.id;
      parent.children.splice(insertAt, 0, groupNode);
      return doc;
    });
    if (groupId) set({ selectedIds: [groupId] });
    return groupId;
  },

  ungroup: (groupId) => {
    mutateActiveDoc(set, get, (doc) => {
      const parent = findParentInTree(doc.tree, groupId);
      const groupNode = parent
        ? parent.children.find((c) => c.id === groupId)
        : findNodeInTree(doc.tree, groupId);
      if (!groupNode) return doc;
      const idx = parent ? parent.children.findIndex((c) => c.id === groupId) : -1;
      if (!parent || idx < 0) return doc;
      const kids = groupNode.children;
      parent.children.splice(idx, 1, ...kids);
      return doc;
    });
    set({ selectedIds: [] });
  },

  // ── persistence ────────────────────────────────────────────────────────
  hydrate: () => {
    if (hydrated) return;
    hydrated = true;
    if (typeof window === "undefined") return; // SSR guard
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          documents?: FrameDocument[];
          activeDocumentId?: string | null;
        };
        if (Array.isArray(parsed.documents) && parsed.documents.length > 0) {
          set({
            documents: parsed.documents,
            activeDocumentId:
              parsed.activeDocumentId &&
              parsed.documents.some((d) => d.id === parsed.activeDocumentId)
                ? parsed.activeDocumentId
                : parsed.documents[0].id,
            saveStatus: "saved",
            lastSavedAt: Date.now(),
          });
        } else {
          seedDefault(set);
        }
      } else {
        seedDefault(set);
      }
    } catch {
      seedDefault(set);
    }

    installAutosave();
  },

  forceSave: () => {
    if (typeof window === "undefined") return;
    const state = get();
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          documents: state.documents,
          activeDocumentId: state.activeDocumentId,
          version: 1,
        }),
      );
      set({ saveStatus: "saved", lastSavedAt: Date.now() });
    } catch {
      // localStorage quota / unavailable — silently degrade
      set({ saveStatus: "idle" });
    }
  },

  exportJSON: () => {
    const doc = get().getActiveDocument();
    return doc ? generateJSON(doc) : "{}";
  },

  importJSON: (raw) => {
    try {
      const doc = parseJSON(raw);
      // ensure fresh id to avoid collision
      const newId = nanoid10();
      const newDoc: FrameDocument = { ...doc, id: newId, updatedAt: Date.now() };
      set((s) => ({
        documents: [...s.documents, newDoc],
        activeDocumentId: newId,
        selectedIds: [],
        past: [],
        future: [],
      }));
    } catch (e) {
      // swallow — caller may surface via toast in Task 2
      console.error("[frame] importJSON failed:", e);
    }
  },
}));

// ---------------------------------------------------------------------------
// Module-local helpers
// ---------------------------------------------------------------------------

function seedDefault(set: (partial: Partial<FrameState>) => void): void {
  const doc = newDocument();
  set({
    documents: [doc],
    activeDocumentId: doc.id,
    saveStatus: "saved",
    lastSavedAt: Date.now(),
  });
}

function installAutosave(): void {
  if (autosaveInstalled) return;
  autosaveInstalled = true;
  useFrameStore.subscribe((state, prevState) => {
    // Only react to documents/activeDocumentId changes (not selection/save status).
    if (
      state.documents === prevState.documents &&
      state.activeDocumentId === prevState.activeDocumentId
    ) {
      return;
    }
    useFrameStore.setState({ saveStatus: "saving" });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      useFrameStore.getState().forceSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  });
}

// ---------------------------------------------------------------------------
// Selector hooks — derive state directly (avoid calling store methods inside
// selectors, which would call `get()` and return live state during the SSR
// getServerSnapshot pass, triggering React's "should be cached" warning).
// ---------------------------------------------------------------------------

/** Select the active document (stable reference while documents array is unchanged). */
export function useActiveDocument(): FrameDocument | undefined {
  return useFrameStore((s) =>
    s.documents.find((d) => d.id === s.activeDocumentId),
  );
}

/** Select the active document's tree (FALLBACK_ROOT if no active doc). */
export function useTree(): FrameNode {
  return useFrameStore(
    (s) =>
      s.documents.find((d) => d.id === s.activeDocumentId)?.tree ??
      FALLBACK_ROOT,
  );
}
