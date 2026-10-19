// WCAG 2.2 AA contrast of the token pairs, computed from the registry in both
// themes (docs/ACCESSIBILITY.md): text tokens reach 4.5:1 (1.4.3) and control
// indicators 3:1 (1.4.11) against every surface they can sit on — each surface
// composited over the page and panel backgrounds, and each overlay tint the
// stylesheets lay over those surfaces.
import assert from "node:assert/strict";
import test from "node:test";
import { SUI_THEMES, SUI_TOKENS } from "@scshafe/ui/tokens";
import { declarations, parseRules, readStylesheet, styleRules } from "./support/css.mjs";
import { color, composite, contrastRatio, luminance, withAlpha } from "./support/contrast.mjs";

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
