# @scshafe/ui

The SCSHAFE standard frontend library: framework-light React components with no domain
coupling, a token-driven stylesheet, and optional state, icon, identity, build and testing
layers. Every component renders a stable `data-sui-component` marker and `sui-` classes, which
are the test contract hosts pin. Light and dark themes, reduced motion and keyboard focus
are built in, checked against WCAG 2.2 AA ([docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)).

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
pnpm add --save-exact @scshafe/ui@0.3.0 react react-dom
```

### Peer dependencies

| Peer | Needed for | Required |
| --- | --- | --- |
| `react` `>=18` | everything | yes |
| `react-dom` `>=18` | rendering; `@scshafe/ui/testing` renders with `react-dom/server` | optional |
| `@reduxjs/toolkit` `>=2`, `react-redux` `>=9` | `@scshafe/ui/state` | optional |
| `iconoir-react` `>=7` | `@scshafe/ui/icons` | optional |
| `esbuild` `>=0.20` | `@scshafe/ui/build`, `@scshafe/ui/testing` | optional |
| `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder` `^3.23.6`, `tiptap-markdown` `^0.9.0` | `@scshafe/ui/editor` | optional |

Install the peers you use as direct dependencies of your app. The package has no hard
dependencies. The root export and every subpath except `/editor` pull in no Redux, no icon
library and no tiptap (pinned by `test/state-optionality.test.mjs` and `test/editor.test.mjs`).

**pnpm installs optional peers by default.** pnpm 10's `auto-install-peers=true` also installs
optional peers, so a plain `pnpm add @scshafe/ui` brings in the tiptap packages even if you never
import `/editor`. To keep them out, add `auto-install-peers=false` to the project's `.npmrc` (and
install the peers you use explicitly, as the tables above list).

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
| `@scshafe/ui` | Layout primitives, components, the Tooltip/Popover/Icon seams, `format` helpers, `applySuiTheme` / `useSuiTheme` |
| `@scshafe/ui/state` | Optional Redux Toolkit layer: `createSuiStore`, `SuiProviders`, slice factories, standard slices, state-backed components |
| `@scshafe/ui/icons` | Optional default icon layer over `iconoir-react`: `DefaultIconProvider`, `Icon`, the semantic name registry |
| `@scshafe/ui/identity` | Optional proxy-session seam: `UserMenu`, `useIdentity`, `IdentityConfigProvider`, `buildSignOutUrl` |
| `@scshafe/ui/editor` | Optional tiptap markdown editor: `MarkdownEditor` (needs the tiptap peers) |
| `@scshafe/ui/build` | `buildWebApp` (esbuild wrapper with a fail-loud `@scshafe/ui` preflight) |
| `@scshafe/ui/testing` | `bundleEntry`, `runNodeChild`, `createSpaRenderHarness` for hermetic render tests |
| `@scshafe/ui/tokens` | The token registry as data: `SUI_TOKENS` (light and dark values), `SUI_TOKEN_NAMES`, `SUI_THEMES`, `SUI_THEME_ATTRIBUTE`, `suiTokenValue`, `SUI_COMPONENT_VARIABLES` |
| `@scshafe/ui/format` | Generic formatting helpers (`toneByState`, `timestamp`, `esc`, `plural`, …) |
| `@scshafe/ui/layout.css`, `components.css`, `tokens.css` | Stylesheets |

## Components

**Layout primitives.** `Stack` · `Inline` · `Grid` · `Pane` · `Scroll` — thin, accessible wrappers
over the `--sui-space-*` tokens, import-closed (react and each other only).

**Workspace frame contract.** The classes `.sui-app-frame` / `.sui-app-shell[--contained]` /
`.sui-workspace` / `.sui-focus-area` / `.sui-workspace-panel` / `.sui-fill` (in `layout.css`) give
a contained-scroll app frame: chrome stays fixed, one growing child scrolls. `FocusTabs` (an
icon-first, model-driven tab strip) and `TabPanelHeader` render inside it.

**Components.** `Kbd` · `Sheet` · `PinnedDataTable` · `Tooltip` · `HoverCard` ·
`Popover` · `Badge` · `Status` · `StatCount` · `Description` · `InputField` / `SelectField` /
`TextAreaField` · `Identifier` · `Label` · `Title` · `Copyable` · `MarkdownContent` · `EmptyState` ·
`List` · `ListRow` · `Panel` / `PanelHeader` · `Reader` · `Button` / `IconButton` · `HoverButton` ·
`Tab` · `Editor` · `EditableName` · `Card` / `MetricCard` · `ChipList` · `MessageBubble` ·
`RecordMeta` · `InfiniteScrollSentinel`. `MarkdownEditor` is in `@scshafe/ui/editor`.

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
`preferredUsername` / `groups`, and a manual `refresh()`. The package reads no token; identity is
display data and authorization stays on the server. The response shape follows
[oauth2-proxy v7.15.3's UserInfo handler](https://github.com/oauth2-proxy/oauth2-proxy/blob/v7.15.3/oauthproxy.go#L660-L688).

Sign out is configured, never guessed: pass the identity provider's end-session endpoint (the
shared auth library supplies it) through `SuiProviders`, `IdentityConfigProvider` or the
`signOut` prop. Without it there is no Sign out link.

```tsx
const signOut = { endSessionEndpoint: "https://id.example.net/api/oidc/end-session" };

