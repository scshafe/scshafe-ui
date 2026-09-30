import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PopoverAnchor } from "../widget/PopoverControllerContext.js";

// ============================================================================
// Popovers — single in-flight popover anchored at viewport coordinates.
//
// Single-open by design: opening a second popover preempts the first. `anchor`
// carries viewport coords so the Popover primitive can render the floating
// container next to the trigger. `popoverClosedIfCurrent` is the scoped close:
// a stale delayed close from a HoverCard must not clobber a newer popover that
// opened during the close delay. Auto-close wiring (Escape / outside click /
// scroll) stays a host concern.
// ============================================================================

interface PopoversState {
  openId: string | null;
  anchor: PopoverAnchor | null;
  payload: unknown;
}

const initialState: PopoversState = {
  openId: null,
  anchor: null,
  payload: null
};

export const Popovers = createSlice({
  name: "Popovers",
  initialState,
  reducers: {
    popoverOpened(state, action: PayloadAction<{ id?: string; anchor?: PopoverAnchor | null; payload?: unknown } | undefined>) {
      const { id, anchor = null, payload = null } = action.payload ?? {};
      if (typeof id !== "string" || !id) return;
      state.openId = id;
      state.anchor = anchor;
      state.payload = payload;
    },
    popoverClosed(state) {
      state.openId = null;
      state.anchor = null;
      state.payload = null;
    },
    popoverClosedIfCurrent(state, action: PayloadAction<string>) {
      if (state.openId !== action.payload) return;
      state.openId = null;
      state.anchor = null;
      state.payload = null;
    }
  }
});

export const { popoverOpened, popoverClosed, popoverClosedIfCurrent } = Popovers.actions;

export function selectPopovers(state: any = {}): PopoversState {
  return state.Popovers ?? initialState;
}

export function selectOpenPopoverId(state: any = {}): string | null {
  return selectPopovers(state).openId;
}

export function selectPopoverAnchor(state: any = {}): PopoverAnchor | null {
  return selectPopovers(state).anchor;
}

export function selectPopoverPayload(state: any = {}): unknown {
  return selectPopovers(state).payload;
}
