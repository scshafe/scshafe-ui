import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { DevUxContext, PopoverControllerContext, type PopoverController } from "../widget/PopoverControllerContext.js";
import { popoverClosed, popoverClosedIfCurrent, popoverOpened, selectOpenPopoverId, selectPopoverAnchor } from "./Popovers.js";

// ============================================================================
// RtkPopoverProvider — the adapter from the state layer's Popovers slice to the
// injected PopoverController context the Tooltip / HoverCard / Popover
// components read. The contract:
//
//   open           -> dispatch popoverOpened({ id, anchor, payload })
//   close          -> dispatch popoverClosed()
//   closeIfCurrent -> dispatch popoverClosedIfCurrent(id)   (P1-B1 scoped close)
//   openId/anchor  <- selectOpenPopoverId / selectPopoverAnchor
//
// Single-open preemption and the stale-delayed-close protection live in the
// slice, so they hold for every consumer. DevUx is host-supplied here (a plain
// prop, default off) — hosts with their own dev-UX slice pass its value in.
// LocalPopoverProvider remains the store-free alternative.
// ============================================================================

export interface RtkPopoverProviderProps {
  children: React.ReactNode;
  devUxEnabled?: boolean;
}

export function RtkPopoverProvider({ children, devUxEnabled = false }: RtkPopoverProviderProps) {
  const dispatch = useDispatch();
  const openId = useSelector(selectOpenPopoverId);
  const anchor = useSelector(selectPopoverAnchor) as PopoverController["anchor"];
  const controller = React.useMemo<PopoverController>(() => ({
    openId,
    anchor,
    open(id, popoverAnchor, payload) { dispatch(popoverOpened({ id, anchor: popoverAnchor, payload })); },
    close() { dispatch(popoverClosed()); },
    closeIfCurrent(id) { dispatch(popoverClosedIfCurrent(id)); }
  }), [openId, anchor, dispatch]);
  return (
    <DevUxContext.Provider value={devUxEnabled}>
      <PopoverControllerContext.Provider value={controller}>
        {children}
      </PopoverControllerContext.Provider>
    </DevUxContext.Provider>
  );
}
