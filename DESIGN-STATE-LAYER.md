# DESIGN: the mc-ui state layer — bringing the memory model into the toolkit

*2026-07-31 · status: proposal (no code). Written immediately after building voice-journey's web app on mc-ui, so every claim about duplication below is measured from that build, not estimated.*

**Reading of the ask.** "The memory model" is read as the Redux Toolkit state architecture both apps share — the `createAsyncThunk → normalized slices → memoized selectors` doctrine, the recurring slice shapes (fetch-once resource, paged list, detail view, UI chrome state), the fetch seam, persistence middlewares, and the providers that feed mc-ui's injection seams. Today that model lives as **convention + copy-paste**: FRONTEND-DOCTRINE.md describes it, and every new app rebuilds it by hand. The question is what it takes to make it **library code** — optionally consumed, so mc-ui core stays a react-only component package.

**TL;DR recommendation.** Do it, as an *optional subpath* (`mc-ui/state`) rather than a core dependency, in four small phases (~5–7 working days total, each independently shippable). The second consumer now exists, which is this package's own bar for extraction — voice-journey just proved every one of these patterns generalizes, by paying the copy tax in full. The state layer then unblocks most of Bucket E (the 11 components excluded from mc-ui *only* because they touch RTK), and a thin scaffold on top gets a future site from `git init` to a themed, tested, doctrine-correct app in under an hour.

---

## 1. What the memory model is today, and where it lives

