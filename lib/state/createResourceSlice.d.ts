import { type ActionReducerMapBuilder } from "@reduxjs/toolkit";
export type ResourceStatus = "idle" | "loading" | "loaded" | "failed";
export interface ResourceState<TData = any> {
    status: ResourceStatus;
    error: string | null;
    data: TData | null;
}
export interface CreateResourceSliceOptions<TData> {
    name: string;
    fetch: (arg: any, thunkApi: any) => Promise<TData> | TData;
    reducers?: Record<string, (state: ResourceState<TData>, action: any) => void>;
    extraReducers?: (builder: ActionReducerMapBuilder<ResourceState<TData>>) => void;
}
export declare function createResourceSlice<TData = any>({ name, fetch, reducers, extraReducers }: CreateResourceSliceOptions<TData>): {
    name: string;
    slice: import("@reduxjs/toolkit").Slice<ResourceState<TData>, {
        invalidated(state: {
            status: ResourceStatus;
            error: string | null;
            data: (TData extends object ? import("immer").Draft<TData> : TData) | null;
        }): void;
    }, string, string, import("@reduxjs/toolkit").SliceSelectors<ResourceState<TData>>>;
    reducer: import("redux").Reducer<ResourceState<TData>>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        invalidated(state: {
            status: ResourceStatus;
            error: string | null;
            data: (TData extends object ? import("immer").Draft<TData> : TData) | null;
        }): void;
    }, string>;
    fetchThunk: import("@reduxjs/toolkit").AsyncThunk<TData, any, import("@reduxjs/toolkit").AsyncThunkConfig>;
    select: (state?: any) => ResourceState<TData>;
    selectData: (state?: any) => TData | null;
};
