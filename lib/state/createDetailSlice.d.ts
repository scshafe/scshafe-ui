import { type ActionReducerMapBuilder } from "@reduxjs/toolkit";
export type DetailStatus = "idle" | "loading" | "loaded" | "failed";
export interface DetailState<TData = any> {
    openId: string | null;
    status: DetailStatus;
    error: string | null;
    data: TData | null;
}
export interface CreateDetailSliceOptions<TData> {
    name: string;
    fetch: (arg: {
        id: string;
    }, thunkApi: any) => Promise<TData> | TData;
    reducers?: Record<string, (state: DetailState<TData>, action: any) => void>;
    extraReducers?: (builder: ActionReducerMapBuilder<DetailState<TData>>) => void;
}
export declare function createDetailSlice<TData = any>({ name, fetch, reducers, extraReducers }: CreateDetailSliceOptions<TData>): {
    name: string;
    slice: import("@reduxjs/toolkit").Slice<DetailState<TData>, {
        closed(): DetailState<TData>;
    }, string, string, import("@reduxjs/toolkit").SliceSelectors<DetailState<TData>>>;
    reducer: import("redux").Reducer<DetailState<TData>>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        closed(): DetailState<TData>;
    }, string>;
    openThunk: import("@reduxjs/toolkit").AsyncThunk<TData, {
        id: string;
    }, import("@reduxjs/toolkit").AsyncThunkConfig>;
    select: (state?: any) => DetailState<TData>;
};
