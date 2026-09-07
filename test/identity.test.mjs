import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { buildSignOutUrl, useIdentity, UserMenu } from "mc-ui/identity";
import { createIdentityResource } from "../lib/identity/identityResource.js";

const appLocation = { hostname: "inbox.example.ts.net", origin: "https://inbox.example.ts.net" };
const expectedSignOut = "/oauth2/sign_out?rd=https%3A%2F%2Fid.example.ts.net%2Fapi%2Foidc%2Fend-session%3Fid_token_hint%3D%7Bid_token%7D%26post_logout_redirect_uri%3Dhttps%253A%252F%252Finbox.example.ts.net%252F";
const userInfo = { user: "subject-1", email: "person@example.test", preferredUsername: "person", groups: ["family"] };
const response = (payload) => ({ ok: true, json: async () => payload });

test("logout matches Inbox's proven double-encoded redirect and retains the proxy token macro", () => {
  assert.equal(buildSignOutUrl(appLocation), expectedSignOut);
  const outer = new URL(expectedSignOut, appLocation.origin);
  const endSession = new URL(outer.searchParams.get("rd"));
  assert.equal(endSession.origin, "https://id.example.ts.net");
  assert.equal(endSession.searchParams.get("id_token_hint"), "{id_token}");
  assert.equal(endSession.searchParams.get("post_logout_redirect_uri"), appLocation.origin + "/");
  const port = buildSignOutUrl({ ...appLocation, origin: appLocation.origin + ":8443" });
  assert.equal(new URL(new URL(port, appLocation.origin).searchParams.get("rd")).searchParams.get("post_logout_redirect_uri"), appLocation.origin + ":8443/");
});

test("logout returns null for IP, dev, malformed and mismatched locations", () => {
  for (const hostname of ["127.0.0.1", "100.64.0.1", "[::1]", "::1", "localhost", "app.localhost", "example.net", "a..example.net", "a.-bad.example", "a.bad_.example"]) {
    assert.equal(buildSignOutUrl({ hostname, origin: `http://${hostname}` }), null, hostname);
  }
  assert.equal(buildSignOutUrl({ ...appLocation, origin: "javascript:alert(1)" }), null);
  assert.equal(buildSignOutUrl({ ...appLocation, origin: "https://another.example.ts.net" }), null);
  assert.equal(buildSignOutUrl({ ...appLocation, origin: "not a URL" }), null);
  assert.equal(buildSignOutUrl(), null, "SSR has no browser location");
});

test("identity loads once with same-origin credentials; explicit refresh coalesces while pending", async () => {
  const calls = [];
  let finish;
  const resource = createIdentityResource((...args) => {
    calls.push(args);
    return new Promise((resolve) => { finish = resolve; });
  });
  const updates = [];
  const unsubscribe = resource.subscribe(() => updates.push(resource.getSnapshot().status));
  assert.deepEqual(resource.getSnapshot(), { status: "loading" });
  const first = resource.load();
  assert.equal(resource.load(), first, "Strict Mode remount does not duplicate the request");
  assert.equal(resource.refresh(), first, "concurrent refresh does not race another response");
  await Promise.resolve();
  assert.deepEqual(calls, [["/oauth2/userinfo", {
    credentials: "same-origin", mode: "same-origin", cache: "no-store",
    redirect: "error", headers: { Accept: "application/json" }
  }]]);
  finish(response({ ...userInfo, additionalClaims: { internalClaim: "not exposed" } }));
  await first;
  assert.deepEqual(resource.getSnapshot(), { status: "identified", ...userInfo });
  await resource.load();
  assert.equal(calls.length, 1, "reading an already-loaded resource never refetches");
  const refreshed = resource.refresh();
  await Promise.resolve();
  assert.equal(calls.length, 2);
  finish({ ok: false, status: 401 });
  await refreshed;
  assert.deepEqual(resource.getSnapshot(), { status: "anonymous" });
  assert.deepEqual(updates, ["loading", "identified", "loading", "anonymous"]);
  unsubscribe();
});

