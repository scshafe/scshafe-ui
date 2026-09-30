import { createSlice, type Dispatch } from "@reduxjs/toolkit";

// ============================================================================
// createRouteStateSlice — URL ↔ store sync, both proven strategies.
//
// A hash router (`#view=…&project=…`) or a pathname router (the server owns
// the HTML routes). Same shape either way: `parse(location)` derives route state, `write(state)` serializes
// it back, `navigateThunk(partial)` merges + pushState + dispatches, and
// `attach(store)` installs the popstate listener so back/forward re-parse.
// The host owns vocabulary (views, params); the factory owns the sync.
//
// Server rendering: with no `location`, state initializes from
// parse({pathname:"/", search:"", hash:""}) and attach() is a no-op.
// ============================================================================

export interface RouteLocationLike {
  pathname: string;
  search: string;
  hash: string;
}

export interface CreateRouteStateSliceOptions<TState extends Record<string, any>> {
  name?: string;
  strategy?: "pathname" | "hash";
  parse: (location: RouteLocationLike) => TState;
  write: (state: TState) => string;
}

function currentLocation(): RouteLocationLike {
  const location = (globalThis as any).location;
  if (!location) return { pathname: "/", search: "", hash: "" };
  return { pathname: location.pathname ?? "/", search: location.search ?? "", hash: location.hash ?? "" };
}

export function createRouteStateSlice<TState extends Record<string, any> = Record<string, any>>({
  name = "Navigation",
  strategy = "pathname",
  parse,
  write
}: CreateRouteStateSliceOptions<TState>) {
  const slice = createSlice({
    name,
    initialState: () => parse(currentLocation()),
    reducers: {
      routeChanged(_state, action: any) {
        return action.payload as TState;
      }
    }
  });

  // createSlice's payload inference trips on the generic replace-reducer; pin the creator's payload type.
  const routeChanged = slice.actions.routeChanged as unknown as ((payload: TState) => { type: string; payload: TState });

  function targetFor(state: TState): string {
    const location = currentLocation();
    if (strategy === "hash") {
      const written = write(state);
      return `${location.pathname}${location.search}${written ? `#${written.replace(/^#/, "")}` : ""}`;
    }
    return write(state);
  }

  function navigateThunk(next: Partial<TState>) {
    return (dispatch: Dispatch, getState: () => any): void => {
      const current: TState = getState()?.[name] ?? parse(currentLocation());
      const nextState = { ...current, ...next } as TState;
      const target = targetFor(nextState);
      const location = currentLocation();
      const currentUrl = `${location.pathname}${location.search}${location.hash}`;
      if (currentUrl !== target) (globalThis as any).history?.pushState?.(null, "", target);
      dispatch(routeChanged(nextState));
    };
  }

  // Keep the URL in sync WITHOUT a history entry (filter state, tab state) —
  // the replaceState counterpart of navigateThunk.
  function syncUrlThunk(next: Partial<TState>) {
    return (dispatch: Dispatch, getState: () => any): void => {
      const current: TState = getState()?.[name] ?? parse(currentLocation());
      const nextState = { ...current, ...next } as TState;
      const target = targetFor(nextState);
      const location = currentLocation();
      const currentUrl = `${location.pathname}${location.search}${location.hash}`;
      if (currentUrl !== target) (globalThis as any).history?.replaceState?.(null, "", target);
      dispatch(routeChanged(nextState));
    };
  }

  // Install the browser listener; returns a detach function. No-op without a window.
  function attach(store: { dispatch: Dispatch }): () => void {
    const target = (globalThis as any).addEventListener ? globalThis : null;
    if (!target) return () => {};
    const onPopState = () => {
      store.dispatch(routeChanged(parse(currentLocation())));
    };
    (target as any).addEventListener("popstate", onPopState);
    return () => (target as any).removeEventListener("popstate", onPopState);
  }

  const select = (state: any = {}): TState => state?.[name] ?? parse(currentLocation());

  return {
    name,
    slice,
    reducer: slice.reducer,
    actions: slice.actions,
    routeChanged,
    navigateThunk,
    syncUrlThunk,
    attach,
    select
  };
}