<SuiProviders store={store} identity={{ signOut }}>…<UserMenu /></SuiProviders>
// or: <IdentityConfigProvider config={{ signOut }}>…</IdentityConfigProvider>
// or: <UserMenu signOut={signOut} />
```

The link is `/oauth2/sign_out?rd=<endSessionEndpoint>?id_token_hint={id_token}&post_logout_redirect_uri=<origin>/`:
oauth2-proxy clears its session, substitutes `{id_token}` and sends the user to the provider.
`SignOutConfig` also takes `postLogoutRedirectUri`, `proxySignOutPath` (default
`/oauth2/sign_out`) and `idTokenHint: false`. `buildSignOutUrl(config, location)` returns the same
href, or `null` for a missing or unsafe configuration (non-`https:` endpoints outside loopback,
credentials in the URL, a proxy path that is not same-origin).

## Editor (`@scshafe/ui/editor`)

`MarkdownEditor` is a tiptap markdown editor with an imperative handle (`clear`, `setContent`,
`getMarkdown`, `focus`). It is the only part of the package that needs tiptap, so tiptap is an
optional peer: an app that uses the editor installs it next to the package.

```sh
pnpm add --save-exact @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-link @tiptap/extension-placeholder tiptap-markdown
```

```tsx
import { MarkdownEditor } from "@scshafe/ui/editor";

<MarkdownEditor ariaLabel="Message" placeholder="Write…" onChange={setDraft} onSubmit={send} />
```

The editor mounts tiptap after hydration (`immediatelyRender: false`), so it server-renders
its empty shell.

## Theming and tokens

Every theme value is a `--sui-*` custom property with a light and a dark value. The theme
follows the user's `prefers-color-scheme`; `data-sui-theme="light"` or `"dark"` pins one, on the
root element or on any subtree:

```html
<html data-sui-theme="dark">          <!-- server-rendered: pin in the HTML -->
```

```tsx
<SuiProviders store={store} theme="dark">   // "light" | "dark" | "system"
applySuiTheme("light");                      // store-free; returns a restore function
useSuiTheme(preference);                     // pinned while the component is mounted
```

Give the page itself the theme's colours: `body { background: var(--sui-bg); color: var(--sui-text); }`.
`layout.css` and `components.css` each declare the tokens they use, so either works on its own.
The full registry ships as `@scshafe/ui/tokens.css` and as data from `@scshafe/ui/tokens`
(`SUI_TOKENS[i].light` / `.dark`, `themed`, and a contrast `role` for colours):

| Group | Tokens |
| --- | --- |
| Text and accent | `--sui-text` `--sui-text-strong` `--sui-muted` `--sui-blue` `--sui-accent` `--sui-accent-hover` `--sui-accent-subtle` `--sui-green` `--sui-ok` `--sui-ok-subtle` |
| Status tones | `--sui-tone-{green,blue,yellow,orange,red,purple}` and `--sui-tone-<tone>-text` |
| Surfaces | `--sui-bg` `--sui-panel` `--sui-card` `--sui-bg-elevated` `--sui-surface-2` `--sui-popover` `--sui-field` `--sui-bg-hover` `--sui-tint` `--sui-code-bg` `--sui-backdrop` |
| Hairlines and controls | `--sui-line` `--sui-border` `--sui-border-strong` `--sui-border-hover` `--sui-field-border` `--sui-focus-ring` |
| Floating layers | `--sui-shadow` `--sui-shadow-lg` `--sui-shadow-color` |
| Corners | `--sui-radius-sm` `--sui-radius-md` `--sui-radius` `--sui-radius-lg` |
| Type | `--sui-mono` `--sui-chat-text-size` |
| Motion | `--sui-duration` (0s under `prefers-reduced-motion: reduce`) |
| Card clamps | `--sui-clamp-2xs` … `--sui-clamp-xl` |
| Spacing | `--sui-space-none` `--sui-space-xs` … `--sui-space-2xl` |

Theme by re-declaring tokens after the package stylesheets. At `:root` a value applies to both
themes; for one theme, use the package's selectors (they are wrapped in `:where()`, so yours win):

```css
:root { --sui-radius: 4px; }                                        /* both themes */
:root, [data-sui-theme="light"] { --sui-accent: #7a2e9e; }          /* light */
@media (prefers-color-scheme: dark) {
  :root:not([data-sui-theme="light"]) { --sui-accent: #d6a8ff; }  /* dark, from the system */
}
[data-sui-theme="dark"] { --sui-accent: #d6a8ff; }                  /* dark, pinned */
```

Keep the contrast the package checks (4.5:1 for text, 3:1 for control boundaries and the focus
ring, in both themes). Never fork the package CSS. `test/tokens.test.mjs` keeps the stylesheets
and `SUI_TOKENS` identical for both themes.

## Accessibility

The components target WCAG 2.2 AA. Every focusable element shows a `--sui-focus-ring` outline on
`:focus-visible`, every transition respects `prefers-reduced-motion`, and the tests run axe-core
over every component in both themes, a keyboard-focus check per interactive component and a
contrast check of every text and control token pair. [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)
lists what is checked automatically, what is checked by hand, and what the host owns.

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
