import { createAsyncThunk, createSlice, type ActionReducerMapBuilder } from "@reduxjs/toolkit";

// ============================================================================
// createDetailSlice — the detail-view skeleton.
//
// One record open at a time: `openThunk({ id })` records the open id and
// fetches; responses for anything but the currently-open id are DROPPED (the
// stale-response guard detail views keep hand-implementing — open A, quickly
// open B, A's slow response must not render over B). `closed()` clears everything, so fetched detail never
// outlives its view.
// ============================================================================

export type DetailStatus = "idle" | "loading" | "loaded" | "failed";

export interface DetailState<TData = any> {
  openId: string | null;
  status: DetailStatus;
  error: string | null;
  data: TData | null;
}

export interface CreateDetailSliceOptions<TData> {
  name: string;
  fetch: (arg: { id: string }, thunkApi: any) => Promise<TData> | TData;
  reducers?: Record<string, (state: DetailState<TData>, action: any) => void>;
  extraReducers?: (builder: ActionReducerMapBuilder<DetailState<TData>>) => void;
}

export function createDetailSlice<TData = any>({ name, fetch, reducers = {}, extraReducers }: CreateDetailSliceOptions<TData>) {
  const initialState: DetailState<TData> = { openId: null, status: "idle", error: null, data: null };

  const openThunk = createAsyncThunk(`${name}/fetch`, fetch);

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      closed() {
        return initialState;
      },
      ...reducers
    },
    extraReducers: (builder) => {
      builder
        .addCase(openThunk.pending, (state, action) => {
          state.openId = (action.meta.arg as any)?.id ?? null;
          state.status = "loading";
          state.error = null;
          state.data = null;
        })
        .addCase(openThunk.fulfilled, (state, action) => {
          if ((action.meta.arg as any)?.id !== state.openId) return; // stale response for a since-closed/replaced view
          state.status = "loaded";
          state.data = (action.payload ?? null) as any;
        })
        .addCase(openThunk.rejected, (state, action) => {
          if ((action.meta.arg as any)?.id !== state.openId) return;
          state.status = "failed";
          state.error = action.error?.message ?? `${name} fetch failed`;
        });
      extraReducers?.(builder as any);
    }
  });

  const select = (state: any = {}): DetailState<TData> => state?.[name] ?? initialState;

  return {
    name,
    slice,
    reducer: slice.reducer,
    actions: slice.actions,
    openThunk,
    select
  };
}
