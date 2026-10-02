# @scshafe/ui Agent Contract

A managed library under the SCSHAFE library standard (`scshafe-library` v1).
It is published to GitHub Packages and deploys nothing. Read `README.md`,
`docs/FRONTEND-DOCTRINE.md` and `docs/DEVELOPING.md` before meaningful
changes.

## Invariants

- The namespace is `sui`: CSS classes `sui-*`, custom properties `--sui-*`,
  markers `data-sui-*`, exported names `Sui*` / `SUI_*`. The `mc` names of
  `mc-ui` 0.1.0 were retired in 0.2.0 without aliases: never reintroduce them
  or add a compatibility alias. Past `CHANGELOG.md` entries are dated records
  and keep the old names.
- The `data-sui-component` markers and class names are the render contract
  hosts pin. Changing one is a breaking change (a minor bump while 0.x) with a
  changelog entry; `test/markers.test.mjs` pins the core set, and
  `test/namespace.test.mjs` fails on any rendered class that is not `sui-*`,
  any data attribute that is not `data-sui-*`, and any such selector in the
  stylesheets. A new component goes into `test/support/catalog.mjs`.
- Every theme value is a registered `--sui-*` token with a light and a dark
  value; component rules carry no colour literals. A new token goes into
  `src/tokens.ts`, `tokens.css` and the matching blocks (`:root` for
  theme-independent tokens; the light, preferred-dark and pinned-dark blocks
  for themed ones) of the stylesheet that uses it, in one commit;
  `test/tokens.test.mjs` enforces this and `test/contrast.test.mjs` checks the
  colour against WCAG 2.2 AA in both themes.
- Accessibility is part of the contract (`docs/ACCESSIBILITY.md`): keep the
  shared `:focus-visible` ring (never `outline: none`), put transitions on
  `var(--sui-duration)`, add every new component to the catalog so the axe,
  keyboard-focus and namespace tests cover it, and keep the manual checks list
  current.
- The root export stays free of Redux, the icon library and tiptap
  (`test/state-optionality.test.mjs`, `test/editor.test.mjs`); tiptap is
  imported only by `src/editor/`. `@reduxjs/toolkit`, `react-redux`,
  `iconoir-react`, `esbuild`, `react-dom` and the tiptap packages are optional
  peers, `react` the only required one; the package has no `dependencies`.
  The package never knows an endpoint or a host's domain: hosts inject
  fetchers, icons, popover state and the sign-out configuration through the
  seams.
- No application-specific names, deployment or process references in code,
  styles or docs.
- `lib/` is build output and is never committed. Build it with
  `pnpm run build`.
- Toolchain is pnpm, pinned by `packageManager` (`pnpm@10.34.5`), with
  `pnpm-lock.yaml` committed and `strictDepBuilds: true`; every `allowBuilds`
  entry in `pnpm-workspace.yaml` is a reviewed change. Do not add
  `package-lock.json`.
- `.npmrc` holds only `@scshafe:registry=https://npm.pkg.github.com`. Never
  commit a credential, auth-token line or token to any file.
- The payload is the `files` whitelist in `package.json`; the release manifest
  `release/scshafe-ui-<version>.payload.sha256` pins every packed file's
  sha256. A payload change (including `package.json`, `README.md`,
  `CHANGELOG.md`, the stylesheets or `src/`) needs
  `pnpm run build && pnpm run release:manifest` in the same commit.
- The release kit (`scripts/*.mjs` except `release.config.mjs`, `ci.yml`,
  `publish.yml`) is a verbatim copy of scshafe-dev's master: never edit it
  here; a fix lands in scshafe-dev first, then `dev check scshafe-ui --diff`
  brings it over. Repository choices go in `scripts/release.config.mjs`.
- Peers used by the install checks are pinned exactly in `devDependencies`
  (`smokePeerSpecs`, phases in `scripts/release.config.mjs`); the consumer in
  the install checks depends on each of them directly. The install checks and
  the install-back run the base phase first (tiptap must be absent;
  `test/smoke/`), then the `editor` phase with the tiptap peers added
  (`test/smoke/editor/`). `test/ssr-alone-install.test.mjs` installs the
  packed package alone (no peers) and proves `@scshafe/ui/ssr` without React.
- Test and consumer imports use the scoped specifiers `@scshafe/ui` and
  `@scshafe/ui/<subpath>`.

## Verification

```sh
pnpm install --frozen-lockfile
pnpm run verify             # typecheck, build, tests, payload, release bytes, packed install smokes
pnpm run test:fresh-clone   # clean committed HEAD only: clone, install, build, verify
```

CI (`.github/workflows/ci.yml`) runs the same `verify` on the Node matrix in
`engines` on GitHub-hosted runners. Libraries never use a self-hosted runner.

## Releasing

- SemVer; `package.json` `version` is the authority. A release commit bumps
  the version, adds `## <x.y.z> — <date>` to `CHANGELOG.md` and regenerates
  the release manifest.
- After `ci.yml` is green on `main`, the owning agent pushes the annotated tag
  `v<x.y.z>` on that `main` commit. `.github/workflows/publish.yml` is the only
  publisher: it refuses tags not on `main` or not equal to the version,
  verifies, publishes, installs the published version back next to its pinned
  peers, compares integrity, runs the smokes, and creates the GitHub Release
  with the digests. Before the first tag of a new pipeline change, dispatch
  `publish.yml` with `dry_run: true`.
- Never run `pnpm publish` by hand, never reuse, move or delete a tag or a
  published version. A bad release is superseded by a higher patch version
  with a changelog note.
- No prereleases in v1; co-development with consumers uses `pnpm link`, which
  must never be committed in a consumer.
