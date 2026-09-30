// S1 pin — the state layer's slices and factories, tested against the COMMITTED
// lib artifact (what consumers import), not src. Covers the lifecycles the
// factories exist to own: condition guards, the request-version stale-page drop,
// the detail stale-response drop, URL sync, persistence, and the standard slices.
import assert from "node:assert/strict";
import test from "node:test";

const {
  createResourceSlice,
  createPagedListSlice,
  createDetailSlice,
  createRouteStateSlice,
  createPersistMiddleware,
  readPersistedState,
  createSuiStore,
  Toasts, toastShown, toastDismissed, showToastThunk, selectToasts,
  Popovers, popoverOpened, popoverClosed, popoverClosedIfCurrent, selectOpenPopoverId, selectPopoverAnchor,
  ConfirmDialog, confirmActionThunk, resolveConfirmThunk, selectConfirmDialog, _isResolverPending,
  DataTablePreferences, dataTableColumnWidthSet, dataTableColumnWidthReset, dataTableColumnHiddenToggled,
  selectDataTablePreferencesForTable, mergeDataTableColumnsWithPreferences,
} = await import("../lib/state/index.js");

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("createResourceSlice: lifecycle, condition guard, invalidated re-arm, failure", async () => {
  let calls = 0;
  const resource = createResourceSlice({
    name: "Thing",
    fetch: async () => { calls += 1; if (calls === 3) throw new Error("boom"); return { n: calls }; },
  });
  const store = createSuiStore({ slices: [resource] });
  assert.equal(resource.select(store.getState()).status, "idle");
  await store.dispatch(resource.fetchThunk());
  assert.deepEqual(resource.select(store.getState()), { status: "loaded", error: null, data: { n: 1 } });
  await store.dispatch(resource.fetchThunk()); // condition: already loaded → skipped
  assert.equal(calls, 1);
  store.dispatch(resource.actions.invalidated());
  assert.equal(resource.select(store.getState()).status, "idle");
  assert.deepEqual(resource.selectData(store.getState()), { n: 1 }, "invalidated keeps data until the refetch lands");
  await store.dispatch(resource.fetchThunk());
  assert.equal(calls, 2);
  assert.deepEqual(resource.selectData(store.getState()), { n: 2 });
  store.dispatch(resource.actions.invalidated());
  await store.dispatch(resource.fetchThunk()); // third call throws
  assert.equal(resource.select(store.getState()).status, "failed");
  assert.equal(resource.select(store.getState()).error, "boom");
});

