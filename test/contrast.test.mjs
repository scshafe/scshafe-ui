// WCAG 2.2 AA contrast of the token pairs, computed from the registry in both
// themes (docs/ACCESSIBILITY.md): text tokens reach 4.5:1 (1.4.3) and control
// indicators 3:1 (1.4.11) against every surface they can sit on — each surface
// composited over the page and panel backgrounds, and each overlay tint the
// stylesheets lay over those surfaces.
import assert from "node:assert/strict";
import test from "node:test";
import { SUI_THEMES, SUI_TOKENS } from "@scshafe/ui/tokens";
import { declarations, parseRules, readStylesheet, styleRules } from "./support/css.mjs";
import { color, colorMix, composite, contrastRatio, luminance, withAlpha } from "./support/contrast.mjs";

const TEXT_MIN = 4.5;
const UI_MIN = 3;
const byRole = (role) => SUI_TOKENS.filter((token) => token.role === role).map((token) => token.name);
const TONES = ["green", "blue", "yellow", "orange", "red", "purple"];
// The strongest accent tint a component paints under text (the primary button's
// hover and the active tab); components.css stays at or below it.
const ACCENT_TINT = 0.2;
// The strongest tone tint under tone text (badge, chip, card tone, toast).
const TONE_TINT = 0.12;

function backgrounds(theme) {
  const bases = ["--sui-bg", "--sui-panel"].map((name) => ({ label: name, value: color(name, theme) }));
  const surfaces = byRole("surface").flatMap((name) => {
    const value = color(name, theme);
    return value.a === 1 ? [{ label: name, value }] : bases.map((base) => ({ label: `${name} over ${base.label}`, value: composite(value, base.value) }));
  });
  const overlays = [
    ...byRole("overlay").map((name) => ({ label: name, value: color(name, theme) })),
    { label: `--sui-accent at ${ACCENT_TINT * 100}%`, value: withAlpha(color("--sui-accent", theme), ACCENT_TINT), accent: true },
    // Body text also sits on tone-tinted cards and toasts.
    ...TONES.map((tone) => ({ label: `--sui-tone-${tone} at ${TONE_TINT * 100}%`, value: withAlpha(color(`--sui-tone-${tone}`, theme), TONE_TINT), accent: true }))
  ];
  const tinted = overlays.flatMap((overlay) => surfaces.map((surface) => ({ label: `${overlay.label} on ${surface.label}`, value: composite(overlay.value, surface.value), accent: overlay.accent })));
  return { surfaces, all: [...surfaces, ...tinted], neutral: [...surfaces, ...tinted.filter((ground) => !ground.accent)] };
}

function check(foregrounds, grounds, minimum, theme) {
  const failures = [];
  let lowest = Infinity;
  for (const name of foregrounds) {
    const foreground = color(name, theme);
    assert.equal(foreground.a, 1, `${name} is opaque in ${theme}`);
    for (const ground of grounds(name)) {
      const ratio = contrastRatio(foreground, ground.value);
      lowest = Math.min(lowest, ratio);
      if (ratio < minimum) failures.push(`${theme}: ${name} on ${ground.label} = ${ratio.toFixed(2)}:1`);
    }
  }
  return { failures, lowest };
}

