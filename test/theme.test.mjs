// Themes: the stylesheets cascade the light values by default and the dark
// values under data-sui-theme="dark" (root or subtree), and the explicit
// override works through applySuiTheme, useSuiTheme and SuiProviders' theme
// option. Runs in jsdom, which computes custom properties through the cascade
// (it evaluates no media queries, so prefers-color-scheme itself is covered by
// the stylesheet structure in tokens.test.mjs).
import assert from "node:assert/strict";
import test from "node:test";
import { installDom, render } from "./support/dom.mjs";

installDom();
const React = await import("react");
const { applySuiTheme, SUI_THEME_ATTRIBUTE, EmptyState } = await import("@scshafe/ui");
const { SUI_TOKENS } = await import("@scshafe/ui/tokens");
const { SuiProviders, createSuiStore, Popovers } = await import("@scshafe/ui/state");

const h = React.createElement;
const root = () => document.documentElement;
// jsdom serializes rgba() without spaces; compare values whitespace-insensitively.
const squash = (value) => value.replace(/\s+/g, "");
const token = (element, name) => squash(getComputedStyle(element).getPropertyValue(name));
const themed = SUI_TOKENS.filter((t) => t.themed);

test("every themed token cascades its light value by default and its dark value when pinned", () => {
  for (const t of themed) assert.equal(token(root(), t.name), squash(t.light), `${t.name} light`);
  root().setAttribute(SUI_THEME_ATTRIBUTE, "dark");
  try {
    for (const t of themed) assert.equal(token(root(), t.name), squash(t.dark), `${t.name} dark`);
    assert.equal(getComputedStyle(root()).getPropertyValue("color-scheme").trim(), "dark");
  } finally {
    root().removeAttribute(SUI_THEME_ATTRIBUTE);
  }
});

test("a subtree can pin the other theme", () => {
  const dark = document.createElement("section");
  dark.setAttribute(SUI_THEME_ATTRIBUTE, "dark");
  const light = document.createElement("div");
  light.setAttribute(SUI_THEME_ATTRIBUTE, "light");
  dark.appendChild(light);
  document.body.appendChild(dark);
  try {
    assert.equal(token(dark, "--sui-bg"), squash(SUI_TOKENS.find((t) => t.name === "--sui-bg").dark));
    assert.equal(token(light, "--sui-bg"), squash(SUI_TOKENS.find((t) => t.name === "--sui-bg").light));
  } finally {
    dark.remove();
  }
});

test("applySuiTheme pins, clears and restores the attribute", () => {
  const restore = applySuiTheme("dark");
  assert.equal(root().getAttribute(SUI_THEME_ATTRIBUTE), "dark");
  const restoreSystem = applySuiTheme("system");
  assert.equal(root().hasAttribute(SUI_THEME_ATTRIBUTE), false, "system follows prefers-color-scheme");
  restoreSystem();
  assert.equal(root().getAttribute(SUI_THEME_ATTRIBUTE), "dark");
  restore();
  assert.equal(root().hasAttribute(SUI_THEME_ATTRIBUTE), false);
  assert.throws(() => applySuiTheme("sepia"), /unknown @scshafe\/ui theme/);
});

test("SuiProviders' theme option pins the document theme while mounted", async () => {
  const store = createSuiStore({ slices: [Popovers] });
  const view = await render(h(SuiProviders, { store, theme: "dark" }, h(EmptyState, { message: "x" })));
  assert.equal(root().getAttribute(SUI_THEME_ATTRIBUTE), "dark");
  assert.equal(token(view.container.firstElementChild, "--sui-text"), squash(SUI_TOKENS.find((t) => t.name === "--sui-text").dark));
  await view.unmount();
  assert.equal(root().hasAttribute(SUI_THEME_ATTRIBUTE), false, "unmount restores the previous value");
  const untouched = await render(h(SuiProviders, { store }, h(EmptyState, { message: "x" })));
  assert.equal(root().hasAttribute(SUI_THEME_ATTRIBUTE), false, "no theme option leaves the attribute alone");
  await untouched.unmount();
});
