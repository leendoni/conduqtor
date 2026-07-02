/**
 * FRAME — node/document factory helpers.
 *
 * Used by the store (hydrate, newDocument) and indirectly by codegen/store
 * tests. Keep these pure: no localStorage, no zustand.
 */

import { nanoid } from "nanoid";

import type { AccentName, FrameDocument, FrameNode, ThemeName } from "./types";
import { createNode } from "./registry";

/**
 * The root of every FRAME document tree. Uses the magic `component: "root"`
 * key which is NOT in the registry. Renderers (Task 2) treat it as a plain
 * vertical stack; codegen renders its children without a wrapping tag.
 */
export function createRootNode(): FrameNode {
  return {
    id: nanoid(10),
    component: "root",
    variant: "normal",
    props: { className: "flex flex-col gap-6 p-6" },
    children: [],
  };
}

/**
 * Starter tree shown on first load. Small but feels alive:
 *   root
 *   ├── card (with pre-seeded CardContent child replaced by a flex-col holding a button + email input)
 *   │     └── (CardContent) flex-col
 *   │              ├── button
 *   │              └── input
 *   └── flex-row
 *           ├── badge
 *           └── badge
 */
export function createStarterTree(): FrameNode {
  const root = createRootNode();

  const card = createNode("card");
  card.props.title = "Welcome to FRAME";
  card.props.description = "Drag components from the left to build your UI.";
  // Replace the pre-seeded default CardContent child with a richer composition.
  card.children = [];

  const cardInner = createNode("flex-col");
  cardInner.props.className = "flex flex-col gap-3";
  cardInner.children.push(createNode("button"));
  const inputNode = createNode("input");
  inputNode.props.placeholder = "you@example.com";
  inputNode.props.label = "Email";
  inputNode.props.type = "email";
  cardInner.children.push(inputNode);
  card.children.push(cardInner);

  const row = createNode("flex-row");
  const b1 = createNode("badge");
  b1.props.text = "Beta";
  b1.props.variant = "secondary";
  const b2 = createNode("badge");
  b2.props.text = "v0.1";
  row.children.push(b1, b2);

  root.children.push(card, row);
  return root;
}

/** Build a brand-new empty document. */
export function newDocument(name?: string): FrameDocument {
  const now = Date.now();
  return {
    id: nanoid(10),
    name: name?.trim() || `Untitled ${new Date(now).toLocaleString()}`,
    tree: createStarterTree(),
    theme: "light" as ThemeName,
    accent: "zinc" as AccentName,
    updatedAt: now,
  };
}
