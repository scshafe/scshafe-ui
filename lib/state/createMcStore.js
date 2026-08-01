import { configureStore } from "@reduxjs/toolkit";
export function createMcStore({ slices = [], reducers = {}, middleware = [], preloadedState } = {}) {
    const reducerMap = { ...reducers };
    for (const entry of slices) {
        const resolved = entry?.slice ?? entry;
        if (!resolved?.name || typeof resolved.reducer !== "function") {
            throw new Error("createMcStore: every `slices` entry needs {name, reducer} (an RTK slice or a factory result)");
        }
        if (reducerMap[resolved.name]) {
            throw new Error(`createMcStore: duplicate slice name "${resolved.name}"`);
        }
        reducerMap[resolved.name] = resolved.reducer;
    }
    return configureStore({
        reducer: reducerMap,
        preloadedState: preloadedState,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...middleware)
    });
}
