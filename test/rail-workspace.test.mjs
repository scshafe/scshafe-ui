// L2 pin — RailWorkspace + the rail family against the committed lib: the Layout
// and PaneSizes slices, collapse/resize state driving the rail's render, the
// mobile inline-width fix (no !important war), and viewport sync.
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const {
  SuiProviders, createSuiStore, Popovers,
  Layout, viewportChanged, surfaceListCollapseToggled, selectIsMobile, selectSurfaceListCollapsed, attachViewportSync,
  PaneSizes, paneSizeSet, paneSizesPersistMiddleware, selectPaneSize,
  CollapsibleListRail, RailToggle, FocusSelectionList, RailWorkspace,
} = await import("../lib/state/index.js");

function storeWith(preloadedState) {
  return createSuiStore({ slices: [Layout, PaneSizes, Popovers], preloadedState });
}

const render = (store, element) => renderToStaticMarkup(React.createElement(SuiProviders, { store }, element));

test("Layout slice: viewport + surface collapse; attachViewportSync drives isMobile", () => {
  const store = storeWith();
  assert.equal(selectIsMobile(store.getState()), false);
  store.dispatch(surfaceListCollapseToggled("plans"));
  assert.equal(selectSurfaceListCollapsed("plans")(store.getState()), true);
  store.dispatch(surfaceListCollapseToggled({ surfaceId: "plans" }));
  assert.equal(selectSurfaceListCollapsed("plans")(store.getState()), false);

  let handler = null;
  const queries = [];
  globalThis.matchMedia = (query) => {
    queries.push(query);
    return { matches: true, addEventListener: (_t, fn) => { handler = fn; }, removeEventListener: () => { handler = null; } };
  };
  try {
    const detach = attachViewportSync(store);
    assert.match(queries[0], /max-width: 880px/, "uses the shipped clamp constant");
    assert.equal(selectIsMobile(store.getState()), true, "initial match dispatches");
    detach();
    assert.equal(handler, null);
  } finally {
    delete globalThis.matchMedia;
  }
});

test("PaneSizes slice persists through the package middleware and hydrates", () => {
  const backing = new Map();
  globalThis.localStorage = { getItem: (k) => backing.get(k) ?? null, setItem: (k, v) => backing.set(k, v) };
  try {
    const store = createSuiStore({ slices: [Layout, PaneSizes, Popovers], middleware: [paneSizesPersistMiddleware] });
    store.dispatch(paneSizeSet({ paneId: "rail:plans", size: 321.6 }));
    assert.equal(selectPaneSize("rail:plans")(store.getState()), 322, "sizes round");
    assert.equal(backing.get("sui-pane-sizes"), JSON.stringify({ sizes: { "rail:plans": 322 } }), "persists under the sui-pane-sizes key");
  } finally {
    delete globalThis.localStorage;
  }
});

test("CollapsibleListRail renders width from PaneSizes, collapses from Layout, and drops inline width on mobile", () => {
  const open = storeWith({ PaneSizes: { sizes: { "rail:plans": 300 } } });
  const html = render(open, React.createElement(CollapsibleListRail, { surfaceId: "plans", title: "Plans", children: "rows" }));
  assert.match(html, /data-sui-component="CollapsibleListRail"[^>]*data-sui-surface-id="plans"[^>]*data-sui-collapsed="false"/);
  assert.match(html, /style="width:300px;flex-basis:300px"/, "persisted width renders inline on desktop");
  assert.match(html, /sui-collapsible-list-rail-body/);
  assert.match(html, /data-sui-component="CollapsibleListRailResize"/);

  const collapsed = storeWith({ Layout: { isMobile: false, collapsedListsBySurface: { plans: true } } });
  const collapsedHtml = render(collapsed, React.createElement(CollapsibleListRail, { surfaceId: "plans", title: "Plans", children: "rows" }));
  assert.match(collapsedHtml, /data-sui-collapsed="true"/);
  assert.doesNotMatch(collapsedHtml, /sui-collapsible-list-rail-body/, "collapsed body unrenders");

  const mobile = storeWith({ Layout: { isMobile: true, collapsedListsBySurface: {} }, PaneSizes: { sizes: { "rail:plans": 300 } } });
  const mobileHtml = render(mobile, React.createElement(CollapsibleListRail, { surfaceId: "plans", title: "Plans", children: "rows" }));
  assert.doesNotMatch(mobileHtml, /style="width:300px/, "mobile skips the inline width — package CSS owns full-width without !important");

  const forced = storeWith({ Layout: { isMobile: true, collapsedListsBySurface: { chats: true } } });
  const forcedHtml = render(forced, React.createElement(CollapsibleListRail, { surfaceId: "chats", title: "Chats", expandOnMobile: true, children: "rows" }));
  assert.match(forcedHtml, /data-sui-collapsed="false"/, "expandOnMobile ignores a carried-over desktop collapse");
});

test("RailToggle + FocusSelectionList + RailWorkspace render their contracts", () => {
  const store = storeWith();
  const toggle = render(store, React.createElement(RailToggle, { surfaceId: "plans", title: "Plans" }));
  assert.match(toggle, /data-sui-component="RailToggle"[^>]*data-sui-surface-id="plans"/);

  const list = render(store, React.createElement(FocusSelectionList, {
    surfaceId: "plans", title: "Plans", count: 12,
    refresh: { onClick: () => {}, label: "Refresh plans" },
    add: { onClick: () => {}, label: "New plan" },
    children: "rows",
  }));
  assert.match(list, /Plans \(12\)/);
  assert.match(list, /aria-label="Refresh plans"/);
  assert.match(list, /aria-label="New plan"/);

  const workspace = renderToStaticMarkup(React.createElement(RailWorkspace, { className: "host-fill", children: "x" }));
  assert.match(workspace, /class="sui-rail-workspace host-fill"[^>]*data-sui-component="RailWorkspace"/);
  const stacked = renderToStaticMarkup(React.createElement(RailWorkspace, { stackAt: "mobile", children: "x" }));
  assert.match(stacked, /sui-rail-workspace--stack-mobile/);
});

test("the carved rail + workspace styles travel in components.css", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../components.css", import.meta.url), "utf8");
  for (const selector of [".sui-rail-workspace", ".sui-collapsible-list-rail", ".sui-collapsible-list-rail-body", ".sui-collapsible-list-rail-resize-handle", "max-width: 560px"]) {
    assert.ok(css.includes(selector), `components.css missing ${selector}`);
  }
  assert.doesNotMatch(css, /!important\s*[;}]/, "the mobile rail rules need no !important");
});
