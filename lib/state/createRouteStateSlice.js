import { createSlice } from "@reduxjs/toolkit";
function currentLocation() {
    const location = globalThis.location;
    if (!location)
        return { pathname: "/", search: "", hash: "" };
    return { pathname: location.pathname ?? "/", search: location.search ?? "", hash: location.hash ?? "" };
}
export function createRouteStateSlice({ name = "Navigation", strategy = "pathname", parse, write }) {
    const slice = createSlice({
        name,
        initialState: () => parse(currentLocation()),
        reducers: {
            routeChanged(_state, action) {
                return action.payload;
            }
        }
    });
    // createSlice's payload inference trips on the generic replace-reducer; pin the creator's payload type.
    const routeChanged = slice.actions.routeChanged;
    function targetFor(state) {
        const location = currentLocation();
        if (strategy === "hash") {
            const written = write(state);
            return `${location.pathname}${location.search}${written ? `#${written.replace(/^#/, "")}` : ""}`;
        }
        return write(state);
    }
    function navigateThunk(next) {
        return (dispatch, getState) => {
            const current = getState()?.[name] ?? parse(currentLocation());
            const nextState = { ...current, ...next };
            const target = targetFor(nextState);
            const location = currentLocation();
            const currentUrl = `${location.pathname}${location.search}${location.hash}`;
            if (currentUrl !== target)
                globalThis.history?.pushState?.(null, "", target);
            dispatch(routeChanged(nextState));
        };
    }
    // Keep the URL in sync WITHOUT a history entry (filter state, tab state) —
    // the replaceState counterpart of navigateThunk.
    function syncUrlThunk(next) {
        return (dispatch, getState) => {
            const current = getState()?.[name] ?? parse(currentLocation());
            const nextState = { ...current, ...next };
            const target = targetFor(nextState);
            const location = currentLocation();
            const currentUrl = `${location.pathname}${location.search}${location.hash}`;
            if (currentUrl !== target)
                globalThis.history?.replaceState?.(null, "", target);
            dispatch(routeChanged(nextState));
        };
    }
    // Install the browser listener; returns a detach function. No-op without a window.
    function attach(store) {
        const target = globalThis.addEventListener ? globalThis : null;
        if (!target)
            return () => { };
        const onPopState = () => {
            store.dispatch(routeChanged(parse(currentLocation())));
        };
        target.addEventListener("popstate", onPopState);
        return () => target.removeEventListener("popstate", onPopState);
    }
    const select = (state = {}) => state?.[name] ?? parse(currentLocation());
    return {
        name,
        slice,
        reducer: slice.reducer,
        actions: slice.actions,
        routeChanged,
        navigateThunk,
        syncUrlThunk,
        attach,
        select
    };
}
