import React from "react";

// C0 — the injected popover seam. Tooltip / HoverCard / Popover never reach a
// store directly; they read an INJECTED controller + devUxEnabled boolean from
// React context, so every component that wraps Tooltip stays store-free. Two
// providers supply it:
//   - RtkPopoverProvider (@scshafe/ui/state): adapts the package's Popovers
//     slice, dispatching the slice's own actions, so single-open and scoped
//     close behave exactly as the slice defines.
//   - LocalPopoverProvider (package default): self-contained, zero wiring.
//
// When a host uses the RTK slice, the slice stays the source of truth
// (render-from-RTK); the seam changes HOW components reach it, not that it exists.

export type PopoverAnchor = { x: number; y: number };

// The minimal single-open popover controller the generic widgets need. Mirrors
// the Popovers slice API exactly (openId/anchor + popoverOpened /
// popoverClosed / popoverClosedIfCurrent) so the RTK adapter is a 1:1 shim and
// behavior is preserved.
export interface PopoverController {
  // The id of the single currently-open popover (single-open singleton), or null.
  openId: string | null;
  // Viewport coords for the open popover's anchor, or null when closed.
  anchor: PopoverAnchor | null;
  // Open (and preempt any other open popover) — maps to
  // popoverOpened({ id, anchor, payload }).
  open(id: string, anchor: PopoverAnchor | null, payload?: unknown): void;
  // Force-close whatever is open (Escape / outside-click / scroll / explicit
  // dismiss) — maps to popoverClosed().
  close(): void;
  // SCOPED close: close only if `id` is still the open one — maps to
  // popoverClosedIfCurrent(id). A stale delayed close must NOT clobber a newer
  // popover that opened during the close delay (the P1-B1 instant tooltip
  // handoff invariant).
  closeIfCurrent(id: string): void;
}

// Default = an inert no-op controller. A component rendered with NO provider
// (a standalone consumer that forgot to mount one, or a window-less SSR/test
// render) simply never opens a popover rather than crashing. This is the
// closed-state behavior (`openId === null`). Hosts mount RtkPopoverProvider
// (through SuiProviders) or LocalPopoverProvider at the app root.
const NOOP_POPOVER_CONTROLLER: PopoverController = {
  openId: null,
  anchor: null,
  open() {},
  close() {},
  closeIfCurrent() {}
};

export const PopoverControllerContext = React.createContext<PopoverController>(NOOP_POPOVER_CONTROLLER);

// dev-ux gating (a host flag, e.g. a dev-mode slice; default = off). Kept as a
// SEPARATE context from the controller: it changes on a different cadence
// (essentially never at runtime) than the popover open/close state, so a
// tooltip re-render on popover open does not churn on devUx and vice-versa.
export const DevUxContext = React.createContext<boolean>(false);

export function usePopoverController(): PopoverController {
  return React.useContext(PopoverControllerContext);
}

export function useDevUxEnabled(): boolean {
  return React.useContext(DevUxContext);
}
