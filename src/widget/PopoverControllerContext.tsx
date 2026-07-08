import React from "react";

// C0 (components-standalone track) — the injected seam that decouples the
// generic Tooltip / HoverCard / Popover rendering components from MC's global
// RTK singletons (state/Popovers.js, state/DevUxManager.js).
//
// WHY: those three components used to reach the slices DIRECTLY via
// useSelector/useDispatch, hard-wiring MC's store into otherwise-generic UI
// primitives. ~16 primitives import Tooltip, so nothing above the layout
// primitives could move into the standalone package until this coupling broke.
// They now read an INJECTED controller + devUxEnabled boolean from React
// context. Two providers supply it:
//   - RtkPopoverProvider (MC): adapts the EXISTING Popovers + DevUxManager
//     slices, dispatching the SAME actions on the SAME slice, so
//     AppLifecycleListeners auto-close + single-open stay BYTE-IDENTICAL.
//   - LocalPopoverProvider (package default): self-contained, zero wiring.
//
// The RTK slice STAYS the source of truth for MC (render-from-RTK) — we invert
// HOW components reach it, not that it exists.

export type PopoverAnchor = { x: number; y: number };

// The minimal single-open popover controller the generic widgets need. Mirrors
// the state/Popovers.js API exactly (openId/anchor + popoverOpened /
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
// closed-state behavior, byte-identical to the old `openId === null` path. MC
// always mounts RtkPopoverProvider at the app root; the package default is
// LocalPopoverProvider.
const NOOP_POPOVER_CONTROLLER: PopoverController = {
  openId: null,
  anchor: null,
  open() {},
  close() {},
  closeIfCurrent() {}
};

export const PopoverControllerContext = React.createContext<PopoverController>(NOOP_POPOVER_CONTROLLER);

// dev-ux gating (MC's DevUxManager slice; standalone default = off). Kept as a
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
