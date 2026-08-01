import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
export function createResourceSlice({ name, fetch, reducers = {}, extraReducers }) {
    const initialState = { status: "idle", error: null, data: null };
    const fetchThunk = createAsyncThunk(`${name}/fetch`, fetch, {
        condition: (_arg, { getState }) => {
            const status = getState()?.[name]?.status;
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
                state.data = (action.payload ?? null);
            })
                .addCase(fetchThunk.rejected, (state, action) => {
                if (action.meta?.condition)
                    return;
                state.status = "failed";
                state.error = action.error?.message ?? `${name} fetch failed`;
            });
            extraReducers?.(builder);
        }
    });
    const select = (state = {}) => state?.[name] ?? initialState;
    const selectData = (state = {}) => select(state).data;
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
