# Your first app with `@scshafe/ui`

This guide builds two small apps from an empty directory, each on **one published version**
of `@scshafe/ui` (`0.4.1` throughout):

1. **A React app** (Vite, plain JSX): an app frame with navigation, a search form, a list with
   status, an empty state and a theme switch.
2. **A server-rendered app** (`node:http`, no React, no client JavaScript): the same kinds of
   components from `@scshafe/ui/ssr`, under a strict Content-Security-Policy.

Each part ends with the same three checks: **themes** (light, dark, and the explicit override),
**reduced motion**, and **keyboard focus**. Allow about 30 minutes. Every command runs in a
POSIX shell (bash or zsh) on Linux or macOS.

## 0. Prerequisites

**Node and pnpm.** Node 22.22+ or 24.18+, and pnpm 10:

```sh
node --version     # v22.22.0 or newer 22.x, or v24.18.0 or newer 24.x
pnpm --version     # 10.x
```

No pnpm? `corepack enable pnpm` installs the shim. If that fails with a permission error
(a system-wide Node), use a directory you own that is on your `PATH`:
`corepack enable --install-directory ~/.local/bin pnpm`.

**Read access to the package.** `@scshafe/ui` is a private package on GitHub Packages. You need
a GitHub personal access token (classic) with the `read:packages` scope, from an account that
may read the `scshafe` packages. It lives in your **user-level** `~/.npmrc` only, never in a
project and never in a terminal's output. Check whether one is configured (this prints a count,
never the token):

```sh
grep -c '^//npm.pkg.github.com/:_authToken=' ~/.npmrc 2>/dev/null || true
```

`1` means it is configured: skip to the access check. `0` or nothing: add it. `read -rs` reads
the token without echoing it (paste it, then press Enter), and the token never appears on a
command line:

```sh
read -rs NPM_PKG_TOKEN && printf '//npm.pkg.github.com/:_authToken=%s\n' "$NPM_PKG_TOKEN" >> ~/.npmrc; unset NPM_PKG_TOKEN; chmod 600 ~/.npmrc
```

Access check: this must print `0.4.1`.

```sh
pnpm view @scshafe/ui@0.4.1 version --@scshafe:registry=https://npm.pkg.github.com
```

A `401` means the token is missing or wrong; a `403` or `404` means the token's account cannot
read the package (ask the package owner for access). Do not continue until this prints `0.4.1`.

## 1. A React app (Vite)

### 1.1 The project

```sh
mkdir first-react-app && cd first-react-app
```

Create `.npmrc` in the project. The first line maps the `@scshafe` scope to GitHub Packages (no
token here). The second stops pnpm from installing the package's *optional* peers (the editor's
tiptap packages) that this app does not use:

```ini
@scshafe:registry=https://npm.pkg.github.com
auto-install-peers=false
```

Create `package.json`:

```json
{
  "name": "first-react-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Install one exact version of the package, its required peer `react` and `react-dom`, and Vite:

```sh
pnpm add --save-exact @scshafe/ui@0.4.1 react@19.3.0 react-dom@19.3.0
pnpm add --save-dev --save-exact vite@8.3.2 @vitejs/plugin-react@6.1.1
```

`pnpm list --depth 0` now shows exactly those five packages.

### 1.2 The files

`vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
```

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>First app</title>
    <link rel="icon" href="data:," />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`src/main.jsx` imports the package's stylesheets once, then your own:

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import "@scshafe/ui/layout.css";
import "@scshafe/ui/components.css";
import "./app.css";
import { App } from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
```

`src/app.css` frames the page with the theme's colours. Everything inside comes from the
package:

```css
html, body, #root { height: 100%; margin: 0; }
body { background: var(--sui-bg); color: var(--sui-text); font-family: system-ui, sans-serif; font-size: 14px; }
#root { display: flex; flex-direction: column; }
.app-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; border-bottom: 1px solid var(--sui-line); }
.app-brand { font-weight: 700; color: var(--sui-text-strong); }
.app-body { padding: 16px; }
.app-search { display: flex; align-items: end; gap: 8px; flex-wrap: wrap; }
```

`src/App.jsx`: the app frame (`.sui-app-frame` with a header and a `.sui-app-shell` main
area), navigation tabs, a theme switch, a search form, a list with status and an empty state:

```jsx
import React, { useState } from "react";
import {
  Button, EmptyState, Inline, InputField, List, ListRow, Panel, PanelHeader,
  SelectField, Stack, Tab, TabPanelHeader, useSuiTheme
} from "@scshafe/ui";

const MESSAGES = [
  { id: "m1", from: "Pat Recruiter", subject: "Next steps for the role", state: "running" },
  { id: "m2", from: "Daily Digest", subject: "Your Thursday reading", state: "completed" },
  { id: "m3", from: "Shop", subject: "20% off ends Sunday", state: "queued" }
];

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
];

export function App() {
  const [section, setSection] = useState("inbox");
  const [theme, setTheme] = useState("system");
  const [query, setQuery] = useState("");
  useSuiTheme(theme); // pins data-sui-theme on <html>; "system" follows the OS

  const q = query.trim().toLowerCase();
  const shown = MESSAGES.filter((m) => `${m.from} ${m.subject}`.toLowerCase().includes(q));

  return (
    <div className="sui-app-frame">
      <header className="app-header">
        <span className="app-brand">First app</span>
        <nav aria-label="Sections">
          <Inline gap="xs">
            <Tab id="inbox" label="Inbox" badge={MESSAGES.length} active={section === "inbox"} onSelect={setSection} />
            <Tab id="settings" label="Settings" active={section === "settings"} onSelect={setSection} />
          </Inline>
        </nav>
        <SelectField id="theme" label="Theme" value={theme} options={THEMES} onChange={setTheme} />
      </header>
      <main className="sui-app-shell" aria-label={section === "inbox" ? "Inbox" : "Settings"}>
        <div className="app-body">
          {section === "inbox" ? (
            <Stack gap="lg">
              <TabPanelHeader title="Inbox" headingLevel={1} aside={`${MESSAGES.length} messages`} />
              <form className="app-search" role="search" onSubmit={(event) => event.preventDefault()}>
                <InputField id="q" label="Search" type="search" value={query} placeholder="Sender or subject" onChange={setQuery} />
                <Button label="Clear" variant="ghost" onClick={() => setQuery("")} />
              </form>
              <List title="Messages" count={shown.length} empty={{ message: `Nothing matches “${query}”.` }}>
                {shown.map((m) => <ListRow key={m.id} title={m.subject} subtitle={m.from} status={m.state} />)}
              </List>
            </Stack>
          ) : (
            <Panel>
              <PanelHeader title="Settings" headingLevel={1} description="Nothing to configure yet." />
              <EmptyState message="No settings yet." />
            </Panel>
          )}
        </div>
      </main>
    </div>
  );
}
```

### 1.3 Run it

```sh
pnpm dev
```

Open the URL it prints (`http://localhost:5173/`). You see the header with **Inbox (3)** and
**Settings** tabs and a **Theme** select, the inbox heading, the search form and three message
rows with status. Type `zzz` in **Search**: the list shows *Nothing matches “zzz”.*; **Clear**
brings the rows back. **Settings** shows a panel with *No settings yet.*

### 1.4 Check it

Open the browser's developer tools. **Chrome or Edge:** ⋮ (in DevTools) → **More tools →
Rendering**, which has *Emulate CSS media feature prefers-color-scheme* and
*prefers-reduced-motion*. **Firefox:** the Inspector's toolbar has the light/dark
(☀/☾) simulation buttons; for reduced motion set `ui.prefersReducedMotion` to `1` in
`about:config` (delete it afterwards).

- **Themes.** Choose **Dark** in the Theme select: the page turns dark and `<html>` carries
  `data-sui-theme="dark"`. **Light** pins the light theme even when the OS is dark. **System**
  removes the attribute; then emulate *prefers-color-scheme: dark* / *light* in the Rendering
  panel and the page follows it.
- **Reduced motion.** Emulate *prefers-reduced-motion: reduce*, then run in the console:
  `getComputedStyle(document.documentElement).getPropertyValue("--sui-duration")`. It prints
  `0s`; without the emulation it prints the normal `120ms`. Every component transition reads
  this token.
- **Keyboard focus.** Click the page background, then press **Tab** repeatedly: focus moves
  through the Inbox tab, Settings tab, Theme select, Search field and Clear button in reading
  order, and every focused control shows a visible focus ring. **Shift+Tab** goes back. Clicking
  a control with the mouse shows no ring (`:focus-visible`).

