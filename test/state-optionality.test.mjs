// S1 pin — THE OPTIONALITY CONTRACT. Consumers of the components alone must stay
// exactly as light as before the state layer existed: bundling the root "mc-ui"
// export must reference NO Redux machinery, while the "mc-ui/state" subpath must
// (positive control — proves the probe would catch a leak). Also pins the
// package.json wiring that keeps npm from auto-installing the optional peers.
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { build as buildWithEsbuild } from "esbuild";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

async function bundleEntry(source) {
  const tmp = mkdtempSync(join(repoRoot, "test", ".state-optionality-"));
  try {
    const entryPath = join(tmp, "entry.mjs");
    const outPath = join(tmp, "entry.bundle.mjs");
    writeFileSync(entryPath, source);
    await buildWithEsbuild({
      entryPoints: [entryPath],
      bundle: true,
      platform: "neutral",
      format: "esm",
      outfile: outPath,
      external: [
        "react", "react-dom", "react/jsx-runtime",
        "@reduxjs/toolkit", "react-redux",
        "@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-link",
        "@tiptap/extension-placeholder", "@tiptap/core", "@tiptap/pm", "tiptap-markdown",
      ],
      logLevel: "silent",
    });
    return readFileSync(outPath, "utf8");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

test("the root export pulls zero Redux machinery", async () => {
  const bundle = await bundleEntry(`export * from ${JSON.stringify(join(repoRoot, "lib", "index.js"))};`);
  assert.doesNotMatch(bundle, /@reduxjs\/toolkit/, "root bundle must not import @reduxjs/toolkit");
  assert.doesNotMatch(bundle, /react-redux/, "root bundle must not import react-redux");
});

test("the state subpath imports Redux machinery (positive control for the probe)", async () => {
  const bundle = await bundleEntry(`export * from ${JSON.stringify(join(repoRoot, "lib", "state", "index.js"))};`);
  assert.match(bundle, /@reduxjs\/toolkit/);
  assert.match(bundle, /react-redux/);
});

test("package.json keeps the peers optional and the subpath exported", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.peerDependenciesMeta?.["@reduxjs/toolkit"]?.optional, true, "RTK must be an OPTIONAL peer (npm ≥7 auto-installs peers otherwise)");
  assert.equal(pkg.peerDependenciesMeta?.["react-redux"]?.optional, true);
  assert.equal(pkg.peerDependenciesMeta?.react, undefined, "react stays a REQUIRED peer");
  assert.deepEqual(pkg.exports["./state"], { types: "./lib/state/index.d.ts", default: "./lib/state/index.js" });
  // The root barrel must never re-export the state module.
  const rootBarrel = readFileSync(new URL("../lib/index.js", import.meta.url), "utf8");
  assert.doesNotMatch(rootBarrel, /state\/index/);
});
