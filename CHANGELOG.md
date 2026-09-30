# Changelog

All notable changes to `@scshafe/ui` are recorded here. Versions follow
[SemVer](https://semver.org/). A release is the annotated tag `v<x.y.z>` on a
commit on `main` whose `package.json` version is `<x.y.z>`; published versions
are never deleted, replaced or reused.

## 0.3.0 — unreleased

Meets the SCSHAFE app standard's frontend requirements (WP-09A step 2).

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
