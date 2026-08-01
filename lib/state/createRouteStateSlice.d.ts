import { type Dispatch } from "@reduxjs/toolkit";
export interface RouteLocationLike {
    pathname: string;
    search: string;
    hash: string;
}
export interface CreateRouteStateSliceOptions<TState extends Record<string, any>> {
    name?: string;
    strategy?: "pathname" | "hash";
    parse: (location: RouteLocationLike) => TState;
    write: (state: TState) => string;
}
export declare function createRouteStateSlice<TState extends Record<string, any> = Record<string, any>>({ name, strategy, parse, write }: CreateRouteStateSliceOptions<TState>): {
    name: string;
    slice: import("@reduxjs/toolkit").Slice<TState, {
        routeChanged(_state: import("immer").Draft<TState>, action: any): TState;
    }, string, string, import("@reduxjs/toolkit").SliceSelectors<TState>>;
    reducer: import("redux").Reducer<TState>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        routeChanged(_state: import("immer").Draft<TState>, action: any): TState;
    }, string>;
    routeChanged: (payload: TState) => {
        type: string;
        payload: TState;
    };
    navigateThunk: (next: Partial<TState>) => (dispatch: Dispatch, getState: () => any) => void;
    syncUrlThunk: (next: Partial<TState>) => (dispatch: Dispatch, getState: () => any) => void;
    attach: (store: {
        dispatch: Dispatch;
    }) => () => void;
    select: (state?: any) => TState;
};
