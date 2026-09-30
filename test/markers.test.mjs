// The marker contract after the rename: the shell, navigation, form, status and
// empty-state components render through the package's public specifiers
// ("@scshafe/ui", resolved through package.json exports) with their
// data-sui-component markers and sui- classes, and nothing in the markup or the
// shipped stylesheets still carries the retired mc namespace.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import * as ui from "@scshafe/ui";
import * as state from "@scshafe/ui/state";

const h = React.createElement;

const CASES = [
  // Shell and layout
  ["Stack", h(ui.Stack, { gap: "md" }, "a"), /class="sui-stack[^"]*"/],
  ["Inline", h(ui.Inline, { gap: "sm", wrap: true }, "a"), /class="sui-inline[^"]*"/],
  ["Grid", h(ui.Grid, { gap: "md", columns: { kind: "equal", count: 2 } }, "a"), /class="sui-grid[^"]*"/],
  ["Pane", h(ui.Pane, null, "a"), /class="sui-pane[^"]*"/],
  ["Scroll", h(ui.Scroll, { axis: "y" }, "a"), /class="sui-scroll[^"]*"/],
  // Navigation
  ["FocusTabsComponent", h(ui.FocusTabs, { model: { role: "tablist", items: [{ key: "a", id: "a", icon: "tab.plans", ariaSelected: true }] } }), /role="tablist"/],
  ["Tab", h(ui.Tab, { id: "t", label: "Plans", active: true }), /class="sui-tab[^"]*"/],
  // Form
  ["InputField", h(ui.InputField, { id: "name", label: "Name", value: "", onChange() {} }), /<input/],
  ["SelectField", h(ui.SelectField, { id: "kind", label: "Kind", value: "a", options: [{ value: "a", label: "A" }], onChange() {} }), /<select/],
  ["TextAreaField", h(ui.TextAreaField, { id: "note", label: "Note", value: "", onChange() {} }), /<textarea/],
  ["Button", h(ui.Button, { label: "Save", variant: "primary" }), /class="sui-button[^"]*"/],
  // Status
  ["Status", h(ui.Status, { state: "running" }), /class="chip green"/],
  ["StatCount", h(ui.StatCount, { state: "running", count: 3 }), /3/],
  ["Kbd", h(ui.Kbd, { keys: ["Ctrl", "K"] }), /sui-kbd/],
  // Empty state
  ["EmptyState", h(ui.EmptyState, { message: "Nothing here yet." }), /Nothing here yet\./],
];

for (const [name, element, shape] of CASES) {
  test(`${name} renders its data-sui-component marker`, () => {
    const html = renderToStaticMarkup(element);
    assert.match(html, new RegExp(`data-sui-component="${name}"`));
    assert.match(html, shape);
  });
}

test("SuiProviders from @scshafe/ui/state renders a store-backed tree (renderToString)", () => {
  const store = state.createSuiStore({ slices: [state.Toasts, state.Popovers] });
  const html = renderToString(h(state.SuiProviders, { store }, h(state.ToastTray), h(ui.EmptyState, { message: "empty" })));
  assert.match(html, /data-sui-component="EmptyState"/);
  assert.equal(typeof state.createSuiStore, "function");
});

test("no retired mc names in rendered markup, exports or stylesheets", () => {
  const html = CASES.map(([, element]) => renderToStaticMarkup(element)).join("\n");
  assert.doesNotMatch(html, /data-mc-|\bmc-|--mc-/);
  for (const exported of [...Object.keys(ui), ...Object.keys(state)]) {
    assert.doesNotMatch(exported, /^Mc[A-Z]|[a-z]Mc[A-Z]|^mc[A-Z]/, `export ${exported}`);
  }
  for (const stylesheet of ["layout.css", "components.css", "tokens.css"]) {
    const css = readFileSync(new URL(`../${stylesheet}`, import.meta.url), "utf8");
    assert.doesNotMatch(css, /\.mc-|--mc-|data-mc-/, stylesheet);
  }
});
