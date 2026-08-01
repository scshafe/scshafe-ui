import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    openId: null,
    anchor: null,
    payload: null
};
export const Popovers = createSlice({
    name: "Popovers",
    initialState,
    reducers: {
        popoverOpened(state, action) {
            const { id, anchor = null, payload = null } = action.payload ?? {};
            if (typeof id !== "string" || !id)
                return;
            state.openId = id;
            state.anchor = anchor;
            state.payload = payload;
        },
        popoverClosed(state) {
            state.openId = null;
            state.anchor = null;
            state.payload = null;
        },
        popoverClosedIfCurrent(state, action) {
            if (state.openId !== action.payload)
                return;
            state.openId = null;
            state.anchor = null;
            state.payload = null;
        }
    }
});
export const { popoverOpened, popoverClosed, popoverClosedIfCurrent } = Popovers.actions;
export function selectPopovers(state = {}) {
    return state.Popovers ?? initialState;
}
export function selectOpenPopoverId(state = {}) {
    return selectPopovers(state).openId;
}
export function selectPopoverAnchor(state = {}) {
    return selectPopovers(state).anchor;
}
export function selectPopoverPayload(state = {}) {
    return selectPopovers(state).payload;
}
