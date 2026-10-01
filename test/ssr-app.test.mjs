// The U3 example server-rendered app (examples/ssr-app): plain node:http on @scshafe/ui/ssr,
// booted on an ephemeral port. Every page carries the CSP header (no inline style, no script),
// the frame/navigation/form/status/list/table markers, no style attribute and no <script>; the
// package stylesheets are served from the package; user input is escaped; unknown paths 404.
import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const { createApp, CSP } = await import("../examples/ssr-app/server.mjs");

const server = createApp({ now: () => Date.parse("2026-10-01T12:00:00Z") });
server.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());

async function get(path, init) {
  const response = await fetch(base + path, init);
  return { response, body: await response.text() };
}

function assertPage({ response, body }, status = 200) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("content-security-policy"), CSP);
  for (const directive of ["default-src 'self'", "style-src 'self'", "script-src 'none'"]) assert.ok(CSP.includes(directive), directive);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(body, /^<!doctype html><html lang="en">/);
  // Structural, not textual: escaped text may spell "onerror=" and must stay text.
  const { document } = new JSDOM(body).window;
  assert.equal(document.querySelector("script, img, iframe, object, embed, [style]"), null);
  for (const element of document.querySelectorAll("*")) {
    for (const { name } of element.attributes) assert.ok(!/^on/i.test(name), `event-handler attribute ${name}`);
  }
  for (const marker of ["AppFrame", "AppShell", "NavTabs", "Tab"]) assert.ok(body.includes(`data-sui-component="${marker}"`), marker);
}

test("the inbox page renders the shell, navigation, form, status, list and table markers", async () => {
  const page = await get("/");
  assertPage(page);
  for (const marker of ["TabPanelHeader", "InputField", "Button", "Grid", "MetricCard", "List", "ListRow", "Title", "Description", "Status", "PinnedDataTable"]) {
    assert.ok(page.body.includes(`data-sui-component="${marker}"`), marker);
  }
  assert.match(page.body, /<a class="sui-tab sui-tab-active" href="\/" aria-current="page"/);
  assert.match(page.body, /<form class="app-search" action="\/" method="get" role="search">/);
  assert.match(page.body, /<input id="q" name="q" type="search" value=""/);
  assert.match(page.body, /<a href="\/m\/m1" class="sui-list-row-anchor">Next steps for the role<\/a>/);
  assert.match(page.body, /class="sui-grid [^"]*sui-grid-auto-fit--xs"/);
  assert.match(page.body, />4h ago</, "relative time from the injected clock");
});

test("the package stylesheets are served from the package", async () => {
  for (const sheet of ["tokens.css", "layout.css", "components.css"]) {
    const { response, body } = await get(`/assets/${sheet}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/css; charset=utf-8");
    assert.equal(body, readFileSync(fileURLToPath(import.meta.resolve(`@scshafe/ui/${sheet}`)), "utf8"));
  }
  const page = await get("/");
  for (const href of ["/assets/tokens.css", "/assets/layout.css", "/assets/components.css", "/assets/app.css"]) {
    assert.ok(page.body.includes(`<link rel="stylesheet" href="${href}"/>`), href);
  }
});

test("search input is escaped everywhere it appears", async () => {
  const hostile = `"><script>alert(1)</script><img src=x onerror=alert(2)>`;
  const page = await get(`/?q=${encodeURIComponent(hostile)}`);
  assertPage(page);
  assert.ok(page.body.includes('value="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;"'));
  assert.ok(page.body.includes("Nothing matches “&quot;&gt;&lt;script&gt;"));
  assert.doesNotMatch(page.body, /<img|<script/i);
});

test("other pages, 404 and 405", async () => {
  assertPage(await get("/rules"));
  const message = await get("/m/m3");
  assertPage(message);
  assert.match(message.body, /20% off ends Sunday/);
  assert.match(message.body, /Received 18h ago\./);
  const missing = await get("/m/nope");
  assertPage(missing, 404);
  assert.match(missing.body, /data-sui-component="EmptyState" role="status">Not found\./);
  const post = await fetch(`${base}/`, { method: "POST", body: "x" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
  await post.text();
});
