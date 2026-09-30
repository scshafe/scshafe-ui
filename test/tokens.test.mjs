// The token registry contract: tokens.css, the token blocks of layout.css and
// components.css, and SUI_TOKENS from "@scshafe/ui/tokens" declare the same
// values for both themes, and every custom property the package reads is
// --sui-* and registered (or a documented component-scoped variable).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SUI_COMPONENT_VARIABLES, SUI_THEMES, SUI_THEME_ATTRIBUTE, SUI_TOKENS, SUI_TOKEN_NAMES, suiTokenValue
} from "@scshafe/ui/tokens";
import { declarations, parseRules, readStylesheet, stripComments } from "./support/css.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

// The selectors each theme block uses (README "Theming and tokens").
const LIGHT = ':where(:root), :where([data-sui-theme="light"])';
const DARK_MEDIA = "@media (prefers-color-scheme: dark)";
const DARK_AUTO = ':where(:root:not([data-sui-theme="light"]))';
const DARK_PINNED = ':where([data-sui-theme="dark"])';

function tokenMap(body) {
  const map = new Map();
  for (const [property, value] of declarations(body)) {
    if (!property.startsWith("--")) continue;
    assert.ok(!map.has(property), `duplicate declaration ${property}`);
    map.set(property, value);
  }
  return map;
}

function colorScheme(body) {
  return declarations(body).find(([property]) => property === "color-scheme")?.[1];
}

/** The four token blocks of a stylesheet (top level only). */
function tokenBlocks(css) {
  const rules = parseRules(css);
  const find = (prelude) => rules.filter((rule) => rule.prelude === prelude);
  const roots = find(":root");
  assert.equal(roots.length, 1, "exactly one top-level :root block");
  const media = find(DARK_MEDIA);
  assert.ok(media.length <= 1, "at most one prefers-color-scheme block");
  const auto = media[0]?.rules.filter((rule) => rule.prelude === DARK_AUTO) ?? [];
  return { fixed: roots[0], light: find(LIGHT), auto, pinned: find(DARK_PINNED) };
}

function expected(stylesheet, theme, isThemed) {
  return new Map(SUI_TOKENS
    .filter((t) => (stylesheet === undefined || t.stylesheet === stylesheet) && t.themed === isThemed)
    .map((t) => [t.name, t[theme]]));
}

function sourceFiles(directory) {
  return readdirSync(join(repoRoot, directory), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(repoRoot.length));
}

test("SUI_TOKENS is a well-formed, duplicate-free registry with both themes", () => {
  assert.equal(new Set(SUI_TOKEN_NAMES).size, SUI_TOKENS.length);
  assert.deepEqual(SUI_TOKEN_NAMES, SUI_TOKENS.map((t) => t.name));
  assert.deepEqual([...SUI_THEMES], ["light", "dark"]);
  assert.equal(SUI_THEME_ATTRIBUTE, "data-sui-theme");
  for (const t of SUI_TOKENS) {
    assert.match(t.name, /^--sui-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(t.light.length > 0 && t.dark.length > 0 && t.description.length > 0, `${t.name} has both values and a description`);
    assert.ok(Object.isFrozen(t), `${t.name} is frozen`);
    if (!t.themed) assert.equal(t.light, t.dark, `${t.name} is theme-independent`);
    if (["color", "surface", "border", "shadow"].includes(t.category)) {
      assert.ok(t.themed, `${t.name} (a ${t.category} token) has a light and a dark value`);
      assert.ok(t.role, `${t.name} has a contrast role`);
    }
    assert.equal(suiTokenValue(t.name, "light"), t.light);
    assert.equal(suiTokenValue(t.name, "dark"), t.dark);
    for (const theme of SUI_THEMES) {
      for (const [, ref] of t[theme].matchAll(/var\((--[\w-]+)/g)) {
        const target = SUI_TOKENS.find((candidate) => candidate.name === ref);
        assert.ok(target, `${t.name} references registered ${ref}`);
        assert.ok(!t.themed || target.themed || target.light === target.dark, `${t.name} references ${ref} in a compatible block`);
      }
    }
  }
  assert.ok(Object.isFrozen(SUI_TOKENS));
});

for (const [sheet, stylesheet] of [["tokens.css", undefined], ["components.css", "components.css"], ["layout.css", "layout.css"]]) {
  test(`${sheet} declares the registry values for both themes`, () => {
    const blocks = tokenBlocks(read(sheet));
    assert.deepEqual(tokenMap(blocks.fixed.body), expected(stylesheet, "light", false), "theme-independent tokens at :root");
    const themedTokens = expected(stylesheet, "light", true);
    if (themedTokens.size === 0) {
      assert.deepEqual([blocks.light.length, blocks.auto.length, blocks.pinned.length], [0, 0, 0], "no theme blocks without themed tokens");
      return;
    }
    assert.deepEqual([blocks.light.length, blocks.auto.length, blocks.pinned.length], [1, 1, 1], "one light, one preferred-dark and one pinned-dark block");
    assert.deepEqual(tokenMap(blocks.light[0].body), expected(stylesheet, "light", true), "light theme");
    assert.deepEqual(tokenMap(blocks.auto[0].body), expected(stylesheet, "dark", true), "dark theme (prefers-color-scheme)");
    assert.deepEqual(tokenMap(blocks.pinned[0].body), expected(stylesheet, "dark", true), "dark theme (data-sui-theme)");
    assert.equal(colorScheme(blocks.light[0].body), "light");
    assert.equal(colorScheme(blocks.auto[0].body), "dark");
    assert.equal(colorScheme(blocks.pinned[0].body), "dark");
  });
}

test("component rules use tokens, not colour literals, so both themes apply", () => {
  const offenders = [];
  for (const sheet of ["layout.css", "components.css"]) {
    const rules = parseRules(readStylesheet(sheet));
    const walk = (list) => {
      for (const rule of list) {
        if (rule.rules) { walk(rule.rules); continue; }
        if ([":root", LIGHT, DARK_AUTO, DARK_PINNED].includes(rule.prelude)) continue;
        for (const [property, value] of declarations(rule.body)) {
          // A fallback inside var(--token, <literal>) is allowed (::backdrop in older engines).
          const bare = value.replace(/var\(--[\w-]+,[^()]*(\([^()]*\))?[^()]*\)/g, "var()");
          if (/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(bare)) offenders.push(`${sheet}: ${rule.prelude} { ${property}: ${value} }`);
        }
      }
    };
    walk(rules);
  }
  assert.deepEqual(offenders, []);
});

test("every custom property the package reads or sets is --sui-* and registered", () => {
  const allowed = new Set([...SUI_TOKEN_NAMES, ...SUI_COMPONENT_VARIABLES]);
  const files = ["layout.css", "components.css", "tokens.css", ...sourceFiles("src")];
  const unregistered = [];
  for (const file of files) {
    const text = file.endsWith(".css") ? stripComments(read(file)) : read(file);
    for (const [, name] of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
      if (!allowed.has(name)) unregistered.push(`${file}: var(${name})`);
    }
    for (const [, name] of text.matchAll(/["'\s{;](--[a-z][\w-]*)["']?\s*:/g)) {
      if (!name.startsWith("--sui-")) unregistered.push(`${file}: sets ${name}`);
    }
  }
  assert.deepEqual(unregistered, []);
});

test("the token registry is exported as tokens.css and a typed ./tokens subpath", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.exports["./tokens.css"], "./tokens.css");
  assert.deepEqual(pkg.exports["./tokens"], { types: "./lib/tokens.d.ts", default: "./lib/tokens.js" });
  assert.ok(pkg.files.includes("tokens.css"));
});