test("userinfo's optional fields are optional and empty/malformed sessions degrade to anonymous", async () => {
  const minimal = createIdentityResource(async () => response({ user: "subject", email: "" }));
  await minimal.load();
  assert.deepEqual(minimal.getSnapshot(), { status: "identified", user: "subject", email: "" });
  for (const raw of [{}, null, [], "login page", { user: "", email: "" }, { ...userInfo, email: 7 }, { ...userInfo, groups: "admin" }, { ...userInfo, preferredUsername: {} }]) {
    const resource = createIdentityResource(async () => response(raw));
    await resource.load();
    assert.deepEqual(resource.getSnapshot(), { status: "anonymous" });
  }
});

test("404, unauthorized, non-JSON and network failures are anonymous and can be manually refreshed", async () => {
  for (const failure of [
    async () => ({ ok: false, status: 404 }),
    async () => ({ ok: false, status: 401 }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError("HTML login page"); } }),
    async () => { throw new TypeError("network unavailable"); }
  ]) {
    let fail = true;
    const resource = createIdentityResource((...args) => fail ? failure(...args) : Promise.resolve(response(userInfo)));
    await resource.load();
    assert.deepEqual(resource.getSnapshot(), { status: "anonymous" });
    fail = false;
    await resource.refresh();
    assert.equal(resource.getSnapshot().status, "identified");
  }
});

test("UserMenu renders the chip and exact sign-out href; anonymous/loading renders nothing", () => {
  const html = renderToStaticMarkup(React.createElement(UserMenu, {
    identity: { status: "identified", ...userInfo }, location: appLocation
  }));
  assert.match(html, /data-mc-component="UserMenu"/);
  assert.ok(html.includes(`href="${expectedSignOut}"`));
  assert.ok(html.includes("person@example.test"));
  assert.ok(html.includes(">Sign out</a>"));
  for (const status of ["anonymous", "loading"]) {
    assert.equal(renderToStaticMarkup(React.createElement(UserMenu, { identity: { status }, location: appLocation })), "");
  }
  const local = renderToStaticMarkup(React.createElement(UserMenu, {
    identity: { status: "identified", user: "<subject>", email: "" },
    location: { hostname: "localhost", origin: "http://localhost" }
  }));
  assert.ok(local.includes("&lt;subject&gt;"));
  assert.ok(!local.includes("href="), "no bogus IdP link in unproxied development");
});

test("hook and connected menu are SSR-safe and never fetch during render", () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("fetch during SSR"); };
  try {
    function Probe() {
      const identity = useIdentity();
      assert.equal(typeof identity.refresh, "function");
      return React.createElement("span", null, identity.status);
    }
    assert.equal(renderToStaticMarkup(React.createElement(Probe)), "<span>loading</span>");
    assert.equal(renderToStaticMarkup(React.createElement(UserMenu)), "");
  } finally {
    globalThis.fetch = original;
  }
});

test("identity subpath is React-only and stays out of the root barrel", async () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(pkg.exports["./identity"], { types: "./lib/identity/index.d.ts", default: "./lib/identity/index.js" });
  assert.doesNotMatch(readFileSync(new URL("../lib/index.js", import.meta.url), "utf8"), /identity\//);
  const bundle = await build({
    stdin: { contents: 'export * from "mc-ui/identity";', resolveDir: fileURLToPath(new URL("..", import.meta.url)) },
    bundle: true, write: false, format: "esm", platform: "browser", metafile: true,
    external: ["react", "react/jsx-runtime"], logLevel: "silent"
  });
  assert.deepEqual([...new Set(Object.values(bundle.metafile.outputs).flatMap((output) => output.imports.map((item) => item.path)))].sort(), ["react", "react/jsx-runtime"]);
  assert.doesNotMatch(bundle.outputFiles[0].text, /react-redux|@reduxjs\/toolkit|iconoir-react|@tiptap/);
});
