// The token registry contract: tokens.css, the :root blocks of layout.css and
// components.css, and SUI_TOKENS from "@scshafe/ui/tokens" declare the same
// defaults, and every custom property the package reads is --sui-* and
// registered (or a documented component-scoped variable).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SUI_COMPONENT_VARIABLES, SUI_TOKENS, SUI_TOKEN_NAMES } from "@scshafe/ui/tokens";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function rootDeclarations(css) {
  const blocks = [...stripComments(css).matchAll(/:root\s*\{([^}]*)\}/g)];
  assert.equal(blocks.length, 1, "exactly one :root block");
  const declarations = new Map();
  for (const line of blocks[0][1].split(";")) {
    const match = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(line);
    if (!match) continue;
    assert.ok(!declarations.has(match[1]), `duplicate declaration ${match[1]}`);
    declarations.set(match[1], match[2]);
  }
  return declarations;
}

function registryFor(stylesheet) {
  return new Map(SUI_TOKENS.filter((t) => stylesheet === undefined || t.stylesheet === stylesheet).map((t) => [t.name, t.default]));
}

function sourceFiles(directory) {
  return readdirSync(join(repoRoot, directory), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(repoRoot.length));
}

test("SUI_TOKENS is a well-formed, duplicate-free registry", () => {
  assert.equal(new Set(SUI_TOKEN_NAMES).size, SUI_TOKENS.length);
  assert.deepEqual(SUI_TOKEN_NAMES, SUI_TOKENS.map((t) => t.name));
  for (const t of SUI_TOKENS) {
    assert.match(t.name, /^--sui-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(t.default.length > 0 && t.description.length > 0, `${t.name} has a default and a description`);
    assert.ok(Object.isFrozen(t), `${t.name} is frozen`);
    for (const [, ref] of t.default.matchAll(/var\((--[\w-]+)/g)) {
      assert.ok(SUI_TOKEN_NAMES.includes(ref), `${t.name} references registered ${ref}`);
    }
  }
  assert.ok(Object.isFrozen(SUI_TOKENS));
});

test("tokens.css declares exactly the registry defaults", () => {
  assert.deepEqual(rootDeclarations(read("tokens.css")), registryFor());
});

test("layout.css and components.css declare their registry subsets at :root", () => {
  assert.deepEqual(rootDeclarations(read("layout.css")), registryFor("layout.css"));
  assert.deepEqual(rootDeclarations(read("components.css")), registryFor("components.css"));
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
