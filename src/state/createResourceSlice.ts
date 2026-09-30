import { createAsyncThunk, createSlice, type ActionReducerMapBuilder } from "@reduxjs/toolkit";

// ============================================================================
// createResourceSlice — the fetch-once resource skeleton.
//
// The `{status, error, data}` lifecycle apps kept hand-writing: a condition-guarded thunk that fetches once, caches for the
// session, and degrades to a failed state with the error message. `invalidated`
// re-arms the fetch (existing data is kept until the refetch lands, so hosts
// get stale-while-revalidate for free).
//
// The library never knows an endpoint — the host injects `fetch`. Escape
// hatches: `reducers` adds host case reducers; `extraReducers` extends the
// builder after the lifecycle cases.
// ============================================================================

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

export function createResourceSlice<TData = any>({ name, fetch, reducers = {}, extraReducers }: CreateResourceSliceOptions<TData>) {
  const initialState: ResourceState<TData> = { status: "idle", error: null, data: null };

  const fetchThunk = createAsyncThunk(`${name}/fetch`, fetch, {
    condition: (_arg, { getState }) => {
      const status = (getState() as any)?.[name]?.status;
      return status !== "loading" && status !== "loaded";
    }
  });

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      invalidated(state) {
        state.status = "idle";
        state.error = null;
      },
      ...reducers
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchThunk.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(fetchThunk.fulfilled, (state, action) => {
          state.status = "loaded";
          state.data = (action.payload ?? null) as any;
        })
        .addCase(fetchThunk.rejected, (state, action) => {
          if ((action.meta as any)?.condition) return;
          state.status = "failed";
          state.error = action.error?.message ?? `${name} fetch failed`;
        });
      extraReducers?.(builder as any);
    }
  });

  const select = (state: any = {}): ResourceState<TData> => state?.[name] ?? initialState;
  const selectData = (state: any = {}): TData | null => select(state).data;

  return {
    name,
    slice,
    reducer: slice.reducer,
    actions: slice.actions,
    fetchThunk,
    select,
    selectData
  };
}
