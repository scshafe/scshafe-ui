import { createAsyncThunk, createSlice, type ActionReducerMapBuilder } from "@reduxjs/toolkit";

// ============================================================================
// createPagedListSlice — the infinite-scroll list skeleton.
//
// The lifecycle voice-journey's RowsManager hand-implemented (170 LOC), written
// once: rows accumulate in server order through a host-injected page fetcher;
// any filter or sort change RESETS the accumulation and bumps `requestVersion`,
// and page responses stamped with an older version are dropped — a slow page-2
// response can never splice into a newer filter's list. `sortChanged` toggles
// direction on the active field. Pairs with InfiniteScrollSentinel: wire
// `onLoadMore` to `fetchPageThunk` and `disabled` to loading/!hasMore.
//
// The host owns meaning: `fetchPage` receives {offset, limit, filters, sort,
// direction}, does its own param serialization, and returns
// {rows, totalFiltered, meta?} — `meta` carries any page-level extras (totals,
// facets) into state verbatim.
// ============================================================================

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

export function createPagedListSlice<TItem = any, TMeta = any>({
  name,
  fetchPage,
  pageLimit = 100,
  filterKeys = [],
  initialSort = "",
  initialDirection = "asc",
  reducers = {},
  extraReducers
}: CreatePagedListSliceOptions<TItem, TMeta>) {
  const emptyFilters = Object.freeze(Object.fromEntries(filterKeys.map((key) => [key, ""])));

  const initialState: PagedListState<TItem, TMeta> = {
    entities: [],
    hasMore: true,
    totalFiltered: null,
    meta: null,
    status: "idle",
    error: null,
    requestVersion: 0,
    filters: { ...emptyFilters },
    sort: initialSort,
    direction: initialDirection
  };

  // Operates on Immer drafts inside case reducers; `any` sidesteps Draft<TItem> variance.
  function resetAccumulation(state: any): void {
    state.entities = [];
    state.hasMore = true;
    state.totalFiltered = null;
    state.status = "idle";
    state.requestVersion += 1;
  }

  const fetchPageThunk = createAsyncThunk(`${name}/fetchPage`, async (_arg: void, thunkApi: any) => {
    const sliceState: PagedListState<TItem, TMeta> = thunkApi.getState()?.[name];
    const page = await fetchPage({
      offset: sliceState.entities.length,
      limit: pageLimit,
      filters: sliceState.filters,
      sort: sliceState.sort,
      direction: sliceState.direction
    }, thunkApi);
    return {
      version: sliceState.requestVersion,
      rows: page?.rows ?? [],
      totalFiltered: page?.totalFiltered ?? null,
      meta: page?.meta ?? null
    };
  }, {
    condition: (_arg, { getState }) => {
      const sliceState = (getState() as any)?.[name];
      return sliceState?.status !== "loading" && Boolean(sliceState?.hasMore);
    }
  });

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      filtersInitialized(state, action: any) {
        for (const key of filterKeys) {
          if (action.payload?.[key] !== undefined) state.filters[key] = String(action.payload[key]);
        }
        if (action.payload?.sort) state.sort = String(action.payload.sort);
        if (action.payload?.direction === "desc" || action.payload?.direction === "asc") state.direction = action.payload.direction;
      },
      filterChanged(state, action: any) {
        const { key, value } = action.payload ?? {};
        if (!filterKeys.includes(key)) return;
        state.filters[key] = String(value ?? "");
        resetAccumulation(state);
      },
      filtersCleared(state) {
        state.filters = { ...emptyFilters };
        resetAccumulation(state);
      },
      sortChanged(state, action: any) {
        const field = action.payload?.field;
        if (!field) return;
        state.direction = state.sort === field && state.direction === "asc" ? "desc" : "asc";
        state.sort = field;
        resetAccumulation(state);
      },
      listInvalidated(state) {
        resetAccumulation(state);
      },
      ...reducers
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchPageThunk.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(fetchPageThunk.fulfilled, (state, action) => {
          const { version, rows, totalFiltered, meta } = action.payload as any;
          if (version !== state.requestVersion) return; // stale page from a superseded filter/sort
          state.status = "loaded";
          state.entities.push(...rows);
          state.meta = meta;
          if (typeof totalFiltered === "number" && Number.isFinite(totalFiltered)) {
            state.totalFiltered = totalFiltered;
            state.hasMore = state.entities.length < totalFiltered;
          } else {
            state.totalFiltered = null;
            state.hasMore = rows.length >= pageLimit;
          }
        })
        .addCase(fetchPageThunk.rejected, (state, action) => {
          if ((action.meta as any)?.condition) return;
          state.status = "failed";
          state.error = action.error?.message ?? `${name} page fetch failed`;
        });
      extraReducers?.(builder as any);
    }
  });

  const select = (state: any = {}): PagedListState<TItem, TMeta> => state?.[name] ?? initialState;
  const selectItems = (state: any = {}): TItem[] => select(state).entities;

  return {
    name,
    slice,
    reducer: slice.reducer,
    actions: slice.actions,
    fetchPageThunk,
    select,
    selectItems
  };
}