test("createPagedListSlice: accumulation, hasMore, filter reset, stale-page drop, sort toggle", async () => {
  const gates = [];
  const seenArgs = [];
  const list = createPagedListSlice({
    name: "Rows",
    pageLimit: 2,
    filterKeys: ["q", "bucket"],
    initialSort: "capturedAt",
    fetchPage: (args) => {
      seenArgs.push(args);
      const gate = deferred();
      gates.push(gate);
      return gate.promise;
    },
  });
  const store = createSuiStore({ slices: [list] });

  // page 1
  const p1 = store.dispatch(list.fetchPageThunk());
  gates[0].resolve({ rows: [{ id: "a" }, { id: "b" }], totalFiltered: 3, meta: { total: 3 } });
  await p1;
  assert.deepEqual(list.selectItems(store.getState()).map((r) => r.id), ["a", "b"]);
  assert.equal(list.select(store.getState()).hasMore, true);
  assert.deepEqual(list.select(store.getState()).meta, { total: 3 });
  assert.deepEqual(seenArgs[0], { offset: 0, limit: 2, filters: { q: "", bucket: "" }, sort: "capturedAt", direction: "asc" });

  // page 2 exhausts
  const p2 = store.dispatch(list.fetchPageThunk());
  gates[1].resolve({ rows: [{ id: "c" }], totalFiltered: 3 });
  await p2;
  assert.equal(list.select(store.getState()).hasMore, false);
  assert.equal(list.selectItems(store.getState()).length, 3);

  // condition guard: no more pages → no fetch
  await store.dispatch(list.fetchPageThunk());
  assert.equal(gates.length, 2);

  // filter change resets and re-arms; a STALE in-flight page from before the change is dropped
  store.dispatch(list.actions.filterChanged({ key: "bucket", value: "clean" }));
  assert.equal(list.selectItems(store.getState()).length, 0);
  const p3 = store.dispatch(list.fetchPageThunk());        // version 1 request
  store.dispatch(list.actions.filterChanged({ key: "q", value: "x" })); // bump to version 2 mid-flight
  gates[2].resolve({ rows: [{ id: "stale" }], totalFiltered: 1 });
  await p3;
  assert.equal(list.selectItems(store.getState()).length, 0, "stale page must not splice into the newer filter's list");

  const p4 = store.dispatch(list.fetchPageThunk());
  gates[3].resolve({ rows: [{ id: "fresh" }], totalFiltered: 1 });
  await p4;
  assert.deepEqual(list.selectItems(store.getState()).map((r) => r.id), ["fresh"]);
  assert.equal(seenArgs[3].filters.q, "x");
  assert.equal(seenArgs[3].filters.bucket, "clean");

  // sort toggles direction on the active field and resets
  store.dispatch(list.actions.sortChanged({ field: "capturedAt" }));
  assert.equal(list.select(store.getState()).direction, "desc");
  assert.equal(list.selectItems(store.getState()).length, 0);
  store.dispatch(list.actions.sortChanged({ field: "filename" }));
  assert.deepEqual([list.select(store.getState()).sort, list.select(store.getState()).direction], ["filename", "asc"]);

  // hasMore heuristic without totalFiltered: full page → more, short page → done
  const p5 = store.dispatch(list.fetchPageThunk());
  gates[4].resolve({ rows: [{ id: "h1" }, { id: "h2" }] });
  await p5;
  assert.equal(list.select(store.getState()).hasMore, true);
  const p6 = store.dispatch(list.fetchPageThunk());
  gates[5].resolve({ rows: [{ id: "h3" }] });
  await p6;
  assert.equal(list.select(store.getState()).hasMore, false);
});

test("createDetailSlice: open, stale-response drop, closed", async () => {
  const gatesById = new Map();
  const detail = createDetailSlice({
    name: "Detail",
    fetch: ({ id }) => {
      const gate = deferred();
      gatesById.set(id, gate);
      return gate.promise;
    },
  });
  const store = createSuiStore({ slices: [detail] });

  const openA = store.dispatch(detail.openThunk({ id: "a" }));
  const openB = store.dispatch(detail.openThunk({ id: "b" })); // replaces A while A is in flight
  gatesById.get("b").resolve({ id: "b", body: "current" });
  await openB;
  gatesById.get("a").resolve({ id: "a", body: "stale" });
  await openA;
  assert.equal(detail.select(store.getState()).openId, "b");
  assert.deepEqual(detail.select(store.getState()).data, { id: "b", body: "current" }, "A's slow response must not render over B");

  store.dispatch(detail.actions.closed());
  assert.deepEqual(detail.select(store.getState()), { openId: null, status: "idle", error: null, data: null });
});

