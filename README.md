# @scshafe/ui

Mission Control's generic frontend component package — framework-light React components with
no domain coupling, consumable by MC and other projects (the sibling of `graphpaper`).

## Layers

**Layout primitives (this release).** `Stack` · `Inline` · `Grid` · `Pane` · `Scroll` — thin,
accessible wrappers over CSS layout tokens (`--sui-space-*`). Import-closed: they depend only on
`react` and each other (via `layoutShared` — pure types + `resolveBaseAttrs`/`spaceClass`/
`joinClasses` helpers). This is the layout substrate an app renders through, and the home for a
responsive/mobile pass.

**Generic components — Bucket A (C2).** `Kbd` · `Sheet` (`SheetHeader`/`SheetBody`/`SheetFooter`) ·
`PinnedDataTable` · `MarkdownEditor`. The first three are import-closed (react only); `MarkdownEditor`
adds the tiptap editor stack (`@tiptap/react` · `@tiptap/starter-kit` · `@tiptap/extension-link` ·
`@tiptap/extension-placeholder` · `tiptap-markdown`, declared as package deps). Their styles ship in
`@scshafe/ui/components.css`.

**Tooltip family + Bucket B (C3).** The render + seam layer: `Tooltip` · `HoverCard` · `Popover`
(now driven by an injected `PopoverController` — mount `LocalPopoverProvider` for a self-contained
single-open controller, or inject your own; the `IconContext` seam + `useIcon` let a host supply its
icon set) plus the Tooltip-decoupled leaves & composites — `Badge` · `Description` ·
`InputField`/`SelectField`/`TextAreaField` · `Identifier` · `Label` · `Title` · `Copyable` ·
`MarkdownContent` · `EmptyState` · `List` · `Panel`/`PanelHeader` · `Reader`. Their styles ship in
`@scshafe/ui/components.css`. (These are `.jsx`/`.js` sources compiled via `allowJs`; a package cannot
reverse-import its host, so the contexts live here and the host re-provides live state.)

More layers (Button/IconButton, Tab, Editor, EditableName — Bucket C) follow as their couplings are
decoupled — see `DESIGN-FRONTEND-COMPONENT-PACKAGE.md` at the repo root for the extraction arc.

**Pagination + format (P1).** `InfiniteScrollSentinel` / `useInfiniteScroll` — an IntersectionObserver
sentinel with host-owned paging state (the package observes and calls `onLoadMore`; the host owns
offset/hasMore/inFlight and does the fetching — the `PinnedDataTable` philosophy applied to paging).
`@scshafe/ui/format` (also re-exported from the root) — the generic formatting helpers moved out of MC's
`utils/format.js`: `toneByState` (the default workflow-state → tone vocabulary; extend via
`new Map([...toneByState, …])`) · `timestamp` · `esc` · `classToken` · `plural` · `shortRef`.

**State layer — OPTIONAL (S1, `@scshafe/ui/state`).** The Redux Toolkit memory model both consumers
carried by hand, as library code (see `DESIGN-STATE-LAYER.md`). Import via the subpath only —
the root export pulls zero RTK (pinned by `test/state-optionality.test.mjs`), and
`@reduxjs/toolkit` / `react-redux` are *optional* peer dependencies, so components-only
consumers stay exactly as light as before. Ships: the `webApiJson`/`webApiMutation` fetch seam ·
slice factories `createResourceSlice` (fetch-once `{status,error,data}` with condition guard) /
`createPagedListSlice` (infinite-scroll accumulation with the request-version stale-page guard;
pairs with `InfiniteScrollSentinel`) / `createDetailSlice` (one-open detail with the
stale-response drop) · standard slices `Toasts` / `Popovers` / `ConfirmDialog` /
`DataTablePreferences` (the state half of `PinnedDataTable`'s width callbacks) ·
`createRouteStateSlice` (pathname + hash strategies) · `createPersistMiddleware` +
`readPersistedState` · `createSuiStore` and the `SuiProviders` app root (`RtkPopoverProvider`
drives the popover seam from the `Popovers` slice; `LocalPopoverProvider` remains the
store-free alternative). Every factory takes host-injected fetchers — the package never knows
an endpoint — and accepts `reducers`/`extraReducers` extensions.

```tsx
import { createSuiStore, createResourceSlice, SuiProviders, Popovers, Toasts, webApiJson } from "@scshafe/ui/state";

const Trends = createResourceSlice({ name: "Trends", fetch: () => webApiJson("/api/trends") });
const store = createSuiStore({ slices: [Toasts, Popovers, Trends] });

<SuiProviders store={store}>
  <App />
</SuiProviders>
```

## Identity (`@scshafe/ui/identity`)

The React-only proxy-session seam is optional and stays out of the root barrel.
`UserMenu` reads `/oauth2/userinfo` once on mount and shows identity plus Sign out;
loading, anonymous, failed, and un-proxied development responses render nothing.
The hook exposes `status: "loading" | "anonymous" | "identified"`; identified
results contain `user`, `email`, optional `preferredUsername`/`groups`, and every
result includes a manual `refresh()`. There is no polling or focus refresh.

```tsx
import { UserMenu, useIdentity, buildSignOutUrl } from "@scshafe/ui/identity";
import "@scshafe/ui/components.css";

function Account() {
  const identity = useIdentity();
  return <><UserMenu identity={identity} /><button onClick={() => void identity.refresh()}>Refresh identity</button></>;
}
// Or mount <UserMenu /> alone. Hosts with existing state pass identity directly.
```

`buildSignOutUrl()` derives Pocket ID's `id.` host from the browser's suffix,
preserves oauth2-proxy's `{id_token}` substitution, and returns to the app root.
It returns `null` on IP literals, localhost, or a non-derivable hostname. No token
is read by this package. Identity is display data; authorization stays on the
server. The response shape follows
[oauth2-proxy v7.15.3's UserInfo handler](https://github.com/oauth2-proxy/oauth2-proxy/blob/v7.15.3/oauthproxy.go#L660-L688),
including optional fields and ignored `additionalClaims`.

Paved-road P1 supplies imports only. P4 deployment enrollment also requires a
source-controlled gated manifest in Mission Control's `docs/conductor/`, pinned
by `test/conductor-shipped-manifests.test.mjs`; a `deploy.conf` alone is insufficient.

## Usage

```tsx
import { Stack, Inline, Grid, Pane, Scroll, Kbd, Sheet, PinnedDataTable, MarkdownEditor } from "@scshafe/ui";
import "@scshafe/ui/layout.css";     // layout-primitive styles (self-contained; theme via the --sui-space-* tokens)
import "@scshafe/ui/components.css"; // Bucket-A component styles (Kbd / Sheet / PinnedDataTable / MarkdownEditor)

<Stack gap="md" align="stretch">
  <Inline gap="xs" wrap>…</Inline>
</Stack>
```

Types (`SpaceToken`, `ClampToken`, `StatusTone`, `BaseLayoutProps`, per-component `*Props`, …) are
re-exported from the package root.

## Build

TSX source in `src/` compiles to `lib/*.js` + `lib/*.d.ts` (committed): `npm run build`. Consumers'
bundlers (esbuild) bundle `lib/*.js`; TypeScript resolves `lib/*.d.ts`. `react` is a peer dependency.

## Styling

`import "@scshafe/ui/layout.css"` — self-contained, carved from Mission Control's stylesheet. It defines
default `--sui-space-*` spacing tokens at `:root`; override them to theme. (Mission Control itself
keeps its own global stylesheet, so this file is for standalone consumers.)
