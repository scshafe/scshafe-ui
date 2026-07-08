import React from "react";
import {
  DevUxContext,
  PopoverControllerContext,
  type PopoverAnchor,
  type PopoverController
} from "./PopoverControllerContext.js";

// C0 (components-standalone track) — the PACKAGE-DEFAULT popover controller for
// STANDALONE consumers: a fully self-contained single-open controller with zero
// external wiring, so a consumer that just mounts <LocalPopoverProvider> gets
// working tooltips / hover-cards / popovers out of the box. devUxEnabled is
// always false (dev-ux is an MC-specific concept).
//
// MC does NOT use this — MC mounts RtkPopoverProvider so its existing
// Popovers / DevUxManager slices + AppLifecycleListeners stay the single source
// of truth (byte-identical).
//
// HOUSE-RULE NOTE: the useReducer below is the PACKAGE's OWN internal,
// self-contained controller state — NOT app/MC state. The MC store remains the
// source of truth for MC (render-from-RTK); this local reducer exists only for
// consumers that have no store at all. (This file lives in the widget dir for
// now; it MOVES to the standalone package in a later slice.)

type LocalPopoverState = { openId: string | null; anchor: PopoverAnchor | null; payload: unknown };

const INITIAL_STATE: LocalPopoverState = { openId: null, anchor: null, payload: null };

type LocalPopoverAction =
  | { type: "open"; id: string; anchor: PopoverAnchor | null; payload: unknown }
  | { type: "close" }
  | { type: "closeIfCurrent"; id: string };

// Mirrors state/Popovers.js EXACTLY: single-open (a new open preempts the
// current one; a missing id is ignored); popoverClosed resets everything; the
// SCOPED close is a no-op unless `id` is still the open one — so behavior
// matches the RTK path.
function reduceLocalPopover(state: LocalPopoverState, action: LocalPopoverAction): LocalPopoverState {
  switch (action.type) {
    case "open":
      if (typeof action.id !== "string" || !action.id) return state;
      // Default anchor/payload to null to mirror the Popovers slice's
      // `anchor = null, payload = null` destructuring (an undefined arg must
      // land as null, not undefined, so standalone state matches the RTK path).
      return { openId: action.id, anchor: action.anchor ?? null, payload: action.payload ?? null };
    case "close":
      return INITIAL_STATE;
    case "closeIfCurrent":
      if (state.openId !== action.id) return state;
      return INITIAL_STATE;
    default:
      return state;
  }
}

export function LocalPopoverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reduceLocalPopover, INITIAL_STATE);
  // The open/close/closeIfCurrent closures capture only the stable useReducer
  // `dispatch`, so the controller identity changes only when openId/anchor do
  // (matches the RTK adapter's memoization).
  const controller = React.useMemo<PopoverController>(() => ({
    openId: state.openId,
    anchor: state.anchor,
    open(id, anchor, payload) { dispatch({ type: "open", id, anchor, payload }); },
    close() { dispatch({ type: "close" }); },
    closeIfCurrent(id) { dispatch({ type: "closeIfCurrent", id }); }
  }), [state.openId, state.anchor]);
  return (
    <DevUxContext.Provider value={false}>
      <PopoverControllerContext.Provider value={controller}>
        {children}
      </PopoverControllerContext.Provider>
    </DevUxContext.Provider>
  );
}
