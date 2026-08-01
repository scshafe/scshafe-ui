import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
export function createDetailSlice({ name, fetch, reducers = {}, extraReducers }) {
    const initialState = { openId: null, status: "idle", error: null, data: null };
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
                state.openId = action.meta.arg?.id ?? null;
                state.status = "loading";
                state.error = null;
                state.data = null;
            })
                .addCase(openThunk.fulfilled, (state, action) => {
                if (action.meta.arg?.id !== state.openId)
                    return; // stale response for a since-closed/replaced view
                state.status = "loaded";
                state.data = (action.payload ?? null);
            })
                .addCase(openThunk.rejected, (state, action) => {
                if (action.meta.arg?.id !== state.openId)
                    return;
                state.status = "failed";
                state.error = action.error?.message ?? `${name} fetch failed`;
            });
            extraReducers?.(builder);
        }
    });
    const select = (state = {}) => state?.[name] ?? initialState;
    return {
        name,
        slice,
        reducer: slice.reducer,
        actions: slice.actions,
        openThunk,
        select
    };
}
