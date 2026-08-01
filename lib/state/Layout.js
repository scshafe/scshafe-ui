import { createSlice } from "@reduxjs/toolkit";
import { MOBILE_CLAMP_MAX_WIDTH } from "../widget/popoverPosition.js";
const initialState = {
    isMobile: false,
    collapsedListsBySurface: {}
};
export const Layout = createSlice({
    name: "Layout",
    initialState,
    reducers: {
        viewportChanged(state, action) {
            state.isMobile = Boolean(action.payload?.isMobile ?? action.payload);
        },
        surfaceListCollapseToggled(state, action) {
            const surfaceId = typeof action.payload === "string" ? action.payload : action.payload?.surfaceId;
            if (!surfaceId)
                return;
            state.collapsedListsBySurface[surfaceId] = !state.collapsedListsBySurface[surfaceId];
        },
        surfaceListCollapseSet(state, action) {
            const surfaceId = action.payload?.surfaceId;
            if (!surfaceId)
                return;
            state.collapsedListsBySurface[surfaceId] = Boolean(action.payload?.collapsed);
        }
    }
});
export const { viewportChanged, surfaceListCollapseToggled, surfaceListCollapseSet } = Layout.actions;
export function selectIsMobile(state = {}) {
    return Boolean(state?.Layout?.isMobile);
}
export function selectSurfaceListCollapsed(surfaceId) {
    return (state = {}) => Boolean(state?.Layout?.collapsedListsBySurface?.[surfaceId]);
}
// Install the matchMedia listener driving `isMobile`; returns a detach function.
// No-op without a window (SSR / tests keep the desktop default).
export function attachViewportSync(store, { maxWidth = MOBILE_CLAMP_MAX_WIDTH } = {}) {
    const matchMedia = globalThis.matchMedia;
    if (typeof matchMedia !== "function")
        return () => { };
    const query = matchMedia(`(max-width: ${maxWidth}px)`);
    const sync = () => store.dispatch(viewportChanged(Boolean(query.matches)));
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
}
