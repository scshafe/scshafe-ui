# Changelog

All notable changes to `@scshafe/ui` are recorded here. Versions follow
[SemVer](https://semver.org/). A release is the annotated tag `v<x.y.z>` on a
commit on `main` whose `package.json` version is `<x.y.z>`; published versions
are never deleted, replaced or reused.

## 0.5.0 — 2026-10-05

Liquid Glass: the components take on a glass material after Apple's design language. Class
names, markers and component APIs are unchanged. The look changes and so do two layouts
(below), hence the minor version.

### Changed

- The functional layer is glass: a translucent fill, a sheen and a bright top edge, a rim and
  a soft shadow. That covers `Button`/`IconButton`, `Tab`, `FocusTabs`, the server-rendered
  `navTabs`, `Popover` (tooltips, hover cards, context and column menus), `Toast`, `Sheet`,
  Card's detail popover and "show full" button, and the rail of a `RailWorkspace`. Popovers,
  toasts and "show full" blur and saturate their backdrop. Larger layers use the thicker
  `--sui-glass-thick`, because `backdrop-filter` would capture the fixed-position popovers
  inside them, and modal layers blur the page through `::backdrop`.
- Content stays steady: cards, tables, readers, editors and messages keep solid surfaces and
  get only the new geometry and a lit top edge. The data table's sticky header stays opaque.
- Geometry: buttons, tabs, badges, chips and record-meta pills are capsules, and corners are
  larger (`--sui-radius-sm` 6→8px, `-md` 8→12px, `-lg` 10→16px) and concentric (menu items
  follow the popover's corner, tabs their strip's).
- Selected tabs (`Tab`, `FocusTabs`, an active `Button variant="tab"`) are a lens of glass
  with an accent label, no longer an accent-bordered box. Buttons and tabs press in slightly on
  `:active`, with a spring easing.
- Layout: `FocusTabs` and `navTabs` strips are now as wide as their tabs (`width:
  fit-content`, up to the container), with 4px of padding inside a rim. A host that relied on
  the strip filling its row should give it `width: 100%`.
- Popovers, toasts, sheets and the card detail popover appear from their origin
  (`@starting-style` transitions on `--sui-duration`, so instant under reduced motion).

### Added

- Tokens: `--sui-glass`, `--sui-glass-thick`, `--sui-glass-sheen`, `--sui-glass-edge`,
  `--sui-glass-highlight`, `--sui-glass-shadow` (light and dark), `--sui-glass-blur`,
  `--sui-glass-saturate`, `--sui-radius-xl`, `--sui-radius-pill`, `--sui-ease` and
  `--sui-ease-spring`. `SuiTokenCategory` gains `"material"`.
- Reduced transparency: glass becomes the opaque `--sui-popover` surface without blur under
  `prefers-reduced-transparency: reduce`, `prefers-contrast: more` (which also darkens the
  rim) and `data-sui-transparency="reduce"` on the root or a subtree
  (`SUI_TRANSPARENCY_ATTRIBUTE` from `@scshafe/ui/tokens`).
- Tests: `test/glass.test.mjs` (the solid fallbacks, including the attribute in the cascade
  under a subtree pinned to the other theme; blur only on leaf layers; entrances as starting
  styles). `test/contrast.test.mjs` also checks body text on glass at 4.5:1 over any backdrop
  in both themes.
- `docs/ACCESSIBILITY.md`: reduced transparency, and manual checks for glass over real
  content and with reduced transparency or increased contrast.

## 0.4.1 — 2026-10-01

Acceptance (U4): the first-app guide, and two fixes it surfaced.

### Added

- `docs/FIRST-APP.md`: from an empty directory to a React app (Vite) and a server-rendered app
  (`@scshafe/ui/ssr`, no React), each on one published version, with the theme, reduced-motion
  and keyboard-focus checks. Checked by a fresh-eyes run that followed only the guide. It lives in
  the repository (it shows the user-level npmrc token line, which the package payload scan
  keeps out of the published files).

### Fixed

- `List`'s empty state showed no message: it passed `title` and `description` to `EmptyState`,
  which rendered them as stray attributes. `empty` now takes `{ message }`, the same shape as
  the server-rendered `list`; the older `{ title, description }` still renders, as
  "title: description".
- `PinnedDataTable` / `dataTable` cells had browser defaults (centred header cells, no padding
  or dividers, a see-through sticky header). `components.css` now gives cells start alignment,
  padding and row dividers, the header an opaque `--sui-panel` surface with
  `--sui-text-strong` text, and rows a `--sui-bg-hover` hover, all contrast-checked in both
  themes. Column `align` and the pinned column still take precedence.

## 0.4.0 — 2026-10-01

The server-rendered adapter (U3): `@scshafe/ui/ssr`, for apps that render HTML on the server
with no React and no client JavaScript.

### Added

- `@scshafe/ui/ssr`: string helpers with the same `sui-` classes and `data-sui-component`
  markers as the React components — layout (`stack`, `inline`, `grid`, `pane`, `scroll`), the
  frame (`appShell`, `workspace`, `fill`, `documentPage`), navigation (`tab`, `navTabs`), forms
  (`title`, `description`, `label`, `inputField`, `selectField`, `textAreaField`, `button`),
  status (`badge`, `status`, `statCount`, `kbd`, `chipList`, `recordMeta`, `metricCard`), and
  `emptyState`, `list`, `listRow`, `panel`, `panelHeader`, `tabPanelHeader`, `dataTable`.
  Everything is escaped unless it is `SafeHtml`; `` html`…` `` is a context-aware tagged
  template; URL attributes take http(s), mailto, tel and relative URLs only; no style
  attribute, script or event handler is ever emitted. The subpath needs no peer.
- Server-rendered extras the React components do not have: link tabs and link buttons (`href`),
  a `<nav>` strip (`navTabs`), a title link on `listRow`, and `documentPage`.
- `layout.css`: `.sui-grid-columns--1`…`12` and `.sui-grid-auto-fit--xs`…`xl` (the column
  templates as classes, for markup that cannot carry a style attribute).
- `components.css`: `.sui-nav-tabs`; `a.sui-tab` / `a.sui-button` without underline and with a
  disabled look for `aria-disabled="true"`; `.sui-list-row-anchor`.
- `examples/ssr-app`: a `node:http` app on the adapter with a strict CSP — the U4 guide's
  server-rendered app (not part of the package).
- Tests: marker parity with the React components (33 pairs), escaping in every text and
  attribute position, URL schemes, template contexts, CSP shape, axe in both themes and
  keyboard focus over a server-rendered catalog, and the example app booted and fetched.
- Release: the install-back adds a third consumer with `@scshafe/ui` **alone** (no peers); it
  must not resolve `react`, and `@scshafe/ui/ssr` must render and typecheck there with
  `skipLibCheck` off.

### Notes

- React-only by design (they need client JavaScript): hover cards and tooltips, icon glyphs,
  column resizing, the state layer. The server `dataTable` is the `PinnedDataTable` markup
  without resize handles or width styles.

## 0.3.1 — 2026-10-01

Release-tooling fix; the library is unchanged from 0.3.0 apart from `package.json`'s version,
this changelog and the README note below.

- The release's install-back installs the base consumer with `--config.auto-install-peers=false`.
  pnpm 10 auto-installs optional peers too, so 0.3.0's base consumer received the tiptap packages
  and the "root works without the editor peers" smoke failed after publishing: 0.3.0 is on the
  registry but has no GitHub Release. Use 0.3.1.
- README: how to keep the optional tiptap peers out of a pnpm project (`auto-install-peers=false`).

## 0.3.0 — 2026-09-30

Meets the SCSHAFE app standard's frontend requirements (WP-09A step 2):
light and dark themes, reduced motion, a keyboard focus ring on every
component and automated WCAG 2.2 AA checks; the tiptap editor in its own
subpath with optional peers; configured sign-out; and every public class in
the `sui` namespace.

### Breaking changes

Each entry says how to migrate. Pre-1.0, a breaking change is a minor bump.

- **Every public class is `sui-*` and every rendered data attribute is
  `data-sui-*`.** 0.2.0 renamed only the `mc-` names; 69 unprefixed classes,
  17 data attributes and the `FocusTabsComponent` marker remained, some with
  application-specific names. They are renamed below, and
  `test/namespace.test.mjs` now fails on any unprefixed class or data
  attribute in rendered markup or in the stylesheets.
  *Migration:* replace the old names in host CSS, selectors and tests using the
  table below (a find-and-replace per row; the longer names first).
- **`className` adds to a component's base class instead of replacing it** for
  `EmptyState` (`sui-empty-state`), `Panel` (`sui-panel`), `PanelHeader`
  (`sui-panel-header`), `ListRow` (`sui-list-row`) and `MarkdownContent`
  (`sui-markdown`), as it already did elsewhere. *Migration:* a host that passed
  `className` to drop the package styling restyles `.sui-<component>` instead.
- **`FocusTabs` renders its own `sui-focus-tabs` strip and `sui-focus-tab`
  button classes** (styled in `components.css`) before the model's classes, and
  its marker is `data-sui-component="FocusTabs"`. *Migration:* host rules for
  the strip keep working through the model classes; tests that pinned
  `FocusTabsComponent` pin `FocusTabs`.

- **Light and dark themes; the default follows `prefers-color-scheme`.**
  0.2.0 shipped dark values only. Every colour, surface, border and shadow
  token now has a light and a dark value; the light theme applies unless the
  user prefers dark, and `data-sui-theme="light"` or `"dark"` on the root
  element (or any subtree) pins one. Users whose system prefers light now get
  the light theme. *Migration:* to keep 0.2.0's look everywhere, render
  `<html data-sui-theme="dark">` (or pass `theme="dark"` to `SuiProviders`, or
  call `applySuiTheme("dark")`). A host that re-declared colour tokens at
  `:root` for its dark design either pins the dark theme or re-declares its
  values per theme (README "Theming and tokens").
- **The token registry records both themes.** `SuiToken.default` is replaced
  by `light` and `dark` (equal for theme-independent tokens), plus `themed`
  and, for colours, a contrast `role`. *Migration:* read `token.dark` where you
  read `token.default` (or `suiTokenValue(name, theme)`).
- **Component colours come from tokens.** Every colour literal in
  `components.css` rules became a token reference, so a few dark-theme
  colours moved slightly (tone tints capped at 12 %, accent tints under text
  at 20 %, form controls outlined with the new `--sui-field-border`).
  *Migration:* none needed; hosts that matched exact computed colours in
  visual tests update their baselines.

- **One keyboard focus ring for every component.** Every focusable element a
  component renders shows a 2px `--sui-focus-ring` outline on
  `:focus-visible`; the per-component outlines (and the `outline: none` rules
  that hid focus on inputs, the markdown editor and the editable name) are
  gone. *Migration:* hosts that styled focus on package elements restyle the
  shared rule (`:where([data-sui-component]) :focus-visible`) or
  `--sui-focus-ring`.

- **Markup fixes from the axe run.** ToastTray renders a labelled
  `<section aria-label="Notifications">` of `<div role="status|alert">` toasts
  instead of an `<ol>` of `<li role=…>` (a list may not hold those roles), and
  no longer sets `aria-live` on the tray (each toast is its own live region).
  Badge drops its `aria-label` (the label text is in the markup, now after a
  space); Kbd combos are `role="group"`; RecordMeta, MessageBubble's parts and
  a labelled RailWorkspace are `role="group"` so their `aria-label` is
  allowed. *Migration:* host CSS or tests that selected `.sui-toast-tray li`
  select `.sui-toast`; tests that read a Badge's `aria-label` read its text.

- **The tiptap editor moved to `@scshafe/ui/editor`, and tiptap is an
  optional peer.** `MarkdownEditor` (and `MarkdownEditorHandle`,
  `MarkdownEditorProps`) left the root export; `@tiptap/core`, `@tiptap/pm`,
  `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`,
  `@tiptap/extension-placeholder` and `tiptap-markdown` moved from
  `dependencies` to optional `peerDependencies`, so an app without the editor
  installs no editor. The package now has no hard dependencies. The editor
  creates its tiptap instance after mount (`immediatelyRender: false`), so it
  server-renders its shell. *Migration:* import `MarkdownEditor` from
  `@scshafe/ui/editor` and add the seven tiptap packages to the app's
  dependencies (README "Editor").

- **`/identity` takes the end-session URL from configuration.**
  `buildSignOutUrl(config, location?)` replaces `buildSignOutUrl(location?)`:
  the identity provider's end-session endpoint comes from a `SignOutConfig`
  (`endSessionEndpoint`, optional `postLogoutRedirectUri`,
  `proxySignOutPath` — default `/oauth2/sign_out` — and `idTokenHint`,
  default true) instead of being derived as `id.<suffix>` from the browser's
  hostname. `UserMenu` takes it as the `signOut` prop, from the new
  `IdentityConfigProvider`, or from `SuiProviders`' `identity` option. There
  is deliberately no default endpoint: without configuration `UserMenu` shows
  no Sign out link. Endpoints must be `https:` (plain `http:` only on a
  loopback host), without credentials; the proxy path must be same-origin.
  *Migration:* pass the provider's end-session URL, e.g.
  `<SuiProviders identity={{ signOut: { endSessionEndpoint: "https://id.<your-tailnet>/api/oidc/end-session" } }}>`
  (the URL 0.2.0 derived), or `<UserMenu signOut={…} />`; callers of
  `buildSignOutUrl(location)` call `buildSignOutUrl({ endSessionEndpoint }, location)`.

#### Class and marker renames

| Before (0.2.0) | After (0.3.0) |
| --- | --- |
| `chip` + tone class `green` `yellow` `orange` `red` `purple` `blue` (Badge, Status, Card overflow chip) | `sui-badge` + `sui-badge--<tone>` |
| `count-pill-label` | `sui-badge-label` (`count-pill` was never rendered and is gone) |
| `text-area-field` | `sui-text-area-field` |
| `sr-only` (TextAreaField label) | `sui-visually-hidden`, now styled by the package |
| `project-chat-composer-context project-chat-composer-context-control` (SelectField) | `sui-select-field`, now styled by the package |
| `copyable`, `copyable-{name,slug,id,value,code}` | `sui-copyable`, `sui-copyable-{name,slug,id,value,code}` |
| `empty` (EmptyState) | `sui-empty-state` |
| `panel`, `panel-header` | `sui-panel`, `sui-panel-header` |
| `task-row` (ListRow), `card-top`, `chips`, `list-row-{media,content,aside,actions}` | `sui-list-row`, `sui-list-row-top`, `sui-list-row-chips`, `sui-list-row-{media,content,aside,actions}` |
| `metric` (MetricCard) | `sui-metric-card` |
| `card-meta`, `meta-pill` (RecordMeta) | `sui-record-meta`, `sui-record-meta-pill` |
| `project-chat-message`, `project-chat-message-<role>`, `project-chat-message-final` (MessageBubble) | `sui-message`, `sui-message--<role>`, `sui-message--final` |
| `project-chat-message-{avatar,bubble,toolbar,toolbar-actions,parts,part,part-label}` | `sui-message-{avatar,bubble,toolbar,toolbar-actions,parts,part,part-label}` |
| `project-chat-markdown` | `sui-message-markdown` |
| `markdown-content` (MarkdownContent default), `markdown-code-block` | `sui-markdown`, `sui-markdown-code-block` |
| `collapsible-list-rail`, `collapsible-list-rail-{header,toggle,title,actions,body,resize-handle}` | `sui-collapsible-list-rail`, `sui-collapsible-list-rail-{header,toggle,title,actions,body,resize-handle}` |
| `is-collapsed`, `no-header`, `is-resizable` (on the rail) | `sui-collapsible-list-rail--collapsed`, `--no-header`, `--resizable` |
| `panel-rail-toggle` (RailToggle) | `sui-rail-toggle` |
| `data-table-column-menu`, `data-table-column-menu-{panel,header,list,row}`, `data-table-column-{visibility,order-button,width-input}` | the same names with the `sui-` prefix |
| `project-tab-icon`, `project-tab-counts`, `project-tab-count`, `project-tab-divider` (FocusTabs) | `sui-focus-tab-icon`, `sui-focus-tab-counts`, `sui-focus-tab-count`, `sui-focus-tabs-divider` |
| `.sui-button-tab.active` (host-applied `active`) | `.sui-button-tab.sui-button-active` |
| marker `data-sui-component="FocusTabsComponent"` | `data-sui-component="FocusTabs"` |
| `data-project-tab` (FocusTabs buttons) | `data-sui-focus-tab` |
| `data-field` (SelectField), `data-copied` (Copyable) | `data-sui-field`, `data-sui-copied` |
| `data-surface-id`, `data-collapsed`, `data-resizing` (rails) | `data-sui-surface-id`, `data-sui-collapsed`, `data-sui-resizing` |
| `data-table-id`, `data-column-id`, `data-pinned-column`, `data-cell-wrap`, `data-line-clamp`, `data-align`, `data-column-resize-handle` (PinnedDataTable) | `data-sui-table-id`, `data-sui-column-id`, `data-sui-pinned-column`, `data-sui-cell-wrap`, `data-sui-line-clamp`, `data-sui-align`, `data-sui-column-resize-handle` |
| `data-table-column-menu`, `data-table-column-menu-row`, `data-table-preferences-reset` (DataTableColumnMenu) | `data-sui-table-column-menu`, `data-sui-table-column-menu-row`, `data-sui-table-preferences-reset` |
| `data-popover-id` (Popover) | `data-sui-popover-id` |
| transient drag state `data-start-x`, `data-start-width`, `data-last-width` | `data-sui-start-x`, `data-sui-start-width`, `data-sui-last-width` |

### Added

- `docs/ACCESSIBILITY.md` (shipped in the package): themes, keyboard and focus
  behaviour, names, errors, contrast and motion against WCAG 2.2 AA; what is
  checked automatically, what by hand, and what the host owns.
- Theme API: `applySuiTheme`, `useSuiTheme`, `SuiThemePreference` (root);
  `SUI_THEMES`, `SUI_THEME_ATTRIBUTE`, `suiTokenValue`,
  `SUI_REDUCED_MOTION_DURATION`, `SuiTokenRole` (`/tokens`);
  `SuiProviders` options `theme` and `identity`.
- Tokens `--sui-field`, `--sui-field-border`, `--sui-focus-ring`,
  `--sui-tint`, `--sui-code-bg`, `--sui-backdrop`, `--sui-shadow-color`,
  `--sui-duration` and the status tones `--sui-tone-<tone>` /
  `--sui-tone-<tone>-text` for green, blue, yellow, orange, red and purple.
- `@scshafe/ui/editor`; `IdentityConfigProvider`, `useIdentityConfig`,
  `SignOutConfig`, `IdentityConfig` (`/identity`).
- `prefers-reduced-motion: reduce` sets every transition to 0s.
- Keyboard resizing for CollapsibleListRail (a focusable window splitter:
  Arrow keys, Shift, Home/End, Enter resets).
- Package styles for SelectField, the TextAreaField's visually hidden label
  (`sui-visually-hidden`) and the FocusTabs strip.
- Tests: axe-core over every component in both themes, a keyboard-focus test
  per interactive component, the token contrast check, theme cascade, reduced
  motion, the namespace guard, the editor's optional-peer proofs and the
  install-back pipeline shape; the component catalog they share
  (`test/support/catalog.mjs`). New dev dependencies: `jsdom` 29.1.1,
  `axe-core` 4.13.0.

### Changed

- The packed-install check and `publish.yml`'s install-back install the
  package with the base peers only, prove that the root and every other
  subpath work and that tiptap is absent, then add the editor peers and smoke
  `@scshafe/ui/editor` (render and TypeScript).
- Toast dismiss and EditableName buttons are 24px (WCAG 2.5.8).

## 0.2.0 — 2026-09-30

First published version, on GitHub Packages. The package was `mc-ui` 0.1.0
(repository `scshafe/mc-ui`, never published, consumed only through `git+ssh`
pins); it is renamed and brought under the SCSHAFE library standard. The
rename is breaking and ships **without compatibility aliases**: no `mc`/`Mc`
name, class, token or marker remains. A consumer on the old `git+ssh` pin keeps
working unchanged until it moves to `@scshafe/ui@0.2.0`.

### Renamed

| Before (mc-ui 0.1.0) | After (@scshafe/ui 0.2.0) |
| --- | --- |
| package `mc-ui` | `@scshafe/ui` |
| repository `github.com/scshafe/mc-ui` | `github.com/scshafe/scshafe-ui` |
| imports `mc-ui`, `mc-ui/<subpath>` | `@scshafe/ui`, `@scshafe/ui/<subpath>` |
| CSS classes `.mc-*` (250 names) | `.sui-*` |
| tokens `--mc-space-*`, `--mc-clamp-*` | `--sui-space-*`, `--sui-clamp-*` |
| PinnedDataTable variables `--mc-data-table-*` | `--sui-data-table-*` |
| unprefixed tokens `--text`, `--text-strong`, `--muted`, `--line`, `--blue`, `--accent`, `--accent-hover`, `--accent-subtle`, `--green`, `--ok`, `--ok-subtle`, `--bg`, `--panel`, `--card`, `--bg-elevated`, `--bg-hover`, `--surface-2`, `--popover`, `--border`, `--border-strong`, `--border-hover`, `--shadow`, `--shadow-lg`, `--radius-sm`, `--radius-md`, `--radius`, `--radius-lg`, `--mono`, `--chat-text-size` | the same names with the `--sui-` prefix (`--text` → `--sui-text`, …) |
| markers `data-mc-component`, `data-mc-action`, `data-mc-chip-tone`, `data-mc-kind`, `data-mc-level`, `data-mc-overflowing`, `data-mc-popover-anchor`, `data-mc-tab-id`, `data-mc-tone` | `data-sui-component`, `data-sui-action`, … (`data-sui-*`) |
| `McProviders`, `McProvidersProps` | `SuiProviders`, `SuiProvidersProps` |
| `createMcStore`, `CreateMcStoreOptions` | `createSuiStore`, `CreateSuiStoreOptions` |
| `assertMcUiResolvable` (`/build`) | `assertSuiResolvable` |
| prop `dataMcComponent` (layout primitives, Card, Sheet, …) | `dataSuiComponent` |
| option `mcProviders` (`createSpaRenderHarness`) | `suiProviders` |
| PaneSizes localStorage key `mc-pane-sizes` | `sui-pane-sizes` (persisted widths start fresh) |
| `.mc-testing-*` scratch directories (`/testing`) | `.sui-testing-*` |

### Added

- **Token registry.** `@scshafe/ui/tokens` exports `SUI_TOKENS` (42 tokens with
  default, category, declaring stylesheet and description), `SUI_TOKEN_NAMES`
  and `SUI_COMPONENT_VARIABLES`; `@scshafe/ui/tokens.css` declares every default
  in one `:root` block. A test keeps the three stylesheets and the list
  identical.
- **Marker tests** through the public specifiers, and packed-install JS, React
  render (`react-dom/server`) and TypeScript smokes.
- `react-dom` `>=18` declared as an optional peer (`/testing` renders with
  `react-dom/server`).
- `exports` entries for `./tokens` (with `types`) and `./tokens.css`.

### Removed

- **`create-mc-app`**: `bin/create-mc-app.mjs`, `templates/app` and the
  `bin` field. The templates remain in git history (at `935defa`) as input for
  the future `dev new` template.
- The Mission Control design records `DESIGN-SITE-LAYOUT.md` and
  `DESIGN-STATE-LAYER.md` (in git history at `935defa`), and Mission Control
  deployment and process references in code comments, stylesheets and docs.
- `lib/` from the repository: it is built from `src/` (`pnpm run build`) and
  shipped only in the package.

### Changed

- The `/build` preflight error names the GitHub Packages fix (scope line plus a
  `read:packages` credential) instead of an SSH deploy key.
- Toolchain: pnpm 10.34.5 (`packageManager`, committed `pnpm-lock.yaml`,
  `strictDepBuilds`), scope-only `.npmrc`, `engines.node`
  `>=22.22.0 <23 || >=24.18.0 <25`, `publishConfig` to GitHub Packages, a
  `files` whitelist, `ci.yml` and the tag-driven `publish.yml`.
