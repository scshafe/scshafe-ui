# @scshafe/ui

The SCSHAFE standard frontend library: framework-light React components with no domain
coupling, a token-driven stylesheet, and optional state, icon, identity, build and testing
layers. Every component renders a stable `data-sui-component` marker and `sui-` classes, which
are the test contract hosts pin.

Requires Node 22.22+ or 24.18+ and React 18 or newer.

## Install

The package is on GitHub Packages. Map the scope in your project's `.npmrc` (this line only,
committed):

```ini
@scshafe:registry=https://npm.pkg.github.com
```

Put a token with `read:packages` in your **user-level** npmrc (in `$HOME`, as the auth token
for `//npm.pkg.github.com/`), never in the project. In GitHub Actions use the job token through
`actions/setup-node` (`registry-url: https://npm.pkg.github.com`, `NODE_AUTH_TOKEN`), after the
package grants your repository read access. Then install an exact version:

```sh
pnpm add --save-exact @scshafe/ui@0.2.0 react react-dom
```

### Peer dependencies

| Peer | Needed for | Required |
| --- | --- | --- |
| `react` `>=18` | everything | yes |
| `react-dom` `>=18` | rendering; `@scshafe/ui/testing` renders with `react-dom/server` | optional |
| `@reduxjs/toolkit` `>=2`, `react-redux` `>=9` | `@scshafe/ui/state` | optional |
| `iconoir-react` `>=7` | `@scshafe/ui/icons` | optional |
| `esbuild` `>=0.20` | `@scshafe/ui/build`, `@scshafe/ui/testing` | optional |

Install the peers you use as direct dependencies of your app. The root export pulls in no Redux
and no icon library (pinned by `test/state-optionality.test.mjs`). The tiptap editor stack
(`MarkdownEditor`) is a regular dependency today; it moves to its own subpath with optional
peers in 0.3.0.

## Usage

```tsx
import { Stack, Inline, Button, Status, EmptyState } from "@scshafe/ui";
import "@scshafe/ui/layout.css";      // layout primitives + the workspace frame contract
import "@scshafe/ui/components.css";  // every component's styles

<Stack gap="md" align="stretch">
  <Inline gap="xs" wrap>
    <Status state="running" />
    <Button label="Save" variant="primary" />
  </Inline>
  <EmptyState message="Nothing here yet." />
</Stack>
```

Types (`SpaceToken`, `ClampToken`, `StatusTone`, `BaseLayoutProps`, per-component `*Props`, …)
are exported from the package root.

## Subpaths

| Import | Contents |
| --- | --- |
| `@scshafe/ui` | Layout primitives, components, the Tooltip/Popover/Icon seams, `format` helpers |
| `@scshafe/ui/state` | Optional Redux Toolkit layer: `createSuiStore`, `SuiProviders`, slice factories, standard slices, state-backed components |
| `@scshafe/ui/icons` | Optional default icon layer over `iconoir-react`: `DefaultIconProvider`, `Icon`, the semantic name registry |
| `@scshafe/ui/identity` | Optional proxy-session seam: `UserMenu`, `useIdentity`, `buildSignOutUrl` |
| `@scshafe/ui/build` | `buildWebApp` (esbuild wrapper with a fail-loud `@scshafe/ui` preflight) |
| `@scshafe/ui/testing` | `bundleEntry`, `runNodeChild`, `createSpaRenderHarness` for hermetic render tests |
| `@scshafe/ui/tokens` | The token registry as data: `SUI_TOKENS`, `SUI_TOKEN_NAMES`, `SUI_COMPONENT_VARIABLES` |
| `@scshafe/ui/format` | Generic formatting helpers (`toneByState`, `timestamp`, `esc`, `plural`, …) |
| `@scshafe/ui/layout.css`, `components.css`, `tokens.css` | Stylesheets |

## Components

**Layout primitives.** `Stack` · `Inline` · `Grid` · `Pane` · `Scroll` — thin, accessible wrappers
over the `--sui-space-*` tokens, import-closed (react and each other only).

**Workspace frame contract.** The classes `.sui-app-frame` / `.sui-app-shell[--contained]` /
`.sui-workspace` / `.sui-focus-area` / `.sui-workspace-panel` / `.sui-fill` (in `layout.css`) give
a contained-scroll app frame: chrome stays fixed, one growing child scrolls. `FocusTabs` (an
icon-first, model-driven tab strip) and `TabPanelHeader` render inside it.

**Components.** `Kbd` · `Sheet` · `PinnedDataTable` · `MarkdownEditor` · `Tooltip` · `HoverCard` ·
`Popover` · `Badge` · `Status` · `StatCount` · `Description` · `InputField` / `SelectField` /
`TextAreaField` · `Identifier` · `Label` · `Title` · `Copyable` · `MarkdownContent` · `EmptyState` ·
`List` · `ListRow` · `Panel` / `PanelHeader` · `Reader` · `Button` / `IconButton` · `HoverButton` ·
`Tab` · `Editor` · `EditableName` · `Card` / `MetricCard` · `ChipList` · `MessageBubble` ·
`RecordMeta` · `InfiniteScrollSentinel`.