for (const theme of SUI_THEMES) {
  test(`${theme} theme: every text token reaches ${TEXT_MIN}:1 on every surface and tint`, () => {
    const { surfaces, all } = backgrounds(theme);
    const toneText = new Set(TONES.map((tone) => `--sui-tone-${tone}-text`));
    const plain = byRole("text").filter((name) => !toneText.has(name));
    const general = check(plain, () => all, TEXT_MIN, theme);
    const tones = check([...toneText], (name) => {
      const base = color(name.replace(/-text$/, ""), theme);
      const tint = surfaces.map((surface) => ({ label: `${name.replace(/-text$/, "")} at ${TONE_TINT * 100}% on ${surface.label}`, value: composite(withAlpha(base, TONE_TINT), surface.value) }));
      const neutral = surfaces.map((surface) => ({ label: `--sui-tint on ${surface.label}`, value: composite(color("--sui-tint", theme), surface.value) }));
      return [...surfaces, ...tint, ...neutral];
    }, TEXT_MIN, theme);
    assert.ok(plain.length >= 6 && toneText.size === 6);
    assert.deepEqual([...general.failures, ...tones.failures], []);
  });

  test(`${theme} theme: control boundaries and the focus ring reach ${UI_MIN}:1`, () => {
    // A control boundary or focus ring sits on a surface or a neutral tint, never on an accent fill.
    const { neutral } = backgrounds(theme);
    const indicators = byRole("indicator");
    assert.deepEqual(indicators.sort(), ["--sui-field-border", "--sui-focus-ring"]);
    assert.deepEqual(check(indicators, () => neutral, UI_MIN, theme).failures, []);
  });

  test(`${theme} theme: body text on glass reaches ${TEXT_MIN}:1 over any backdrop`, () => {
    // Glass floats over whatever the page shows (photos, other content), not only
    // the package surfaces checked above. Compositing is linear in the backdrop, so
    // black and white bound every backdrop: when both extremes reach the minimum
    // on the same side of the text's luminance, everything between them does too.
    // Blur only averages the backdrop, so this holds without it.
    const black = { r: 0, g: 0, b: 0, a: 1 };
    const white = { r: 255, g: 255, b: 255, a: 1 };
    const failures = [];
    for (const glass of ["--sui-glass", "--sui-glass-thick"]) {
      const fill = color(glass, theme);
      assert.ok(fill.a < 1, `${glass} is translucent in ${theme}`);
      for (const text of ["--sui-text", "--sui-text-strong"]) {
        const foreground = color(text, theme);
        const extremes = [black, white].map((backdrop) => composite(fill, backdrop));
        const sides = new Set(extremes.map((ground) => Math.sign(luminance(ground) - luminance(foreground))));
        if (sides.size !== 1) failures.push(`${theme}: some backdrop matches ${text} through ${glass}`);
        for (const [index, ground] of extremes.entries()) {
          const ratio = contrastRatio(foreground, ground);
          if (ratio < TEXT_MIN) failures.push(`${theme}: ${text} on ${glass} over ${index ? "white" : "black"} = ${ratio.toFixed(2)}:1`);
        }
      }
    }
    assert.deepEqual(failures, []);
  });
}

