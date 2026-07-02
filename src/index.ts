// mc-ui — Mission Control's generic frontend component package.
//
// First layer (P0-B5): the LAYOUT PRIMITIVES. Framework-light React components over CSS
// tokens (`--mc-space-*`), import-closed (react + this package only, zero domain coupling).
// Later layers (the extraction arc) add primitives/widgets once their couplings drop — see
// DESIGN-FRONTEND-COMPONENT-PACKAGE.md. Ship the styles with `import "mc-ui/layout.css"`.

export * from "./layout/layoutShared.js";
export * from "./layout/StackComponent.js";
export * from "./layout/InlineComponent.js";
export * from "./layout/GridComponent.js";
export * from "./layout/PaneComponent.js";
export * from "./layout/ScrollComponent.js";
