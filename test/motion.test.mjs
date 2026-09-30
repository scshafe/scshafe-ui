// Reduced motion (WCAG 2.3.3): every transition in the stylesheets runs for
// var(--sui-duration), which prefers-reduced-motion: reduce sets to 0s; there
// are no animations and no JavaScript-driven motion.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SUI_REDUCED_MOTION_DURATION, SUI_TOKENS } from "@scshafe/ui/tokens";
import { declarations, parseRules, readStylesheet, styleRules } from "./support/css.mjs";

const SHEETS = ["layout.css", "components.css", "tokens.css"];

test("every transition uses --sui-duration and nothing animates", () => {
  const offenders = [];
  let transitions = 0;
  for (const sheet of SHEETS) {
    for (const rule of styleRules(parseRules(readStylesheet(sheet)))) {
      for (const [property, value] of declarations(rule.body)) {
        if (/^(animation|transition)(-duration|-delay)?$/.test(property) === false && !property.startsWith("animation")) continue;
        if (property.startsWith("animation")) { offenders.push(`${sheet}: ${rule.prelude} { ${property} }`); continue; }
        transitions += 1;
        const literal = value.replace(/var\(--sui-duration\)/g, "").match(/\b\d*\.?\d+m?s\b/);
        if (literal || !value.includes("var(--sui-duration)")) offenders.push(`${sheet}: ${rule.prelude} { ${property}: ${value} }`);
      }
    }
    assert.doesNotMatch(readStylesheet(sheet), /@keyframes/, `${sheet} declares no keyframes`);
  }
  assert.ok(transitions >= 8, "the transitions are found");
  assert.deepEqual(offenders, []);
});

test("prefers-reduced-motion: reduce sets --sui-duration to 0s", () => {
  const media = parseRules(readStylesheet("components.css")).filter((rule) => rule.prelude === "@media (prefers-reduced-motion: reduce)");
  assert.equal(media.length, 1);
  const root = media[0].rules.find((rule) => rule.prelude === ":root");
  assert.deepEqual(declarations(root.body), [["--sui-duration", SUI_REDUCED_MOTION_DURATION]]);
  assert.equal(SUI_REDUCED_MOTION_DURATION, "0s");
  assert.equal(SUI_TOKENS.find((t) => t.name === "--sui-duration").category, "motion");
});

test("no JavaScript-driven motion in the components", () => {
  const src = fileURLToPath(new URL("../src", import.meta.url));
  for (const entry of readdirSync(src, { recursive: true, withFileTypes: true }).filter((e) => e.isFile())) {
    const text = readFileSync(join(entry.parentPath, entry.name), "utf8");
    assert.doesNotMatch(text, /behavior:\s*["']smooth["']|\.animate\(|requestAnimationFrame/, entry.name);
  }
});
