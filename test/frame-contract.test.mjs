// L1 pin — the workspace frame contract: the contained-scroll classes ship in
// layout.css; FocusTabs and TabPanelHeader render from the root barrel (which
// stays RTK/iconoir-free — the optionality probes cover the imports).
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

const { FocusTabs, FocusTabsComponent, TabPanelHeader } = await import("../lib/index.js");
const { DefaultIconProvider } = await import("../lib/icons/index.js");

test("layout.css carries the full contained-scroll chain", () => {
  const css = readFileSync(new URL("../layout.css", import.meta.url), "utf8");
  for (const selector of [".mc-app-frame", ".mc-app-shell", ".mc-app-shell--contained", ".mc-workspace", ".mc-focus-area", ".mc-workspace-panel", ".mc-fill"]) {
    assert.ok(css.includes(selector + " "), `layout.css missing ${selector}`);
  }
  assert.match(css, /\.mc-workspace \{[^}]*minmax\(0, 1fr\)/, "the grid link uses minmax(0,1fr)");
  assert.match(css, /\.mc-workspace-panel > \* \{ flex: 0 0 auto; \}/, "panel children pin by default");
  assert.match(css, /\.mc-workspace-panel > \.mc-scroll, \.mc-workspace-panel > \.mc-fill, \.mc-workspace-panel > \.mc-rail-workspace \{ flex: 1 1 0; min-height: 0; \}/);
});

test("FocusTabs renders the model contract with injected icons", () => {
  assert.equal(FocusTabs, FocusTabsComponent, "MC's historical export name aliases the same component");
  const model = {
    className: "project-tabs",
    role: "tablist",
    ariaLabel: "Project focus",
    items: [
      { key: "a", id: "overview", icon: "tab.overview", tooltip: "Overview", className: "project-tab", ariaSelected: true, countBadges: [{ label: "open", value: 3 }] },
      { key: "b", id: "runs", icon: "tab.runs", tooltip: "Runs", className: "project-tab", dividerBefore: true, disabled: true },
    ],
  };
  const selections = [];
  const html = renderToStaticMarkup(
    React.createElement(DefaultIconProvider, null,
      React.createElement(FocusTabs, { model, onSelect: (item) => selections.push(item.id) }))
  );
  assert.match(html, /data-mc-component="FocusTabsComponent"[^>]*role="tablist"/);
  assert.match(html, /data-project-tab="overview"[^>]*aria-selected="true"/);
  assert.match(html, /class="project-tab-icon"[^>]*><svg/, "icons render through the seam");
  assert.match(html, /class="project-tab-count"[^>]*aria-label="3 open"[^>]*>3</);
  assert.match(html, /class="project-tab-divider"[^>]*role="separator"/);
  assert.equal(renderToStaticMarkup(React.createElement(FocusTabs, { model: null })), "", "null model renders nothing");
});

test("TabPanelHeader unifies the iconized-refresh convention", () => {
  const clicks = [];
  const html = renderToStaticMarkup(
    React.createElement(DefaultIconProvider, null,
      React.createElement(TabPanelHeader, {
        title: "Implementation plans",
        aside: "12 open",
        statusLabel: "refreshed 2m ago",
        refresh: { label: "Refresh plans", onClick: () => clicks.push(1) },
        leading: React.createElement("span", { "data-leading": "rail-toggle" }),
      }))
  );
  assert.match(html, /class="mc-tab-panel-header"[^>]*data-mc-component="TabPanelHeader"/);
  assert.match(html, /<h4>Implementation plans<\/h4>/);
  assert.match(html, /class="mc-tab-panel-aside">12 open</);
  assert.match(html, /class="mc-tab-panel-status"[^>]*role="status"[^>]*>refreshed 2m ago</);
  assert.match(html, /aria-label="Refresh plans"[^>]*><svg/, "refresh is icon + label");
  assert.match(html, /Refresh<\/button>/);
  assert.match(html, /data-leading="rail-toggle"/);
  const bare = renderToStaticMarkup(React.createElement(TabPanelHeader, { title: "T" }));
  assert.doesNotMatch(bare, /mc-tab-panel-status|button/, "status and refresh are opt-in");
});
