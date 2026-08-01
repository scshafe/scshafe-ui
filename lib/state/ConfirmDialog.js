import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    open: false,
    prompt: null
};
let pendingResolver = null;
export const ConfirmDialog = createSlice({
    name: "ConfirmDialog",
    initialState,
    reducers: {
        confirmAsked(state, action) {
            state.open = true;
            state.prompt = action.payload ?? null;
        },
        confirmCleared(state) {
            state.open = false;
            state.prompt = null;
        }
    }
});
export const { confirmAsked, confirmCleared } = ConfirmDialog.actions;
export function confirmActionThunk(prompt = {}) {
    return (dispatch) => {
        if (pendingResolver) {
            const stale = pendingResolver;
            pendingResolver = null;
            stale(false);
        }
        const normalized = {
            title: typeof prompt.title === "string" ? prompt.title : "",
            message: typeof prompt.message === "string" ? prompt.message : "",
            confirmLabel: typeof prompt.confirmLabel === "string" && prompt.confirmLabel ? prompt.confirmLabel : "Confirm",
            cancelLabel: typeof prompt.cancelLabel === "string" && prompt.cancelLabel ? prompt.cancelLabel : "Cancel",
            kind: prompt.kind === "danger" ? "danger" : "default"
        };
        dispatch(confirmAsked(normalized));
        return new Promise((resolve) => {
            pendingResolver = resolve;
        });
    };
}
export function resolveConfirmThunk(confirmed) {
    return (dispatch) => {
        const resolver = pendingResolver;
        pendingResolver = null;
        dispatch(confirmCleared());
        if (resolver)
            resolver(Boolean(confirmed));
    };
}
export function selectConfirmDialog(state = {}) {
    return state.ConfirmDialog ?? initialState;
}
// Testing helper — lets tests assert that no resolver is leaked.
export function _isResolverPending() {
    return pendingResolver !== null;
}
