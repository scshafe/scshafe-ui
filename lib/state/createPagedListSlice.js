import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
export function createPagedListSlice({ name, fetchPage, pageLimit = 100, filterKeys = [], initialSort = "", initialDirection = "asc", reducers = {}, extraReducers }) {
    const emptyFilters = Object.freeze(Object.fromEntries(filterKeys.map((key) => [key, ""])));
    const initialState = {
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
    function resetAccumulation(state) {
        state.entities = [];
        state.hasMore = true;
        state.totalFiltered = null;
        state.status = "idle";
        state.requestVersion += 1;
    }
    const fetchPageThunk = createAsyncThunk(`${name}/fetchPage`, async (_arg, thunkApi) => {
        const sliceState = thunkApi.getState()?.[name];
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
            const sliceState = getState()?.[name];
            return sliceState?.status !== "loading" && Boolean(sliceState?.hasMore);
        }
    });
    const slice = createSlice({
        name,
        initialState,
        reducers: {
            filtersInitialized(state, action) {
                for (const key of filterKeys) {
                    if (action.payload?.[key] !== undefined)
                        state.filters[key] = String(action.payload[key]);
                }
                if (action.payload?.sort)
                    state.sort = String(action.payload.sort);
                if (action.payload?.direction === "desc" || action.payload?.direction === "asc")
                    state.direction = action.payload.direction;
            },
            filterChanged(state, action) {
                const { key, value } = action.payload ?? {};
                if (!filterKeys.includes(key))
                    return;
                state.filters[key] = String(value ?? "");
                resetAccumulation(state);
            },
            filtersCleared(state) {
                state.filters = { ...emptyFilters };
                resetAccumulation(state);
            },
            sortChanged(state, action) {
                const field = action.payload?.field;
                if (!field)
                    return;
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
                const { version, rows, totalFiltered, meta } = action.payload;
                if (version !== state.requestVersion)
                    return; // stale page from a superseded filter/sort
                state.status = "loaded";
                state.entities.push(...rows);
                state.meta = meta;
                if (typeof totalFiltered === "number" && Number.isFinite(totalFiltered)) {
                    state.totalFiltered = totalFiltered;
                    state.hasMore = state.entities.length < totalFiltered;
                }
                else {
                    state.totalFiltered = null;
                    state.hasMore = rows.length >= pageLimit;
                }
            })
                .addCase(fetchPageThunk.rejected, (state, action) => {
                if (action.meta?.condition)
                    return;
                state.status = "failed";
                state.error = action.error?.message ?? `${name} page fetch failed`;
            });
            extraReducers?.(builder);
        }
    });
    const select = (state = {}) => state?.[name] ?? initialState;
    const selectItems = (state = {}) => select(state).entities;
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
