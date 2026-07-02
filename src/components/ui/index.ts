/**
 * Barrel export for all shadcn/ui components.
 *
 * Allows `import * as Shadcn from "@/components/ui"` or
 * `import { Button, Input, ... } from "@/components/ui"`.
 */

export * from "./accordion";
export * from "./alert";
export * from "./alert-dialog";
export * from "./aspect-ratio";
export * from "./avatar";
export * from "./badge";
export * from "./breadcrumb";
export * from "./button";
export * from "./calendar";
export * from "./card";
export * from "./carousel";
export * from "./chart";
export * from "./checkbox";
export * from "./collapsible";
export * from "./command";
export * from "./context-menu";
export * from "./dialog";
export * from "./drawer";
export * from "./dropdown-menu";
export * from "./form";
export * from "./hover-card";
export * from "./input-otp";
export * from "./input";
export * from "./label";
export * from "./menubar";
export * from "./navigation-menu";
export * from "./pagination";
export * from "./popover";
export * from "./progress";
export * from "./radio-group";
export * from "./resizable";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./sidebar";
export * from "./skeleton";
export * from "./slider";
// NOTE: sonner.tsx and toaster.tsx both export `Toaster` — exclude both from
// the barrel to avoid a naming clash. Import them explicitly where needed.
export * from "./switch";
export * from "./table";
export * from "./tabs";
export * from "./textarea";
export * from "./toast";
export * from "./toggle-group";
export * from "./toggle";
export * from "./tooltip";
