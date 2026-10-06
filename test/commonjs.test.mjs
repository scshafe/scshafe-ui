// CommonJS consumers (docs/ADOPTING.md §4): every subpath loads through
// require() — Node's require(esm), which refuses a module graph with
// top-level await — and require.resolve finds the stylesheets. The packed,
// peer-free variant of this runs in ssr-alone-install.test.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(new URL("../package.json", import.meta.url));
const metadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("every JavaScript subpath loads with require(), as the same module import() returns", async () => {
  const subpaths = Object.keys(metadata.exports).filter((key) => !key.includes("*") && !key.endsWith(".css") && !key.endsWith(".json"));
  assert.ok(subpaths.length >= 9, subpaths.join(", "));
  for (const subpath of subpaths) {
    const specifier = subpath === "." ? metadata.name : `${metadata.name}/${subpath.slice(2)}`;
    const required = require(specifier);
    const imported = await import(specifier);
    assert.ok(Object.keys(required).length > 0, `${specifier} exports something`);
    for (const key of Object.keys(imported)) assert.equal(required[key], imported[key], `${specifier} ${key}`);
  }
  assert.equal(typeof require("@scshafe/ui/format").timestamp, "function", "the ./* pattern subpaths load too");
});

test("require.resolve finds the stylesheets", () => {
  for (const sheet of ["tokens.css", "layout.css", "components.css"]) {
    assert.match(readFileSync(require.resolve(`@scshafe/ui/${sheet}`), "utf8"), /--sui-/);
  }
});
