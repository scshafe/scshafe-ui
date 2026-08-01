# The frontend doctrine (package edition)

*S4: the opinion travels with the library. Adapted from Mission Control's
FRONTEND-DOCTRINE.md, which remains authoritative for MC-specific process; this
edition states the parts every mc-ui consumer follows — and since S1, the state
layer's factories carry most of them in code, so "follow the doctrine" is mostly
"use the factory".*

## State

- **`createAsyncThunk` → slices → memoized selectors.** Server data enters through
  condition-guarded thunks, lands in normalized slice state, and reaches components
  only through selectors (`createSelector` for anything derived). Components never
  fetch, never own server state.
- **No RTK Query.** Its cache is a parallel state system with its own lifecycle
  vocabulary; adopting it is a documented STOP-and-elevate divergence, not a local
  choice. The factories exist so the thunk pattern costs nothing.
- **The recurring lifecycles are factory calls, not hand-rolls:**
  `createResourceSlice` (fetch-once `{status, error, data}`),
  `createPagedListSlice` (infinite-scroll accumulation + the request-version
  stale-page guard), `createDetailSlice` (one-open + stale-response drop),
  `createRouteStateSlice` (URL ↔ store), `createPersistMiddleware` (localStorage).
  Hand-write a slice only when it is genuinely a domain state machine (a referee
  flow, a chat transcript) — and prefer composing two factory slices over nesting
  state (a dependent detail resets via `extraReducers` on the parent's actions).
- **The store is a manifest**: `createMcStore({ slices: [...] })`, standard slices
  (`Toasts`, `Popovers`, `ConfirmDialog`, `DataTablePreferences`) alongside domain
  slices. One `McProviders` mount at the root.
- **The library never knows your endpoints.** Factories take injected fetchers over
  the `webApiJson`/`webApiMutation` seam; param serialization and payload shapes are
  host code, kept beside the slice that owns them.

## Components

- Consume mc-ui components through your barrel or directly; the `data-mc-component`
  markers and class names are a frozen test contract — pin them, don't restyle by
  editing the package.
- Host-owned state, injected seams: icons via `IconContext`/`useIcon`, popovers via
  the `Popovers` slice (through `McProviders`) or `LocalPopoverProvider` store-free,
  table preferences via `DataTablePreferences` feeding `PinnedDataTable`'s callbacks,
  paging via `InfiniteScrollSentinel` + `createPagedListSlice`.
- Domain components stay in the app. The extraction bar for moving one into the
  package: two real consumers, byte-identical render, no reverse-imports.

## Theming

- Import `mc-ui/layout.css` + `mc-ui/components.css`, then override `:root` tokens in
  your own theme.css (the token registry is documented in the scaffold's theme.css).
  Never fork the package CSS; deliberate same-selector overrides after the package
  links are the escape hatch.

## Build + test

- Bundle with `mc-ui/build`'s `buildWebApp` (esbuild + the fail-loud mc-ui
  preflight); output is gitignored, built on the serving host.
- Compile any committed lib with the pinned TypeScript (drift churns artifacts).
- Test against built artifacts, hermetically: `mc-ui/testing`'s `bundleEntry` +
  `runNodeChild`/`createSpaRenderHarness` (child-process rendering, because a
  bundled React graph holds Node's event loop open and wedges `node --test`).
  HTTP tests bind port 0. Render smokes assert the marker contract, not pixels.