| Concern | MC (`web/src/state`, 41 modules / 33 slices) | voice-journey (`web/src/state`, 915 LOC) | Nature |
|---|---|---|---|
| Fetch seam | `webApi.js` (59 LOC: `WebApiError`, `webApiJson`, `webApiMutation`, idempotency keys) | **verbatim copy** | Generic |
| Fetch-once resource (`{status, error, data}` + condition guard) | ~20 of 33 slices have this skeleton | `TrendsManager`, `JourneysManager`, `SummaryManager` — 3 hand-built copies | Generic skeleton, domain fetcher |
| Paged list (entity accumulation, request-version guard, filters/sort, `hasMore`) | table-backed managers | `RowsManager` (170 LOC hand-built) | Generic skeleton |
| Detail view (open-id, fetch, stale-response guard) | editor/detail slices | `DetailManager`, `TakeInspectorManager` — 2 copies | Generic skeleton |
| Toasts | `Toasts.js` slice + `ToastTrayComponent` (RTK-coupled, Bucket E) | **slice copied verbatim; tray re-written** (27 LOC) because the component couldn't move | Generic |
| Popover/confirm state | `Popovers.js`, `ConfirmDialog.js` + `RtkPopoverProvider` (~60 LOC), `McIconProvider` (~28 LOC) | used shipped `LocalPopoverProvider` instead | Generic |
| Route state | hash router (`utils/route.js`) | pathname router (`NavigationManager`) — same parse/write/popstate shape, different strategy | Generic shape, two proven strategies |
| Table preferences | `DataTablePreferencesManager` (column widths for `PinnedDataTable`'s host-owned callbacks) | not yet needed | Generic |
| Persistence | 3 hand-rolled localStorage middlewares (`ChatReadReceipts`, `ProjectPins`, `PaneSizes`) | none yet | Generic pattern, 3 copies in MC alone |
| Store assembly | `StoreManager.js` (configureStore + middleware wiring) | adapted copy | Generic |
| Domain state | snapshots, chat, plans, approvals… | corpus rows semantics, referee flow | **Stays host-side, always** |

Of voice-journey's 915 state-layer lines, roughly **600–650 are pattern boilerplate** that a library could own; the domain content (endpoints, field names, verdict semantics) is the remainder. MC's number is proportionally larger.

## 2. Why now

- **The two-consumer bar is met.** mc-ui's own extraction discipline (see the C0–C5 arc) is "extract when a second real consumer proves genericity." That consumer now exists, and the build diary is the proof: webApi copied verbatim, Toasts copied verbatim, three fetch-once slices, a paged-list slice, and two detail slices hand-rolled to the same shapes, a toast tray re-written because the existing one is RTK-coupled.
- **Bucket E is blocked on exactly this.** 11 components / ~950 LOC (ConfirmDialog, ToastTray, ContextMenu, MoreActionsMenu, DataTableColumnMenu, MetaRow, CollapsibleListRail, RailToggle, FocusTabs, FocusSelectionList, SplitWorkspace) are excluded from the package *solely* because they import RTK state. An official state layer converts most of them into ordinary movers under the established bucket-test pattern.
- **The stated goal is spin-up speed.** "All of my sites built quickly in the same opinionated manner" is a framework goal, not a component-library goal. Components cover the *look*; the state layer covers the *behavior*; a scaffold covers the *first hour*.

## 3. Target architecture — four layers, strictly optional above layer 0

```
Layer 0  mc-ui (unchanged)      react-only components, injection seams, data-mc-component contract
Layer 1  mc-ui/state            OPTIONAL subpath: fetch seam, slice factories, standard slices,
                                RTK providers, persistence middleware factory, store helper
Layer 2  state-coupled movers   Bucket E components migrate in, importing Layer 1 internally
Layer 3  scaffold + toolchain   create-mc-app templates, build/test harness helpers, doctrine docs
```

**Packaging decision: subpath, not sibling package.** One repo, one SHA pin (the existing consumer flow), with optionality enforced mechanically:

- `exports` gains `"./state": "./lib/state/index.js"` — apps that never import it never bundle it (esbuild tree-shakes at the subpath boundary; the existing bucket tests already prove this style of isolation for tiptap).
- `@reduxjs/toolkit` and `react-redux` become **peer dependencies marked `peerDependenciesMeta: { optional: true }`** — npm ≥7 auto-installs peers unless marked optional, so this flag is what keeps a components-only consumer RTK-free.
- A CI-style pin test in mc-ui: bundle `import "mc-ui"` alone and assert no RTK identifiers appear in the output. Optionality stays a *tested contract*, not a hope.

**The no-reverse-import rule extends to state.** The library never knows an endpoint, a field name, or a store shape beyond its own slices. Everything domain flows in through arguments: fetchers, param serializers, id extractors. This is the same inversion as `IconContext`/`PopoverControllerContext`, applied to data.

## 4. API sketch (shapes, not final signatures)

**Slice factories** — the highest-leverage piece. Each encodes a lifecycle the doctrine currently re-explains per slice:

```js
// fetch-once resource: {status, error, data} + in-flight/loaded condition guard
export const TrendsManager = createResourceSlice({
  name: "TrendsManager",
  fetch: () => webApiJson("/api/trends", { label: "Trends" }),
});
// → { slice, fetchThunk, select, selectData } — extraReducers/reducers options for extension

// paged list: entity accumulation + request-version guard + filters/sort + hasMore
export const RowsManager = createPagedListSlice({
  name: "RowsManager",
  pageLimit: 100,
  filterKeys: ["q", "bucket", "year", /* … */],
  fetchPage: (params) => webApiJson(`/api/rows?${params}`, { label: "Rows" }),
  getPage: (payload) => ({ rows: payload.rows, totalFiltered: payload.page?.totalFiltered }),
});
// → filterChanged/sortChanged/filtersCleared actions with the reset-and-bump semantics built in

// detail view: open-id + fetch + stale-response drop
export const DetailManager = createDetailSlice({
  name: "DetailManager",
  fetch: ({ id }) => webApiJson(`/api/row/${encodeURIComponent(id)}`, { label: "Row detail" }),
});
```

**Standard slices + their components** (move as matched pairs): `Toasts` + `ToastTray`, `Popovers` + `RtkPopoverProvider`, `ConfirmDialog` + its dialog, `DataTablePreferences` (keyed by `tableId`, feeding `PinnedDataTable`'s existing callbacks), `Layout` (`isMobile` against the shipped 880px clamp constant).

**Route state factory** — both proven strategies behind one shape:

```js
export const Navigation = createRouteStateSlice({
  strategy: "pathname",            // or "hash" (MC)
  parse: (location) => ({ view: viewForPathname(location.pathname) }),
  write: (state) => pathnameForView(state.view),
});
```

**Persistence middleware factory** — replaces MC's three hand-rolled copies:

```js
export const persistPaneSizes = createPersistMiddleware({
  key: "mc.paneSizes", select: selectPaneSizes, actions: [paneSizeSet],
});
```

**Store + providers:**

```js
const store = createMcStore({
  slices: [Toasts, Popovers, ConfirmDialog, RowsManager, /* host domain slices */],
  middleware: [persistPaneSizes],
});

<McProviders store={store} icons={renderIcon /* optional */}>
  <App />
</McProviders>
// composes react-redux Provider + RtkPopoverProvider + IconContext in one mount
```

**Escape hatches are part of the contract.** Every factory accepts `reducers` / `extraReducers` extensions and returns the raw slice; selectors compose rather than replace. The rule for what gets a factory: **two existing hand-written instances, minimum** — the same bar components had. No speculative abstractions.

## 5. What moves, what stays

**Bucket E, revisited under Layer 2** (blocker → resolution):

| Component | Today's blocker | With the state layer |
|---|---|---|
| ToastTray | `Toasts` slice import | moves with the slice |
| ConfirmDialog | `ConfirmDialog` slice + `useAppDispatch` | moves with the slice |
| ContextMenu / MoreActionsMenu | `Popovers` actions + `Icon` | moves — popover state ships, icons already seamed via `useIcon` |
| DataTableColumnMenu | `Popovers` + table prefs | moves with `DataTablePreferences` |
| MetaRow | clipboard + popover state | moves |
| CollapsibleListRail / RailToggle | `LayoutManager` + `PaneSizes` | moves if `Layout`/`PaneSizes` ship; else stays (small) |
| FocusTabs / FocusSelectionList / SplitWorkspace | layout state + Icon | case-by-case; SplitWorkspace is plausibly MC-specific — leave until a second consumer wants it |

**Never moves:** domain slices and selectors (snapshots, chat, corpus rows semantics, referee flow), API shapes, chart geometry (voice-journey's charts are domain by prior decision), MC's snapshot reconcile architecture. The library owns *lifecycles*; hosts own *meaning*.

**A note on the earlier scope decision.** "Bucket E stays host-side" was decided this week *because* mc-ui was Redux-free — that rationale, not the outcome, was the decision. An optional state layer changes the rationale, so the outcome is properly back on the table; this document is the re-decision request, not a quiet reversal.

## 6. Toolchain and scaffold (Layer 3)

What a new project actually copied this week, beyond state: `scripts/build-web.mjs` (esbuild + the fail-loud mc-ui preflight), `tsconfig.json`, the theme-override CSS file, the entry-point provider wiring, the bundle-smoke test harness, an e2e skeleton. All of it is generic. Two delivery mechanisms, used for different halves:

- **Library imports** for logic that should track the package: `mc-ui/build` exporting `buildWebApp({ entry, outfile })` (esbuild wrapper + preflight) and `mc-ui/testing` exporting `bundleAndImport`, `renderAppInChild` — the child-process render helper that exists because *the bundled React graph holds Node's event loop open and wedges `node --test`*, a real failure mode discovered twice this week and worth solving exactly once.
- **Templates copied at init** for files the app will edit: `theme.css` (`:root` token override skeleton, with the token registry documented — the contract grew ~20 tokens with Bucket D and currently lives nowhere), `main.jsx`, `tsconfig.json`, a first slice + page. Delivered as `npx create-mc-app` (a `bin` in mc-ui) or a documented `degit`-style copy; copied files degrade gracefully and never lock the app to the generator.

Also worth capturing in-package while it's fresh: **build discipline notes** — compile `lib/` with the pinned TypeScript (5.8.x; a stray `npx tsc` picked up TS 7 and churned every artifact), and expect benign `.d.ts` drift across `@types/react` patch versions.

## 7. Phased plan, effort, validation

Grounded in this week's measured pace (the voice-journey state layer — 10 slices, 915 LOC — took about half a day *with the patterns already memorized*; the factories are those same patterns written once, carefully):

| Phase | Content | Effort | Ships when |
|---|---|---|---|
| **S1** | `mc-ui/state`: webApi seam, 3 slice factories, Toasts/Popovers/ConfirmDialog/DataTablePreferences slices, route + persist factories, `createMcStore`/`McProviders`, optional-peer wiring, no-RTK-leak pin test | 2–3 days | its own tests green |
| **S2** | voice-journey adopts S1 (delete ~600 LOC of hand-rolled skeleton, keep domain) — **the API's proof, done before MC touches it** | 0.5–1 day | 82-test suite + e2e green, state snapshots equivalent |
| **S3** | Bucket E migration under the bucket-test pattern (resolve-from-package, byte-identical markup, barrel repoint) | 1–2 days | bucket-e pin test green in MC |
| **S4** | `create-mc-app` + `mc-ui/build` + `mc-ui/testing`; FRONTEND-DOCTRINE content moves into package docs so the opinion travels with the library | 1 day | a scratch app scaffolds and builds |

MC adoption of the factories is deliberately **opportunistic, not big-bang**: 33 existing slices keep working untouched; new slices use factories; old ones migrate when touched for other reasons. The validation pattern for any migrated slice is mechanical: dispatch a recorded action sequence against old and new, assert deep-equal state snapshots — the state-layer analogue of the byte-identical render tests.

**Sequencing note:** S1+S2 form the smallest loop that proves the design against a real app. If S2 hurts, stop and revise before Bucket E moves anything.

## 8. Risks and mitigations

- **RTK version skew across consumers.** Peer ranges (`>=2`), and the factories confine themselves to long-stable RTK API (`createSlice`, `createAsyncThunk`, `createSelector`). No RTK Query — the doctrine's existing "STOP and elevate" line holds for the library too.
- **Over-abstraction.** The two-instances bar, escape hatches on every factory, and S2 as a forcing function. A factory that can't express `RowsManager` verbatim-equivalently gets fixed or dropped before anything else builds on it.
- **Optionality erosion.** The no-RTK-leak bundle test makes it structural. Components-only consumers must stay exactly as light as today.
- **Doctrine drift between the doc and the code.** Solved by making the code the doc: factories carry the doctrine in their implementation, and the prose moves into package docs (S4).
- **Maintenance surface.** Real but bounded: everything proposed already exists as code being maintained *twice*. The library consolidates maintenance; it doesn't add a third copy.
- **Framework lock-in for future non-RTK apps.** None: Layer 0 remains a complete, independent offering; a Svelte or vanilla site can consume components + CSS and ignore Layers 1–3 entirely.

## 9. Decisions requested

1. **Approve the direction** — optional `mc-ui/state` subpath (supersedes "Bucket E stays host-side" *by design*, per §5's note).
2. **Approve S1+S2 first** as the proof loop, with S3/S4 gated on S2's outcome.
3. **Naming/packaging** — subpath `mc-ui/state` (recommended) vs sibling package `mc-state`; recommendation is the subpath for one-pin ergonomics, with the optional-peer + leak-test mechanics making it safe.
4. **Bucket E boundary calls** — SplitWorkspace/FocusTabs left host-side until a second consumer wants them; confirm or override.
