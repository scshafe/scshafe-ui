// mc-ui/state — the OPTIONAL Redux Toolkit state layer (S1 of DESIGN-STATE-LAYER.md).
//
// Import via the subpath: `import { createMcStore, Toasts } from "mc-ui/state"`.
// Consumers of the components alone never pull this graph: @reduxjs/toolkit and
// react-redux are OPTIONAL peer dependencies, and the root "mc-ui" export does not
// re-export this module (pinned by the no-RTK-leak test). Everything here honors the
// no-reverse-import rule extended to data: the library never knows an endpoint, a
// field name, or a store shape beyond its own slices — hosts inject fetchers.
// The fetch seam (moved from the verbatim copies MC and voice-journey carried).
export * from "./webApi.js";
// Slice factories — the doctrine's recurring lifecycles, written once:
// fetch-once resource, infinite-scroll paged list, one-open detail view.
export * from "./createResourceSlice.js";
export * from "./createPagedListSlice.js";
export * from "./createDetailSlice.js";
// Standard slices (moved from MC; voice-journey copied Toasts verbatim).
export * from "./Toasts.js";
export * from "./Popovers.js";
export * from "./ConfirmDialog.js";
export * from "./DataTablePreferences.js";
// URL sync + localStorage persistence, factored from both consumers' hand-rolls.
export * from "./createRouteStateSlice.js";
export * from "./createPersistMiddleware.js";
// Store assembly + the app-root providers.
export * from "./createMcStore.js";
export * from "./RtkPopoverProvider.js";
export * from "./McProviders.js";
// State-coupled components (S3, Bucket E movers) — exported HERE, never from the
// root barrel: the root stays RTK-free (the no-leak pin test enforces it). Each
// pairs with its slice above; icons resolve through the injected useIcon seam.
export * from "./components/ToastTrayComponent.js";
export * from "./components/ConfirmDialogComponent.js";
export * from "./components/ContextMenuComponent.js";
export * from "./components/MoreActionsMenuComponent.js";
export * from "./components/DataTableColumnMenuComponent.js";
