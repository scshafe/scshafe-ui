import { createSlice } from "@reduxjs/toolkit";
const initialState = { items: [] };
const DEFAULT_DURATION_MS = 4000;
let toastCounter = 0;
function nextToastId() {
    return `t_${Date.now().toString(36)}_${(++toastCounter).toString(36)}`;
}
export const Toasts = createSlice({
    name: "Toasts",
    initialState,
    reducers: {
        toastShown(state, action) {
            const id = typeof action.payload?.id === "string" ? action.payload.id : nextToastId();
            const kind = action.payload?.kind === "error" || action.payload?.kind === "info"
                ? action.payload.kind
                : "success";
            const message = typeof action.payload?.message === "string" ? action.payload.message : "";
            if (!message)
                return;
            state.items.push({ id, kind, message });
        },
        toastDismissed(state, action) {
            const id = action.payload?.id;
            if (!id)
                return;
            const index = state.items.findIndex((item) => item.id === id);
            if (index >= 0)
                state.items.splice(index, 1);
        }
    }
});
export const { toastShown, toastDismissed } = Toasts.actions;
export function showToastThunk(input = {}) {
    const kind = input.kind ?? "success";
    const message = input.message;
    const durationMs = input.durationMs;
    return (dispatch) => {
        if (typeof message !== "string" || !message)
            return null;
        const id = nextToastId();
        dispatch(toastShown({ id, kind, message }));
        const resolvedDuration = typeof durationMs === "number"
            ? durationMs
            : (kind === "error" ? null : DEFAULT_DURATION_MS);
        if (resolvedDuration !== null && resolvedDuration > 0 && typeof globalThis.setTimeout === "function") {
            globalThis.setTimeout(() => dispatch(toastDismissed({ id })), resolvedDuration);
        }
        return id;
    };
}
export function selectToasts(state = {}) {
    return state.Toasts?.items ?? [];
}
