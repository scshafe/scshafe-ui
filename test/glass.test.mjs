// Liquid Glass: the functional layer's material (components.css). Glass falls
// back to the opaque floating surface under reduced transparency, increased
// contrast and data-sui-transparency="reduce"; real backdrop blur stays on leaf
// layers, because backdrop-filter makes an element the containing block of the
// fixed-position Popovers rendered inside it. Legibility over any backdrop is
// checked in contrast.test.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import { SUI_THEME_ATTRIBUTE, SUI_THEMES, SUI_TRANSPARENCY_ATTRIBUTE } from "@scshafe/ui/tokens";
import { declarations, parseRules, readStylesheet, styleRules } from "./support/css.mjs";
import { color } from "./support/contrast.mjs";
import { installDom } from "./support/dom.mjs";

const SOLID = [
  ["--sui-glass", "var(--sui-popover)"],
  ["--sui-glass-thick", "var(--sui-popover)"],
  ["--sui-glass-sheen", "transparent"],
  ["--sui-glass-blur", "0px"],
  ["--sui-glass-saturate", "100%"]
];
// The layers that may blur what is behind them: none of them holds a Popover
// (Popover itself is already transformed, so it is a containing block anyway).
const BLURRED = [".sui-popover", ".sui-toast", ".sui-card-show-full", ".sui-sheet::backdrop", ".sui-card-detail-popover::backdrop"];

const rules = parseRules(readStylesheet("components.css"));

test("glass is translucent and its solid fallback is opaque, in both themes", () => {
  for (const theme of SUI_THEMES) {
    for (const glass of ["--sui-glass", "--sui-glass-thick"]) assert.ok(color(glass, theme).a < 1, `${glass} (${theme})`);
    assert.ok(color("--sui-popover", theme).a >= 0.95, `--sui-popover (${theme}) is opaque enough to stand in for glass`);
  }
});

test("reduced transparency and increased contrast make glass solid", () => {
  const media = rules.filter((rule) => rule.prelude === "@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)");
  assert.equal(media.length, 1);
  assert.deepEqual(media[0].rules.map((rule) => rule.prelude), [":root, [data-sui-theme]"]);
  assert.deepEqual(declarations(media[0].rules[0].body), SOLID);
  const contrast = rules.filter((rule) => rule.prelude === "@media (prefers-contrast: more)");
  assert.equal(contrast.length, 1);
  assert.deepEqual(declarations(contrast[0].rules[0].body), [["--sui-glass-edge", "var(--sui-border-strong)"]]);
});

test("data-sui-transparency=\"reduce\" makes glass solid on a root or a subtree", () => {
  assert.equal(SUI_TRANSPARENCY_ATTRIBUTE, "data-sui-transparency");
  const pinned = rules.filter((rule) => rule.prelude === '[data-sui-transparency="reduce"], [data-sui-transparency="reduce"] [data-sui-theme]');
  assert.equal(pinned.length, 1);
  assert.deepEqual(declarations(pinned[0].body), SOLID);

  // The cascade, in jsdom: the attribute wins over the theme blocks, including
  // inside a subtree that pins the other theme.
  installDom();
  const root = document.documentElement;
  const value = (element, name) => getComputedStyle(element).getPropertyValue(name).replace(/\s+/g, "");
  assert.equal(value(root, "--sui-glass"), "rgba(255,255,255,0.72)");
  const dark = document.createElement("section");
  dark.setAttribute(SUI_THEME_ATTRIBUTE, "dark");
  document.body.appendChild(dark);
  root.setAttribute(SUI_TRANSPARENCY_ATTRIBUTE, "reduce");
  try {
    for (const element of [root, dark]) {
      for (const [name, solid] of SOLID) assert.equal(value(element, name), solid, `${element.tagName} ${name}`);
    }
  } finally {
    root.removeAttribute(SUI_TRANSPARENCY_ATTRIBUTE);
    dark.remove();
  }
});

test("only leaf layers blur their backdrop, and every blur follows the glass tokens", () => {
  const blurred = styleRules(rules).filter((rule) => declarations(rule.body).some(([property]) => /^(-webkit-)?backdrop-filter$/.test(property)));
  assert.deepEqual(blurred.map((rule) => rule.prelude).sort(), [...BLURRED].sort());
  for (const rule of blurred) {
    const props = Object.fromEntries(declarations(rule.body));
    assert.equal(props["-webkit-backdrop-filter"], props["backdrop-filter"], `${rule.prelude} carries the -webkit- twin`);
    assert.match(props["backdrop-filter"], /var\(--sui-glass-blur\)/, `${rule.prelude} blurs by --sui-glass-blur (0px when transparency is reduced)`);
  }
});

test("layers appear through starting styles, not animations", () => {
  const starting = rules.filter((rule) => rule.prelude === "@starting-style");
  assert.equal(starting.length, 1);
  for (const rule of starting[0].rules) {
    for (const [property] of declarations(rule.body)) assert.ok(["opacity", "scale", "translate"].includes(property), `${rule.prelude} { ${property} }`);
  }
  // Each layer with a starting style transitions what it starts from.
  for (const rule of starting[0].rules) {
    const base = rule.prelude.replace(/--(?:center|right)$/, "");
    const transition = styleRules(rules).find((candidate) => candidate.prelude === base && candidate.context.length === 0 && /transition:/.test(candidate.body));
    assert.ok(transition, `${base} has a transition`);
    for (const [property] of declarations(rule.body)) assert.match(transition.body, new RegExp(`\\b${property} calc\\(var\\(--sui-duration\\)`), `${base} transitions ${property}`);
  }
});
