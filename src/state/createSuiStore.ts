import { configureStore, type Middleware } from "@reduxjs/toolkit";

// ============================================================================
// createSuiStore — configureStore with the house conventions.
//
// Accepts a mixed list of "slice-like" things: raw RTK slices ({name, reducer})
// and factory results ({slice}) interchangeably, so a store reads as a
// manifest:
//
//   const store = createSuiStore({
//     slices: [Toasts, Popovers, ConfirmDialog, RowsManager, MyDomainSlice],
//     middleware: [persistPaneSizes],
//   });
//
// RTK's default middleware (immutability + serializability checks in dev)
// stays on; host middleware is concatenated after it.
// ============================================================================

export interface SliceLike {
  name?: string;
  reducer?: (state: any, action: any) => any;
  slice?: { name: string; reducer: (state: any, action: any) => any };
}

export interface CreateSuiStoreOptions {
  slices?: ReadonlyArray<SliceLike>;
  reducers?: Record<string, (state: any, action: any) => any>;
  middleware?: ReadonlyArray<Middleware>;
  preloadedState?: Record<string, unknown>;
}

export function createSuiStore({ slices = [], reducers = {}, middleware = [], preloadedState }: CreateSuiStoreOptions = {}) {
  const reducerMap: Record<string, (state: any, action: any) => any> = { ...reducers };
  for (const entry of slices) {
    const resolved = entry?.slice ?? entry;
    if (!resolved?.name || typeof resolved.reducer !== "function") {
      throw new Error("createSuiStore: every `slices` entry needs {name, reducer} (an RTK slice or a factory result)");
    }
    if (reducerMap[resolved.name]) {
      throw new Error(`createSuiStore: duplicate slice name "${resolved.name}"`);
    }
    reducerMap[resolved.name] = resolved.reducer;
  }
  return configureStore({
    reducer: reducerMap as any,
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...(middleware as Middleware[])) as any
  });
}