### 1.5 Build it

```sh
pnpm build
```

Vite writes a static site to `dist/` (`pnpm preview` serves it). That is the deliverable of a
React app on `@scshafe/ui`.

## 2. A server-rendered app (no React)

`@scshafe/ui/ssr` emits the same classes and `data-sui-component` markers as the React
components, from plain string helpers that escape every value. It needs no React and no other
peer, and the page runs no JavaScript at all.

### 2.1 The project

```sh
cd ..
mkdir first-ssr-app && cd first-ssr-app
```

`.npmrc`, the same two lines as before (with `auto-install-peers=false`, installing the package
alone installs **no** React):

```ini
@scshafe:registry=https://npm.pkg.github.com
auto-install-peers=false
```

`package.json`:

```json
{
  "name": "first-ssr-app",
  "private": true,
  "type": "module",
  "scripts": { "start": "node server.mjs" }
}
```

```sh
pnpm add --save-exact @scshafe/ui@0.4.1
```

`pnpm list --depth 0` shows only `@scshafe/ui 0.4.1` (and `ls node_modules` has no `react`).

### 2.2 The files

`app.css` frames the document (the package's stylesheets style everything inside):

```css
html, body { height: 100%; margin: 0; }
body { display: flex; flex-direction: column; background: var(--sui-bg); color: var(--sui-text); font-family: system-ui, sans-serif; font-size: 14px; }
.app-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; border-bottom: 1px solid var(--sui-line); }
.app-brand { font-weight: 700; color: var(--sui-text-strong); }
.app-body { padding: 16px; }
.app-search { display: flex; align-items: end; gap: 8px; flex-wrap: wrap; }
```

`server.mjs`: a `node:http` server that serves the package's three stylesheets and your
`app.css`, and renders the pages. The theme override is a query parameter (`?theme=dark` or
`?theme=light`) that pins `data-sui-theme` on `<html>`; without it the page follows the OS.

```js
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as ui from "@scshafe/ui/ssr";

const CSP = "default-src 'self'; style-src 'self'; script-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

const ASSETS = new Map([
  ["/assets/tokens.css", fileURLToPath(import.meta.resolve("@scshafe/ui/tokens.css"))],
  ["/assets/layout.css", fileURLToPath(import.meta.resolve("@scshafe/ui/layout.css"))],
  ["/assets/components.css", fileURLToPath(import.meta.resolve("@scshafe/ui/components.css"))],
  ["/assets/app.css", fileURLToPath(new URL("./app.css", import.meta.url))]
]);

const MESSAGES = [
  { id: "m1", from: "Pat Recruiter", subject: "Next steps for the role", state: "running" },
  { id: "m2", from: "Daily Digest", subject: "Your Thursday reading", state: "completed" },
  { id: "m3", from: "Shop", subject: "20% off ends Sunday", state: "queued" }
];

function page({ title, active, theme, body }) {
  const keep = theme ? `?theme=${theme}` : "";
  const nav = ui.navTabs({
    ariaLabel: "Sections",
    items: [
      { id: "inbox", label: "Inbox", href: `/${keep}`, active: active === "inbox", badge: MESSAGES.length },
      { id: "settings", label: "Settings", href: `/settings${keep}`, active: active === "settings" }
    ]
  });
  return ui.documentPage({
    title,
    theme, // "light" | "dark" pins data-sui-theme on <html>; undefined follows the OS
    stylesheets: [...ASSETS.keys()],
    body: ui.appShell({
      ariaLabel: title,
      chrome: ui.html`<header class="app-header"><span class="app-brand">First app</span>${nav}</header>`,
      children: ui.html`<div class="app-body">${body}</div>`
    })
  });
}

function inbox(query, theme) {
  const q = query.trim().toLowerCase();
  const shown = MESSAGES.filter((m) => `${m.from} ${m.subject}`.toLowerCase().includes(q));
  return ui.stack({ gap: "lg", children: [
    ui.tabPanelHeader({ title: "Inbox", headingLevel: 1, aside: `${MESSAGES.length} messages` }),
    ui.html`<form class="app-search" action="/" method="get" role="search">${[
      ui.inputField({ id: "q", name: "q", label: "Search", type: "search", value: query, placeholder: "Sender or subject" }),
      theme ? ui.html`<input type="hidden" name="theme" value="${theme}"/>` : null,
      ui.button({ label: "Search", type: "submit", variant: "primary" }),
      q ? ui.button({ label: "Clear", href: theme ? `/?theme=${theme}` : "/", variant: "ghost" }) : null
    ]}</form>`,
    ui.list({
      title: "Messages",
      count: shown.length,
      empty: { message: `Nothing matches “${query}”.` },
      children: shown.map((m) => ui.listRow({ title: m.subject, subtitle: m.from, status: m.state, as: "div" }))
    })
  ] });
}

function settings() {
  return ui.panel({ children: [
    ui.panelHeader({ title: "Settings", headingLevel: 1, description: "Nothing to configure yet." }),
    ui.emptyState({ message: "No settings yet." })
  ] });
}

createServer(async (request, response) => {
  const send = (status, type, body) => {
    response.writeHead(status, { "content-security-policy": CSP, "content-type": type, "x-content-type-options": "nosniff" });
    response.end(body);
  };
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/favicon.ico") return send(204, "image/x-icon", ""); // no icon, and no 404 in the console
    const asset = ASSETS.get(url.pathname);
    if (asset) return send(200, "text/css; charset=utf-8", await readFile(asset));
    const theme = ["light", "dark"].includes(url.searchParams.get("theme")) ? url.searchParams.get("theme") : undefined;
    if (url.pathname === "/") {
      return send(200, "text/html; charset=utf-8", String(page({ title: "Inbox", active: "inbox", theme, body: inbox(url.searchParams.get("q") ?? "", theme) })));
    }
    if (url.pathname === "/settings") {
      return send(200, "text/html; charset=utf-8", String(page({ title: "Settings", active: "settings", theme, body: settings() })));
    }
    return send(404, "text/plain; charset=utf-8", "Not Found\n");
  } catch (error) {
    console.error(error);
    return send(500, "text/plain; charset=utf-8", "Internal Server Error\n");
  }
}).listen(Number(process.env.PORT ?? 8080), "127.0.0.1", function () {
  console.log(`http://127.0.0.1:${this.address().port}/`);
});
```

Every value you pass to a helper (the query, the subjects) is escaped; `ui.html` escapes its
interpolated values too. Only helper output and `ui.trustedHtml(...)` pass through unescaped, so
never hand user input to `trustedHtml`.

### 2.3 Run it

```sh
pnpm start
```

It prints the address it listens on: `http://127.0.0.1:8080/`. If port 8080 is already taken
(`EADDRINUSE`), pick another with `PORT=8081 pnpm start` and use that port wherever this guide
says 8080. Open the address. You see the same header, tabs, heading, search form and three
rows as the React app. Search for `zzz`: the list shows *Nothing matches “zzz”.*; **Clear**
returns. In a second terminal, the page's policy:

