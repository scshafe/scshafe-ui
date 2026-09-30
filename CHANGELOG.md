# Changelog

All notable changes to `@scshafe/ui` are recorded here. Versions follow
[SemVer](https://semver.org/). A release is the annotated tag `v<x.y.z>` on a
commit on `main` whose `package.json` version is `<x.y.z>`; published versions
are never deleted, replaced or reused.

## 0.3.0 — unreleased

Meets the SCSHAFE app standard's frontend requirements (WP-09A step 2).

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
