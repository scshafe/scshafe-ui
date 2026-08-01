import { type Middleware } from "@reduxjs/toolkit";
export interface SliceLike {
    name?: string;
    reducer?: (state: any, action: any) => any;
    slice?: {
        name: string;
        reducer: (state: any, action: any) => any;
    };
}
export interface CreateMcStoreOptions {
    slices?: ReadonlyArray<SliceLike>;
    reducers?: Record<string, (state: any, action: any) => any>;
    middleware?: ReadonlyArray<Middleware>;
    preloadedState?: Record<string, unknown>;
}
export declare function createMcStore({ slices, reducers, middleware, preloadedState }?: CreateMcStoreOptions): import("@reduxjs/toolkit").EnhancedStore<any, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: {};
}>, import("redux").StoreEnhancer]>>;