// Text on glass, as components.css paints it: the glass fill (tinted with color-mix, and over
// the thick strip a tab sits in), the sheen at the height of the text (a gradient across the
// element puts the glyphs of centred text between 30% and 70% of its alpha; a popover's 48px
// gradient runs out over its items, a rail's 160px one is nearly full at its header), the overlays under the text, then
// the text. Black and white bound every backdrop, as in the test above; a modal layer sees
// them through its --sui-backdrop scrim.
const GLASS_TEXT = [
  { label: "button", selector: ".sui-button", glass: "--sui-glass", text: "--sui-text" },
  { label: "button, hovered", glass: "--sui-glass", tint: ["--sui-accent", 0.08], text: "--sui-text" },
  { label: "primary button", selector: ".sui-button-primary", glass: "--sui-glass", tint: ["--sui-accent", 0.14], text: "--sui-text-strong" },
  { label: "primary button, hovered", glass: "--sui-glass", tint: ["--sui-accent", 0.2], text: "--sui-text-strong" },
  { label: "pressed button", selector: '.sui-button-active, .sui-button[aria-pressed="true"]', glass: "--sui-glass", overlays: [["--sui-accent", 0.2], ["--sui-tone-purple", 0.12]], text: "--sui-text" },
  { label: "danger button", selector: ".sui-button-danger", glass: "--sui-glass", tint: ["--sui-tone-red", 0.12], text: "--sui-glass-danger-text" },
  { label: "selected tab", selector: ".sui-tab-active", glass: "--sui-glass", tint: ["--sui-accent", 0.14], text: "--sui-glass-accent-text" },
  { label: "selected tab button", selector: ".sui-button-tab.sui-button-active", glass: "--sui-glass", tint: ["--sui-accent", 0.14], text: "--sui-glass-accent-text" },
  { label: "selected tab in a strip", selector: '.sui-focus-tab[aria-selected="true"]', under: "--sui-glass-thick", glass: "--sui-glass", tint: ["--sui-accent", 0.14], text: "--sui-glass-accent-text" },
  { label: "tab in a strip", selector: ".sui-focus-tab", glass: "--sui-glass-thick", text: "--sui-glass-muted" },
  { label: "link tab in a strip", selector: ".sui-tab", glass: "--sui-glass-thick", text: "--sui-glass-muted" },
  { label: "tab badge in a strip", selector: ".sui-tab-badge", glass: "--sui-glass-thick", overlays: [["--sui-accent", 0.16]], text: "--sui-text-strong" },
  { label: "tab badge on the selected tab", under: "--sui-glass-thick", glass: "--sui-glass", tint: ["--sui-accent", 0.14], overlays: [["--sui-accent", 0.16]], text: "--sui-text-strong" },
  { label: "tab count in a strip", selector: ".sui-focus-tab-count", glass: "--sui-glass-thick", overlays: [["--sui-tint"]], text: "--sui-glass-muted" },
  { label: "tab count on the selected tab", under: "--sui-glass-thick", glass: "--sui-glass", tint: ["--sui-accent", 0.14], overlays: [["--sui-tint"]], text: "--sui-glass-muted" },
  { label: "toast", selector: ".sui-toast", glass: "--sui-glass", text: "--sui-text" },
  { label: "success toast", glass: "--sui-glass", tint: ["--sui-ok", 0.12], text: "--sui-text" },
  { label: "info toast", glass: "--sui-glass", tint: ["--sui-accent", 0.12], text: "--sui-text" },
  { label: "error toast", selector: ".sui-toast--error", glass: "--sui-glass", tint: ["--sui-tone-red", 0.12], text: "--sui-glass-danger-text" },
  { label: "popover", selector: ".sui-popover", glass: "--sui-glass", sheen: [0, 0.6], text: "--sui-text" },
  { label: "menu item, hovered", selector: ".sui-context-menu-item:hover, .sui-context-menu-item:focus-visible", glass: "--sui-glass", sheen: [0, 0.6], overlays: [["--sui-accent-subtle"]], text: "--sui-text-strong" },
  { label: "destructive menu item", selector: ".sui-context-menu-item--danger", glass: "--sui-glass", sheen: [0, 0.6], text: "--sui-glass-danger-text" },
  { label: "destructive menu item, hovered", selector: ".sui-context-menu-item--danger:hover, .sui-context-menu-item--danger:focus-visible", glass: "--sui-glass", sheen: [0, 0.6], overlays: [["--sui-tone-red", 0.12]], text: "--sui-glass-danger-text" },
  { label: "menu shortcut", selector: ".sui-context-menu-item-kbd", glass: "--sui-glass", sheen: [0, 0.6], text: "--sui-glass-muted" },
  { label: "hover card note", selector: ".sui-hover-card-content small", glass: "--sui-glass", sheen: [0, 0.6], text: "--sui-glass-muted" },
  { label: "show full", selector: ".sui-card-show-full", glass: "--sui-glass", text: "--sui-glass-accent-text" },
  { label: "show full, hovered", selector: ".sui-card-show-full:hover", glass: "--sui-glass", tint: ["--sui-accent", 0.08], text: "--sui-accent-hover" },
  { label: "rail toggle", selector: ".sui-collapsible-list-rail-toggle", glass: "--sui-glass", text: "--sui-glass-muted" },
  { label: "rail title", selector: ".sui-collapsible-list-rail-title", glass: "--sui-glass-thick", sheen: [0.8, 1], overlays: [["--sui-tint"]], text: "--sui-glass-muted" },
  { label: "sheet", selector: ".sui-sheet", modal: true, glass: "--sui-glass-thick", sheen: [0, 1], text: "--sui-text" },
  { label: "sheet description", selector: ".sui-sheet__description", modal: true, glass: "--sui-glass-thick", sheen: [0, 1], text: "--sui-glass-muted" },
  { label: "card detail", selector: ".sui-card-detail-popover", modal: true, glass: "--sui-glass-thick", sheen: [0, 1], text: "--sui-text" }
];
// Dark glass (0.72) over a light backdrop is a mid grey, on which accent, danger and secondary
// text, and body text on tinted glass, stay under 4.5:1 (the tinted toasts only just: 4.4:1 here,
// 4.8:1 rendered). Recorded here until the dark glass is settled (docs/ACCESSIBILITY.md); the
// test fails on a new gap and when a recorded one is fixed.
const DARK_GLASS_GAPS = [
  "primary button, hovered", "pressed button", "danger button", "selected tab", "selected tab button",
  "selected tab in a strip", "tab count in a strip", "success toast", "info toast", "tab count on the selected tab", "error toast", "destructive menu item", "destructive menu item, hovered",
  "menu shortcut", "hover card note", "show full", "show full, hovered", "rail toggle", "rail title"
];