test("createRouteStateSlice: pathname pushState, replaceState sync, popstate attach, hash targets", async () => {
  const pushes = [];
  const replaces = [];
  const listeners = new Map();
  // Browser-faithful stubs: pushState/replaceState MOVE the location, so the
  // thunks' already-there short-circuit behaves exactly as it does live.
  const applyUrl = (url) => {
    const hashIndex = url.indexOf("#");
    const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
    const searchIndex = beforeHash.indexOf("?");
    globalThis.location = {
      pathname: searchIndex === -1 ? beforeHash : beforeHash.slice(0, searchIndex),
      search: searchIndex === -1 ? "" : beforeHash.slice(searchIndex),
      hash: hashIndex === -1 ? "" : url.slice(hashIndex),
    };
  };
  globalThis.location = { pathname: "/journey", search: "", hash: "" };
  globalThis.history = {
    pushState: (_s, _t, url) => { pushes.push(url); applyUrl(url); },
    replaceState: (_s, _t, url) => { replaces.push(url); applyUrl(url); },
  };
  const realAdd = globalThis.addEventListener;
  const realRemove = globalThis.removeEventListener;
  globalThis.addEventListener = (type, fn) => listeners.set(type, fn);
  globalThis.removeEventListener = (type) => listeners.delete(type);
  try {
    const nav = createRouteStateSlice({
      strategy: "pathname",
      parse: (location) => ({ view: location.pathname === "/journey" ? "journey" : "corpus" }),
      write: (state) => (state.view === "journey" ? "/journey" : "/"),
    });
    const store = createSuiStore({ slices: [nav] });
    assert.equal(nav.select(store.getState()).view, "journey", "initial state parses the live location");

    store.dispatch(nav.navigateThunk({ view: "corpus" }));
    assert.deepEqual(pushes, ["/"]);
    assert.equal(nav.select(store.getState()).view, "corpus");

    store.dispatch(nav.syncUrlThunk({ view: "journey" }));
    assert.deepEqual(replaces, ["/journey"]);
    store.dispatch(nav.syncUrlThunk({ view: "journey" }));
    assert.equal(replaces.length, 1, "an unchanged URL is not re-written");

    const detach = nav.attach(store);
    globalThis.location = { pathname: "/", search: "", hash: "" };
    listeners.get("popstate")();
    assert.equal(nav.select(store.getState()).view, "corpus", "popstate re-parses the location");
    detach();
    assert.equal(listeners.has("popstate"), false);

    // hash strategy prefixes the written params onto the current path
    globalThis.location = { pathname: "/app", search: "?x=1", hash: "" };
    const hashNav = createRouteStateSlice({
      name: "HashNav",
      strategy: "hash",
      parse: (location) => ({ view: location.hash.replace(/^#view=/, "") || "dashboard" }),
      write: (state) => (state.view === "dashboard" ? "" : `view=${state.view}`),
    });
    const hashStore = createSuiStore({ slices: [hashNav] });
    hashStore.dispatch(hashNav.navigateThunk({ view: "settings" }));
    assert.equal(pushes.at(-1), "/app?x=1#view=settings");
  } finally {
    delete globalThis.location;
    delete globalThis.history;
    globalThis.addEventListener = realAdd;
    globalThis.removeEventListener = realRemove;
  }
});

test("createPersistMiddleware + readPersistedState: save on match, hydrate with normalizer", () => {
  const backing = new Map();
  globalThis.localStorage = {
    getItem: (key) => backing.get(key) ?? null,
    setItem: (key, value) => backing.set(key, value),
  };
  try {
    const { createSlice } = { createSlice: null }; // slices come from lib helpers below
    const sizes = {
      name: "PaneSizes",
      reducer: (state = { sizes: {} }, action) => {
        if (action.type === "PaneSizes/set") return { sizes: { ...state.sizes, [action.payload.id]: action.payload.size } };
        return state;
      },
    };
    const persist = createPersistMiddleware({
      key: "test.paneSizes",
      select: (state) => state.PaneSizes,
      matches: "PaneSizes/",
    });
    const store = createSuiStore({ slices: [sizes], middleware: [persist] });
    store.dispatch({ type: "PaneSizes/set", payload: { id: "rail", size: 240 } });
    assert.equal(backing.get("test.paneSizes"), JSON.stringify({ sizes: { rail: 240 } }));
    store.dispatch({ type: "Other/action" });
    assert.equal(backing.size, 1, "non-matching actions do not write");

    const hydrated = readPersistedState("test.paneSizes", (parsed) => {
      if (!parsed || typeof parsed.sizes !== "object") throw new Error("bad");
      return parsed;
    }, { sizes: {} });
    assert.deepEqual(hydrated, { sizes: { rail: 240 } });
    backing.set("test.paneSizes", "not json{{");
    assert.deepEqual(readPersistedState("test.paneSizes", (v) => v, { sizes: {} }), { sizes: {} }, "corrupt storage falls back");

    // action-creator array matching
    const creator = Object.assign(() => ({ type: "X/did" }), { type: "X/did" });
    const persistByAction = createPersistMiddleware({ key: "test.x", select: () => "x", matches: [creator] });
    const store2 = createSuiStore({ reducers: { X: (s = {}) => s }, middleware: [persistByAction] });
    store2.dispatch({ type: "X/did" });
    assert.equal(backing.get("test.x"), JSON.stringify("x"));
  } finally {
    delete globalThis.localStorage;
  }
});

test("Toasts: shown/dismissed, thunk auto-dismiss for success, errors persist", async () => {
  const store = createSuiStore({ slices: [Toasts] });
  store.dispatch(toastShown({ id: "t1", kind: "error", message: "bad" }));
  assert.deepEqual(selectToasts(store.getState()), [{ id: "t1", kind: "error", message: "bad" }]);
  store.dispatch(toastDismissed({ id: "t1" }));
  assert.equal(selectToasts(store.getState()).length, 0);

  const id = store.dispatch(showToastThunk({ message: "saved", durationMs: 10 }));
  assert.equal(typeof id, "string");
  assert.equal(selectToasts(store.getState()).length, 1);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(selectToasts(store.getState()).length, 0, "success toast auto-dismisses");

  store.dispatch(showToastThunk({ kind: "error", message: "kept" }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(selectToasts(store.getState()).length, 1, "error toasts persist until dismissed");
});

test("Popovers: single-open preemption and scoped close", () => {
  const store = createSuiStore({ slices: [Popovers] });
  store.dispatch(popoverOpened({ id: "a", anchor: { x: 1, y: 2 } }));
  store.dispatch(popoverOpened({ id: "b", anchor: { x: 3, y: 4 } }));
  assert.equal(selectOpenPopoverId(store.getState()), "b", "second open preempts the first");
  store.dispatch(popoverClosedIfCurrent("a"));
  assert.equal(selectOpenPopoverId(store.getState()), "b", "stale scoped close must not clobber the newer popover");
  store.dispatch(popoverClosedIfCurrent("b"));
  assert.equal(selectOpenPopoverId(store.getState()), null);
  store.dispatch(popoverOpened({ id: "c" }));
  store.dispatch(popoverClosed());
  assert.equal(selectPopoverAnchor(store.getState()), null);
});

test("ConfirmDialog: promise resolution, preemption cancels the first ask", async () => {
  const store = createSuiStore({ slices: [ConfirmDialog] });
  const first = store.dispatch(confirmActionThunk({ title: "Delete?", kind: "danger" }));
  assert.equal(selectConfirmDialog(store.getState()).open, true);
  assert.equal(selectConfirmDialog(store.getState()).prompt.kind, "danger");
  const second = store.dispatch(confirmActionThunk({ title: "Again?" }));
  assert.equal(await first, false, "a second confirm auto-cancels the first");
  store.dispatch(resolveConfirmThunk(true));
  assert.equal(await second, true);
  assert.equal(selectConfirmDialog(store.getState()).open, false);
  assert.equal(_isResolverPending(), false, "no leaked resolver");
});

test("DataTablePreferences: widths, hidden toggle, merge helper", () => {
  const store = createSuiStore({ slices: [DataTablePreferences] });
  store.dispatch(dataTableColumnWidthSet({ tableId: "corpus", columnId: "filename", width: 260.4 }));
  store.dispatch(dataTableColumnHiddenToggled({ tableId: "corpus", columnId: "year" }));
  const prefs = selectDataTablePreferencesForTable(store.getState(), "corpus");
  assert.equal(prefs.widthsByColumnId.filename, 260);
  const columns = [{ id: "filename" }, { id: "year" }, { id: "bucket" }];
  const merged = mergeDataTableColumnsWithPreferences(columns, prefs);
  assert.deepEqual(merged.map((c) => c.id), ["filename", "bucket"], "hidden column drops");
  assert.equal(merged[0].width, 260, "width preference applies");
  store.dispatch(dataTableColumnWidthReset({ tableId: "corpus", columnId: "filename" }));
  store.dispatch(dataTableColumnHiddenToggled({ tableId: "corpus", columnId: "year" }));
  assert.equal(selectDataTablePreferencesForTable(store.getState(), "corpus"), null, "empty preferences prune away");
});

test("createSuiStore: mixes factory results and raw slices, rejects duplicates", () => {
  const resource = createResourceSlice({ name: "R", fetch: async () => 1 });
  const store = createSuiStore({ slices: [resource, Toasts] });
  assert.deepEqual(Object.keys(store.getState()).sort(), ["R", "Toasts"]);
  assert.throws(() => createSuiStore({ slices: [Toasts, Toasts] }), /duplicate slice name "Toasts"/);
  assert.throws(() => createSuiStore({ slices: [{}] }), /needs \{name, reducer\}/);
});