```sh
curl -sI http://127.0.0.1:8080/ | grep -i content-security-policy
```

It prints the strict policy (`style-src 'self'; script-src 'none'` …). The browser console
shows no CSP violations: the helpers never emit a `style` attribute, a `<script>` or an event
handler.

### 2.4 Check it

- **Themes.** `http://127.0.0.1:8080/?theme=dark` is dark (`<html data-sui-theme="dark">`)
  and stays dark across the tabs and the search; `?theme=light` pins light. Without the
  parameter, emulate *prefers-color-scheme* in the Rendering panel: the page follows it.
- **Reduced motion.** Emulate *prefers-reduced-motion: reduce* and run the same console line
  as in 1.4: `0s`.
- **Keyboard focus.** Press **Tab** from the top: the Inbox and Settings tabs (links), the
  Search field and the Search button, each with a visible focus ring; **Enter** on a focused tab
  follows the link. **Ctrl+C** stops the server.

## What next

- The [README](../README.md) lists every component, subpath and helper, theming by re-declaring
  tokens, and the identity and state layers.
- [ACCESSIBILITY.md](ACCESSIBILITY.md) says what the package checks for you and what your app
  still owns.
- Pin exact versions (`--save-exact`) and upgrade deliberately: read the
  [CHANGELOG](../CHANGELOG.md) first.
- In GitHub Actions, install with the job token (`actions/setup-node` with `registry-url:
  https://npm.pkg.github.com` and `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`) after the
  package's owner grants your repository read access. Never put a personal token in CI.
