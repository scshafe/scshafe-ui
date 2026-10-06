# Moving an existing app onto `@scshafe/ui`

[FIRST-APP.md](FIRST-APP.md) builds new apps from an empty directory. This guide is for an app that
already exists: it has a lockfile, a test suite that pins its markup, a Dockerfile and a deploy, and
may be written in CommonJS. It uses `0.5.0` throughout. Read it in order the first time; afterwards
the [checklist](#10-checklist) at the end is enough.

| Section | You need it when |
| --- | --- |
| [1. Pick the flavour](#1-pick-the-flavour) | always |
| [2. Registry access](#2-registry-access) | always: every install needs a token |
| [3. npm or pnpm](#3-npm-or-pnpm) | always |
| [4. CommonJS apps](#4-commonjs-apps) | the app uses `require()` |
| [5. Server-rendered apps](#5-server-rendered-apps-scshafeuissr) | it renders HTML on the server |
| [6. React apps](#6-react-apps-vite-or-esbuild) | it is a React SPA |
| [7. CI](#7-ci) | it runs GitHub Actions |
| [8. The deploy build](#8-the-deploy-build) | it ships a Docker image |
| [9. Theming](#9-theming) | it has its own colours or stylesheet |

## 1. Pick the flavour

| The app renders… | Use | Peers |
| --- | --- | --- |
| HTML on the server (`node:http`, Express, Hono, template literals) | `@scshafe/ui/ssr`: string helpers that escape every value, emit the same `sui-` classes and `data-sui-component` markers as the React components, and need no client JavaScript | none |
| a React SPA (Vite, esbuild) | the root export's components; optionally `/state` (Redux Toolkit), `/identity` (oauth2-proxy session), `/icons`, `/editor` | `react`, `react-dom`, plus the ones for each subpath you use |

Both flavours share the three stylesheets (`tokens.css`, `layout.css`, `components.css`), so an app
can start with one and add the other later. The [README](../README.md) lists every component, helper
and subpath.

## 2. Registry access

`@scshafe/ui` is published to GitHub Packages' npm registry. The package is public, but that
registry still requires a token for every install, including `npm view`. Two things must be in
place: the scope mapping and a token.

**The scope mapping.** The app's `.npmrc` maps the scope and holds nothing else; commit it:

```ini
@scshafe:registry=https://npm.pkg.github.com
```

**The token**, by where the install runs:

| Where | Token | How it gets there |
| --- | --- | --- |
| The owner's shell | a classic personal access token with `read:packages` | the user-level `~/.npmrc` line `//npm.pkg.github.com/:_authToken=…` ([FIRST-APP.md §0](FIRST-APP.md#0-prerequisites) shows how to add it without echoing it) |
| The project's agent (`agent-<project>`) | the broker's shared `read:packages` token, as `NODE_AUTH_TOKEN` in the agent's login shell; the agent's `~/.npmrc` reads it | declare `packages = "read"` in the app's `dev.toml` `[identity]`, then `dev identity plan` and `dev identity apply` (it prints the `sudo scshafe-agent-setup …` command the owner runs). `dev identity verify` then checks that the agent's login shell has the token |
| GitHub Actions (CI) | the job token, `secrets.GITHUB_TOKEN` | `permissions: packages: read` and `actions/setup-node`, [section 7](#7-ci), **after the package grant below** |
| The deploy build | the deploy job's token, as a BuildKit secret | [section 8](#8-the-deploy-build), also after the grant |

```toml
# dev.toml
[identity]
agent = "agent-<project>"
github = ["contents=write", "pull_requests=write", "issues=write", "workflows=write", "actions=write"]
packages = "read"  # package.json depends on @scshafe/ui
```

**The package grant.** A job token reads a package only after that package grants the repository
access. Grants are per consuming repository and can only be made in the GitHub UI, by the package's
owner: open the package settings
(`https://github.com/users/scshafe/packages/npm/ui/settings`), then **Manage Actions access** →
**Add repository** → the app's repository, role **Read**. `dev grants <project>` lists every
`@scshafe/*` package the repository's root `package.json` and lockfile need, with the link and the
role; a frontend in a subdirectory with its own `package.json` (for example `web/`) is not read, so
add its grants by hand. No API can read a grant, so `dev grants` cannot tell whether one exists.

**Check access** before changing anything (it prints the version, never the token):

```sh
npm view @scshafe/ui@0.5.0 version --@scshafe:registry=https://npm.pkg.github.com
```

A `401` means no token or a wrong one; a `403` (in CI, a deploy build) means the token is fine but
the package does not grant this repository access.

**One trap.** A project `.npmrc` line `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}` takes
precedence over the user-level token. Where `NODE_AUTH_TOKEN` is not set (the owner's shell, usually)
it sends an empty token and every install fails with `401`. Keep the project `.npmrc` to the scope
line; the user-level npmrc (agents, the owner) and `actions/setup-node` (CI) supply the token.

## 3. npm or pnpm

Keep the app's package manager and its lockfile; never add a second lockfile. Pin an exact version
either way, and upgrade deliberately, reading the [CHANGELOG](../CHANGELOG.md) first.

**npm** (`package-lock.json`):

```sh
npm install --save-exact @scshafe/ui@0.5.0                 # server-rendered app
npm install --save-exact @scshafe/ui@0.5.0 react react-dom # React app (plus the peers you use)
```

- The lockfile records `"resolved": "https://npm.pkg.github.com/download/@scshafe/ui/0.5.0/…"`
  and the `integrity`; commit it with `package.json`. Installs from it (`npm ci`) need the token too.
- npm does **not** install optional peers, so no tiptap, Redux or icon packages arrive unasked.
- npm **does** install required peers automatically, and `react` is the package's one required
  peer: a server-rendered app gets `react` in `node_modules` and in the lockfile. `@scshafe/ui/ssr`
  never loads it; leave it there. (`legacy-peer-deps` would keep it out, but it changes peer
  handling for every package in the app.)

**pnpm** (`pnpm-lock.yaml`):

```sh
pnpm add --save-exact @scshafe/ui@0.5.0
```

- pnpm 10 installs **optional** peers too (`auto-install-peers=true`), which pulls in tiptap and
  the rest. Turn that off: `autoInstallPeers: false` in `pnpm-workspace.yaml`, or
  `auto-install-peers=false` in the project `.npmrc`. Then install the peers you use explicitly.
  The install prints `✕ missing peer` warnings for the ones you do not use: expected.

| You use | Install as direct dependencies |
| --- | --- |
| `@scshafe/ui/ssr`, the stylesheets | nothing else |
| components (root export) | `react`, `react-dom` |
| `@scshafe/ui/state` | + `@reduxjs/toolkit`, `react-redux` |
| `@scshafe/ui/icons` | + `iconoir-react` |
| `@scshafe/ui/identity` | nothing beyond `react` |
| `@scshafe/ui/editor` | + the tiptap packages ([README](../README.md#editor-scshafeuieditor)) |
| `@scshafe/ui/build`, `/testing` | + `esbuild` |

The engines are Node `>=22.22.0 <23` or `>=24.18.0 <25`: raise the app's `engines.node` and its
Docker base image to match if they are older.

## 4. CommonJS apps

The package is ESM only (`"type": "module"`). A CommonJS app (`'use strict'`, `require`,
`module.exports`) loads it without a build step, in either of two ways. Both are tested on Node
22.23 and 24.21: `test/commonjs.test.mjs` requires every subpath, `test/ssr-alone-install.test.mjs`
runs both recipes from a `.cjs` file against the packed package, and an Express 5 app like the one
below was run end to end.

**`require()` (recommended).** Node 22.12 and later load an ES module synchronously through
`require()` when its graph has no top-level `await`, and no subpath of the package has one. You get
the module namespace (the same object `import()` returns), and no warning is printed.

```js
'use strict';

const express = require('express');
const ui = require('@scshafe/ui/ssr');

const CSP = "default-src 'self'; style-src 'self'; script-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
const app = express();

// The package's stylesheets, served from the installed package.
for (const sheet of ['tokens.css', 'layout.css', 'components.css']) {
  const file = require.resolve(`@scshafe/ui/${sheet}`);
  app.get(`/assets/${sheet}`, (req, res) => res.type('text/css').sendFile(file));
}

app.get('/', (req, res) => {
  const saved = req.query.saved === '1';
  const page = ui.documentPage({
    title: 'Settings',
    stylesheets: ['/assets/tokens.css', '/assets/layout.css', '/assets/components.css'],
    body: ui.appShell({
      ariaLabel: 'Settings',
      children: ui.stack({ children: [
        saved ? ui.banner({ tone: 'ok', text: 'Settings saved.', dismissHref: '/' }) : null,
        ui.html`<form method="post" action="/settings">${[
          ui.checkboxField({ id: 'remote', name: 'remote', value: '1', label: 'Remote roles only', checked: true, description: 'Hide on-site listings.' }),
          ui.button({ label: 'Save', type: 'submit', variant: 'primary' })
        ]}</form>`
      ] })
    })
  });
  res.set('Content-Security-Policy', CSP).type('html').send(String(page));
});

app.post('/settings', express.urlencoded({ extended: false }), (req, res) => {
  const remote = req.body.remote === '1'; // an unchecked box sends nothing
  // … store it, then post-redirect-get, so the banner shows once
  res.redirect(303, '/?saved=1');
});

app.listen(Number(process.env.PORT ?? 8080), '127.0.0.1');
```

**`import()`.** The asynchronous form works everywhere ESM does; load it once at startup and
pass it on, or keep the promise:

```js
'use strict';

async function start() {
  const ui = await import('@scshafe/ui/ssr'); // the same module instance require() returns
  const app = createApp(ui);
  app.listen(8080);
}
start().catch((error) => { console.error(error); process.exit(1); });
```

**TypeScript compiled to CommonJS** works with `"module": "nodenext"` and TypeScript 5.8 or
newer: an `import { banner } from "@scshafe/ui/ssr"` in a CommonJS module compiles to `require()`
and typechecks against the shipped declarations.

Tests under `node --test` load it the same way. A test runner that replaces Node's module loader
needs its own ESM support switched on.

## 5. Server-rendered apps (`@scshafe/ui/ssr`)

The model is the mail apps (`scshafe/mail-otp`'s
[`src/web/pages.ts`](https://github.com/scshafe/mail-otp/blob/main/src/web/pages.ts) and
`src/web/server.ts`; a private repository) and, in this repository,
[`examples/ssr-app`](../examples/ssr-app): a `node:http` server, a strict Content-Security-Policy,
the package stylesheets served from the installed package, and every page built from the helpers.

Migrate page by page, in this order:

1. **The shell and the stylesheets.** Serve `tokens.css`, `layout.css` and `components.css` from
   the package (`import.meta.resolve("@scshafe/ui/components.css")` in ESM, `require.resolve` in
   CommonJS), wrap pages in `documentPage` + `appShell`, turn the header navigation into
   `navTabs` (link tabs, `aria-current="page"` on the active one), and give the body the theme's
   colours (`body { background: var(--sui-bg); color: var(--sui-text); }` in your own stylesheet).
   Delete the app's base styles that the package now covers.
2. **Lists and tables**: `list` / `listRow`, `dataTable` (static `PinnedDataTable` markup),
   `status` / `badge` / `chipList` for pills, `emptyState`.
3. **Forms and messages**: `inputField`, `selectField`, `textAreaField`, `checkboxField`, `button`;
   flash messages become `banner`.
4. **Detail pages** last; domain-specific rendering (a résumé, a diagram) stays bespoke inside a
   `panel`.

Things to know:

- **Escaping.** Every string or number a helper receives is escaped, and `` html`…` `` escapes its
  values. Pass markup between helpers as their return values (`SafeHtml`); a plain string is always
  text. The app's own escaper goes away. Keep any normalisation the app does *before* escaping (for
  example, showing invisible or bidi characters as visible markers): normalise first, then pass
  the string to a helper.
- **CSP.** No helper emits a `style` attribute, a `<script>` or an event handler, so
  `style-src 'self'; script-src 'none'` holds. Inline `<style>` blocks and `style="…"` in the app's
  own markup have to move to a served stylesheet.
- **Banners after a redirect.** Post-redirect-get with a query flag (`?saved=1`), render
  `banner({ tone: "ok", text: "…", dismissHref: "/" })` when it is present, and point
  `dismissHref` at the same page without the flag: dismissing is a navigation, since the page runs
  no script. Tones are `info`, `ok`, `warn` and `danger`; warn and danger are `role="alert"`.
- **Checkboxes.** An unchecked box sends nothing in a form POST: treat an absent field as false.
  Give `value` when the server expects something other than the browser's `"on"`.
- **Tests.** Assert on `data-sui-component` markers and the app's own `data-*` hooks, not on
  class lists or prose; markers are the package's render contract, and changing one is a breaking
  release.

## 6. React apps (Vite or esbuild)

FIRST-APP.md part 1 shows the setup with pnpm; with npm and an existing Vite app it is:

```sh
npm install --save-exact @scshafe/ui@0.5.0
npm install --save-exact @reduxjs/toolkit react-redux   # only if you adopt @scshafe/ui/state
```

Import the stylesheets once, in the entry module, before the app's own CSS:

```jsx
import "@scshafe/ui/layout.css";
import "@scshafe/ui/components.css";
import "./app.css"; // your overrides and app-specific classes
```

`vite build` bundles them from the package's `exports`, as tested with npm and Vite 8. With
esbuild, `@scshafe/ui/build`'s `buildWebApp` wraps esbuild and fails loudly when the package does
not resolve.

- **Convert in slices.** Replace one screen's buttons, fields, tables and lists at a time, and split
  large components as you go. `InputField` / `SelectField` / `TextAreaField` / `CheckboxField` call
  `onChange` with the value (a boolean for the checkbox), not the event.
- **State.** An app that already has a Redux Toolkit store can keep its slices and use the
  components only. To adopt the state layer, add `Toasts`, `Popovers` and `ConfirmDialog` to the
  store (`createSuiStore` or your own `configureStore`) and render inside `SuiProviders`; resource
  slices (`createResourceSlice`, …) take your fetchers, the package never knows an endpoint.
- **Sign-out.** An app behind oauth2-proxy that builds its sign-out URL by hand can use
  `@scshafe/ui/identity`: `UserMenu`, or `buildSignOutUrl(config, location)`, with the identity
  provider's end-session endpoint as configuration.
- **Notices.** `Banner` covers inline status (a failed save, a paused feed); `ToastTray`
  (`/state`) covers transient confirmations.
- **Visual check.** Keep the app's brand assets; check light and dark, and keyboard focus, as in
  FIRST-APP.md §1.4.

## 7. CI

GitHub Actions installs with the job token. In the workflow:

```yaml
permissions:
  contents: read
  packages: read          # the job token may read packages that grant this repository access

jobs:
  verify:
    steps:
      - uses: actions/setup-node@<pinned sha>
        with:
          node-version: 24
          registry-url: https://npm.pkg.github.com
          scope: "@scshafe"          # writes a user-level npmrc that reads NODE_AUTH_TOKEN
      - run: npm ci                  # or: pnpm install --frozen-lockfile
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

A `403` here is a missing package grant ([section 2](#2-registry-access)). Never put a personal
token in CI. Private repositories run no Actions on this account: verify locally and say so in the
pull request.

## 8. The deploy build

Apps on the runner lane build their image on the production host from the deploy job's checkout.
The deploy job's token reaches `docker build` as a BuildKit secret, and only that:

1. The managed `.github/workflows/deploy.yml` already has `permissions: packages: read`.
2. The app's `deploy/stack/stack.toml` names the secret; the host fills every id listed there with
   the deploy job's token:

   ```toml
   [deploy]
   build_secrets = ["npm_token"]
   ```

3. The package grants the repository read access (the same grant CI needs).
4. The Dockerfile mounts the secret in the one `RUN` that installs, writes a temporary npmrc,
   installs, and deletes it in the same `RUN`, so the token is in no layer, environment variable or
   build argument:

   ```dockerfile
   # syntax=docker/dockerfile:1
   FROM node:24-bookworm-slim@sha256:<digest> AS build
   WORKDIR /app
   COPY package.json package-lock.json .npmrc ./
   RUN --mount=type=secret,id=npm_token,required=true sh -eu -c '(umask 077; printf "//npm.pkg.github.com/:_authToken=%s\n" "$(cat /run/secrets/npm_token)" > /tmp/npmrc); NPM_CONFIG_USERCONFIG=/tmp/npmrc npm ci --omit=dev; rm -f /tmp/npmrc'
   ```

   With pnpm (the mail apps' Dockerfiles), copy `pnpm-lock.yaml` and `pnpm-workspace.yaml`, run
   `corepack enable pnpm` first, and run `pnpm install --frozen-lockfile` in that `RUN` instead.
   `required=true` makes a build without the secret fail at once instead of with a `401` later.

Build it locally with the token from your environment, never on the command line:

```sh
docker build --secret id=npm_token,env=NODE_AUTH_TOKEN -t <app> .
```

`docker history --no-trunc <app>` shows no token. The id is only a name: voice-journey uses
`node_auth_token` with the same mechanism; new apps use `npm_token`, as `stack.toml`'s
documentation does. Apps on the older autodeploy lane have no job token to pass; move them to the
runner lane first rather than baking in a long-lived token.

## 9. Theming

Every colour, surface, border, radius, shadow, space and duration is a `--sui-*` custom property
with a light and a dark value. The theme follows the user's `prefers-color-scheme`;
`data-sui-theme="light"` or `"dark"` pins one, on the root or on any subtree. Pin it in the HTML
on the server (`documentPage({ theme })`), or with `useSuiTheme` / `applySuiTheme` /
`SuiProviders theme` in React. The full list is in the [README](../README.md#theming-and-tokens),
and as data in `@scshafe/ui/tokens` (`SUI_TOKENS`, with both values and a contrast role).

**Theming is CSS.** A brand re-declares tokens in the app's own stylesheet, loaded after the
package's. For one theme, use the package's selectors; at `:root` alone a value applies to both
themes, which pins one palette for light and dark alike:

```css
:root { --sui-radius: 4px; }                                          /* both themes */
:root, [data-sui-theme="light"] { --sui-accent: #7a2e9e; }            /* light */
@media (prefers-color-scheme: dark) {
  :root:not([data-sui-theme="light"]) { --sui-accent: #d6a8ff; }    /* dark, from the system */
}
[data-sui-theme="dark"] { --sui-accent: #d6a8ff; }                    /* dark, pinned */
```

What that means for an existing app:

- **Map, then delete.** Map the app's own variables onto `--sui-*` tokens (or replace their uses),
  then delete the rules the package covers. Never copy or fork the package stylesheets; app-specific
  classes live in the app's stylesheet under the app's own prefix, never `sui-`.
- **Keep the contrast.** The package checks 4.5:1 for text and 3:1 for control boundaries and the
  focus ring, in both themes, for its own values. Re-declared values are yours to check; the
  package's `test/contrast.test.mjs` shows the computation over `SUI_TOKENS`.
- **No runtime theming API.** Nothing sets tokens from JavaScript, and the server helpers never emit
  a `style` attribute (the strict CSP forbids it). The only runtime switch is `data-sui-theme`.
  Colours that vary per request (per tenant, per user) need a stylesheet the app generates and
  serves from its own origin (for example `/brand/<tenant>.css` re-declaring the tokens), not an
  inline `style`; and arbitrary brand colours need the app's own contrast check.
- **Native controls** follow the theme through `color-scheme`, which each theme block sets; the
  checkbox also takes `accent-color: var(--sui-accent)`.

## 10. Checklist

- [ ] `.npmrc`: the `@scshafe` scope line only.
- [ ] `dev.toml [identity]`: `packages = "read"`; `dev identity apply`, the owner runs the printed
      command; `dev identity verify` passes.
- [ ] The package grant for the repository (`dev grants <project>`), made by the owner.
- [ ] `@scshafe/ui` pinned exactly, the lockfile committed; pnpm: `autoInstallPeers: false`.
- [ ] Node `>=22.22` (22.x) or `>=24.18` (24.x) in `engines` and the Docker base image.
- [ ] CommonJS: `require("@scshafe/ui/ssr")` (or `import()` at startup).
- [ ] The stylesheets served or imported once; `body` takes `--sui-bg` and `--sui-text`.
- [ ] CI: `packages: read`, `actions/setup-node` with `registry-url` and `scope`.
- [ ] Docker: the `npm_token` secret mount; `stack.toml` `build_secrets = ["npm_token"]`.
- [ ] Tests assert on `data-sui-component` markers.
- [ ] Light, dark, reduced motion and keyboard focus checked by hand (FIRST-APP.md §1.4 / §2.4).
