import { type ActionReducerMapBuilder } from "@reduxjs/toolkit";
export type PagedListStatus = "idle" | "loading" | "loaded" | "failed";
export interface PagedListState<TItem = any, TMeta = any> {
    entities: TItem[];
    hasMore: boolean;
    totalFiltered: number | null;
    meta: TMeta | null;
    status: PagedListStatus;
    error: string | null;
    requestVersion: number;
    filters: Record<string, string>;
    sort: string;
    direction: "asc" | "desc";
}
export interface PagedListFetchArgs {
    offset: number;
    limit: number;
    filters: Record<string, string>;
    sort: string;
    direction: "asc" | "desc";
}
export interface PagedListPage<TItem = any, TMeta = any> {
    rows: TItem[];
    totalFiltered?: number | null;
    meta?: TMeta | null;
}
export interface CreatePagedListSliceOptions<TItem, TMeta> {
    name: string;
    fetchPage: (args: PagedListFetchArgs, thunkApi: any) => Promise<PagedListPage<TItem, TMeta>> | PagedListPage<TItem, TMeta>;
    pageLimit?: number;
    filterKeys?: ReadonlyArray<string>;
    initialSort?: string;
    initialDirection?: "asc" | "desc";
    reducers?: Record<string, (state: PagedListState<TItem, TMeta>, action: any) => void>;
    extraReducers?: (builder: ActionReducerMapBuilder<PagedListState<TItem, TMeta>>) => void;
}
export declare function createPagedListSlice<TItem = any, TMeta = any>({ name, fetchPage, pageLimit, filterKeys, initialSort, initialDirection, reducers, extraReducers }: CreatePagedListSliceOptions<TItem, TMeta>): {
    name: string;
    slice: import("@reduxjs/toolkit").Slice<PagedListState<TItem, TMeta>, {
        filtersInitialized(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }, action: any): void;
        filterChanged(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }, action: any): void;
        filtersCleared(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }): void;
        sortChanged(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }, action: any): void;
        listInvalidated(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }): void;
    }, string, string, import("@reduxjs/toolkit").SliceSelectors<PagedListState<TItem, TMeta>>>;
    reducer: import("redux").Reducer<PagedListState<TItem, TMeta>>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        filtersInitialized(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }, action: any): void;
        filterChanged(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }, action: any): void;
        filtersCleared(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }): void;
        sortChanged(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }, action: any): void;
        listInvalidated(state: {
            entities: import("immer").Draft<TItem>[];
            hasMore: boolean;
            totalFiltered: number | null;
            meta: (TMeta extends object ? import("immer").Draft<TMeta> : TMeta) | null;
            status: PagedListStatus;
            error: string | null;
            requestVersion: number;
            filters: {
                [x: string]: string;
            };
            sort: string;
            direction: "asc" | "desc";
        }): void;
    }, string>;
    fetchPageThunk: import("@reduxjs/toolkit").AsyncThunk<{
        version: number;
        rows: TItem[];
        totalFiltered: number | null;
        meta: NonNullable<TMeta> | null;
    }, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
    select: (state?: any) => PagedListState<TItem, TMeta>;
    selectItems: (state?: any) => TItem[];
};
