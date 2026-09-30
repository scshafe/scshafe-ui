# Developing @scshafe/ui locally

How to work on the library from a checkout, try a change in a consumer before
it is released, and get it released. The rules behind this are the SCSHAFE
library standard (LIB-04, LIB-07, LIB-15).

## Checkout

Development checkouts live in `~/src/<repo>` (on Arch as on Lubuntu), so this
repository is `~/src/scshafe-ui`:

```sh
git clone https://github.com/scshafe/scshafe-ui.git ~/src/scshafe-ui
cd ~/src/scshafe-ui
```

## Toolchain

pnpm comes from corepack, pinned by `packageManager` in `package.json`
(`pnpm@10.34.5`); no global or root install is needed. Node is 22.22+ or
24.18+ (`.node-version` names the release-job version).

```sh
corepack enable --install-directory ~/.local/bin   # once per user, no root
pnpm --version                                     # 10.34.5 inside the checkout
pnpm install --frozen-lockfile
```

The dependencies come from registry.npmjs.org; no `@scshafe` package is needed
to build or test this one. Installing a *published* `@scshafe` package (as a
consumer does) needs a `read:packages` token in your user-level `~/.npmrc`,
never in a project file.

## Day to day

```sh
pnpm run build     # clean + tsc: src/ -> lib/ (lib/ is never committed)
pnpm test          # node --test over test/*.test.mjs, against lib/
pnpm run verify    # typecheck, build, tests, payload manifest, pack-twice bytes,
                   # pack-and-install JS / React render / TypeScript smokes
```

Run `pnpm run verify` before every push. On a clean, committed HEAD,
`pnpm run test:fresh-clone` clones the commit, installs offline from the
store, builds and verifies it, as CI does.

If a change alters the packed files (`src/`, the stylesheets, `README.md`,
`CHANGELOG.md`, `package.json`), regenerate the payload manifest in the same
commit: `pnpm run build && pnpm run release:manifest`.

## Co-developing with a consumer (`pnpm link`)

To try an unreleased change in an app, link the checkout into the app's
checkout:

```sh
cd ~/src/scshafe-ui && pnpm run build        # the app loads lib/, so build first
cd ~/src/<app> && pnpm link ~/src/scshafe-ui
# ... work; rebuild the library after each change (or run tsc -w)
cd ~/src/<app> && pnpm unlink @scshafe/ui && pnpm install --frozen-lockfile
```

The link is local only: never commit it. An app's `main` depends on an exact
published version (`"@scshafe/ui": "0.2.0"`) resolved from GitHub Packages
with an `integrity` hash, never on a `link:`, `file:`, `git` or `workspace:`
specifier. A change an app needs reaches it as a release, then the app
upgrades in one commit that changes `package.json` and the lockfile together.

## Releasing

Releases happen only by tag, through `.github/workflows/publish.yml`. Never
run `pnpm publish` by hand (the read token cannot publish anyway).

1. On a branch: bump `version` in `package.json`, add `## x.y.z — <date>` to
   `CHANGELOG.md`, run `pnpm run build && pnpm run release:manifest`, commit,
   open a PR and let `ci.yml` pass.
2. Merge to `main` and wait for `ci.yml` to be green there.
3. For a changed pipeline, dispatch `publish.yml` with `dry_run: true` first.
4. Push the annotated tag `vx.y.z` on that `main` commit. `publish.yml`
   verifies, publishes, installs the version back next to its pinned peers,
   compares the registry integrity with a fresh pack, runs the smokes and
   creates the GitHub Release with the digests.

A published version is never deleted, moved or reused; a bad release is
superseded by the next patch version with a changelog note.