**Seams.** A package cannot import its host, so live state is injected: popovers through
`PopoverControllerContext` (mount `LocalPopoverProvider` for a store-free single-open controller,
or `SuiProviders` / `RtkPopoverProvider` with the state layer), icons through `IconContext`
(`DefaultIconProvider`, or your own renderer; with no provider, icons render nothing).

## State layer (`@scshafe/ui/state`)

The Redux Toolkit memory model as library code. Import it through the subpath only. Ships the
`webApiJson` / `webApiMutation` fetch seam; slice factories `createResourceSlice`,
`createPagedListSlice`, `createDetailSlice`, `createRouteStateSlice`; `createPersistMiddleware` +
`readPersistedState`; standard slices `Toasts`, `Popovers`, `ConfirmDialog`,
`DataTablePreferences`, `Layout`, `PaneSizes`; state-backed components (`ToastTray`,
`ConfirmDialogComponent`, `ContextMenu`, `MoreActionsMenu`, `DataTableColumnMenu`, `CollapsibleListRail`,
`RailToggle`, `FocusSelectionList`, `RailWorkspace`); and the app root. Every factory takes
host-injected fetchers; the package never knows an endpoint.

```tsx
import { createSuiStore, createResourceSlice, SuiProviders, Popovers, Toasts, webApiJson } from "@scshafe/ui/state";

const Trends = createResourceSlice({ name: "Trends", fetch: () => webApiJson("/api/trends") });
const store = createSuiStore({ slices: [Toasts, Popovers, Trends] });

<SuiProviders store={store}>
  <App />
</SuiProviders>
```

## Identity (`@scshafe/ui/identity`)

`UserMenu` reads `/oauth2/userinfo` once on mount and shows the identity plus Sign out; loading,
anonymous, failed and un-proxied development responses render nothing. `useIdentity()` exposes
`status: "loading" | "anonymous" | "identified"`, the identified `user`, `email`, optional
`preferredUsername` / `groups`, and a manual `refresh()`. `buildSignOutUrl()` derives the identity
provider's `id.` host from the browser's hostname and returns `null` on IP literals, localhost or a
non-derivable hostname. The package reads no token; identity is display data and authorization
stays on the server. The response shape follows
[oauth2-proxy v7.15.3's UserInfo handler](https://github.com/oauth2-proxy/oauth2-proxy/blob/v7.15.3/oauthproxy.go#L660-L688).

## Theming and tokens

Every theme value is a `--sui-*` custom property. `layout.css` and `components.css` each declare
defaults for the tokens they use (dark defaults), so either works on its own. The full registry,
with every default, ships as `@scshafe/ui/tokens.css` and as data from `@scshafe/ui/tokens`:

| Group | Tokens |
| --- | --- |
| Text and accent | `--sui-text` `--sui-text-strong` `--sui-muted` `--sui-blue` `--sui-accent` `--sui-accent-hover` `--sui-accent-subtle` `--sui-green` `--sui-ok` `--sui-ok-subtle` |
| Surfaces | `--sui-bg` `--sui-panel` `--sui-card` `--sui-bg-elevated` `--sui-bg-hover` `--sui-surface-2` `--sui-popover` |
| Hairlines | `--sui-line` `--sui-border` `--sui-border-strong` `--sui-border-hover` |
| Floating layers | `--sui-shadow` `--sui-shadow-lg` |
| Corners | `--sui-radius-sm` `--sui-radius-md` `--sui-radius` `--sui-radius-lg` |
| Type | `--sui-mono` `--sui-chat-text-size` |
| Card clamps | `--sui-clamp-2xs` … `--sui-clamp-xl` |
| Spacing | `--sui-space-none` `--sui-space-xs` … `--sui-space-2xl` |

Theme by re-declaring tokens at `:root` after the package stylesheets. Never fork the package
CSS. `test/tokens.test.mjs` keeps the stylesheets and `SUI_TOKENS` identical. Light theme,
reduced motion and focus-visible styles arrive in 0.3.0.

## Development

See [docs/DEVELOPING.md](docs/DEVELOPING.md) for the local checkout, `pnpm link`
co-development and the full check list. In short:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
pnpm run verify   # typecheck, build, tests, payload manifest, pack-twice bytes, packed install smokes
```

`lib/` is build output and is never committed. The frontend doctrine that travels with the
library is [docs/FRONTEND-DOCTRINE.md](docs/FRONTEND-DOCTRINE.md).

## Releasing

Releases follow the SCSHAFE library standard (LIB-06/07). Bump `package.json`, add a
`## x.y.z — date` section to `CHANGELOG.md`, run `pnpm run build && pnpm run release:manifest`,
and commit. Once CI is green on `main`, push an annotated tag `vx.y.z`. `publish.yml` checks the
tag against `main` and the version, runs `verify`, publishes to GitHub Packages, installs the
published version back next to its pinned peers, compares its integrity, runs the JS, React
render and TypeScript smokes, and creates the GitHub Release with the digests. Nobody runs
`pnpm publish` by hand.

## License

MIT
