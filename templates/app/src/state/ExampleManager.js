import { createResourceSlice, webApiJson } from "mc-ui/state";

// A fetch-once resource on the doctrine skeleton — replace /api/example with a
// real endpoint. See createPagedListSlice / createDetailSlice for lists + details.
const example = createResourceSlice({
  name: "ExampleManager",
  fetch: () => webApiJson("/api/example", { label: "Example" })
});

export const ExampleManager = example.slice;
export const fetchExampleThunk = example.fetchThunk;
export const selectExample = example.select;