function glassTextFailures(theme) {
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  const sheen = color("--sui-glass-sheen", theme);
  const layer = (ground, glass, tint, at) => {
    const fill = tint ? colorMix(color(tint[0], theme), tint[1], color(glass, theme)) : color(glass, theme);
    return composite(withAlpha(sheen, at), composite(fill, ground));
  };
  const failures = new Map();
  for (const entry of GLASS_TEXT) {
    const foreground = color(entry.text, theme);
    for (const [name, page] of [["black", black], ["white", white]]) {
      const backdrop = entry.modal ? composite(color("--sui-backdrop", theme), page) : page;
      for (const at of new Set(entry.sheen ?? [0.3, 0.7])) {
        let ground = entry.under ? layer(backdrop, entry.under, null, 0.5) : backdrop;
        ground = layer(ground, entry.glass, entry.tint, at);
        for (const [overlay, alpha = 1] of entry.overlays ?? []) ground = composite(withAlpha(color(overlay, theme), alpha), ground);
        const ratio = contrastRatio(foreground, ground);
        if (ratio < TEXT_MIN) failures.set(entry.label, `${theme}: ${entry.label} (${entry.text}) over ${name}, sheen ${at} = ${ratio.toFixed(2)}:1`);
      }
    }
  }
  return failures;
}

test(`light theme: text on every glass surface reaches ${TEXT_MIN}:1 over any backdrop`, () => {
  assert.deepEqual([...glassTextFailures("light").values()], []);
});

test("dark theme: text on glass over any backdrop has only the recorded gaps", () => {
  const failures = glassTextFailures("dark");
  assert.deepEqual([...failures.keys()].filter((label) => !DARK_GLASS_GAPS.includes(label)), [], "a new gap");
  assert.deepEqual(DARK_GLASS_GAPS.filter((label) => !failures.has(label)), [], "a recorded gap is fixed: remove it from DARK_GLASS_GAPS");
});

test("the glass text table matches the colours components.css gives those selectors", () => {
  const rules = styleRules(parseRules(readStylesheet("components.css"))).filter((rule) => rule.context.length === 0);
  const mismatches = [];
  for (const entry of GLASS_TEXT.filter((candidate) => candidate.selector)) {
    const colours = rules.filter((rule) => rule.prelude === entry.selector)
      .flatMap((rule) => declarations(rule.body).filter(([property]) => property === "color").map(([, value]) => value));
    if (colours.at(-1) !== `var(${entry.text})`) mismatches.push(`${entry.selector}: ${colours.at(-1)} (table: ${entry.text})`);
  }
  assert.deepEqual(mismatches, []);
});

test("the contrast math matches WCAG reference values", () => {
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  assert.equal(contrastRatio(black, white).toFixed(2), "21.00");
  assert.equal(contrastRatio(white, white).toFixed(2), "1.00");
  // #767676 on white is the classic 4.54:1 grey.
  assert.equal(contrastRatio({ r: 0x76, g: 0x76, b: 0x76, a: 1 }, white).toFixed(2), "4.54");
});

test("components.css keeps the tints under text within the checked maximum", () => {
  const offenders = [];
  for (const rule of styleRules(parseRules(readStylesheet("components.css")))) {
    if (/::(?:before|after)/.test(rule.prelude)) continue; // decorative lines, no text
    for (const [property, value] of declarations(rule.body)) {
      if (!property.startsWith("background")) continue;
      for (const [, token, percent] of value.matchAll(/var\((--sui-[\w-]+)\)\s+([\d.]+)%/g)) {
        const limit = token === "--sui-accent" ? ACCENT_TINT : /^--sui-(tone-|ok$)/.test(token) ? TONE_TINT : undefined;
        if (limit !== undefined && Number(percent) > limit * 100) offenders.push(`${rule.prelude}: ${token} ${percent}%`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});
