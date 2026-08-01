// S4 pin — mc-ui/build, mc-ui/testing, and create-mc-app, exercised for real:
// buildWebApp bundles a scratch entry (preflight skipped — this repo IS mc-ui);
// the testing harness bundles + renders in a child process and returns markup;
// the scaffold produces a complete app skeleton with placeholders resolved.
import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { buildWebApp, assertMcUiResolvable } = await import("../lib/build.js");
const { bundleEntry, runNodeChild, createSpaRenderHarness } = await import("../lib/testing.js");

test("buildWebApp bundles an entry with the provenance banner; preflight fails loud", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "mc-build-"));
  try {
    const entry = join(tmp, "main.js");
    writeFileSync(entry, `document.title = "built";`);
    const outfile = join(tmp, "dist", "app.js");
    await buildWebApp({ entry, outfile, skipPreflight: true });
    const bundle = readFileSync(outfile, "utf8");
    assert.match(bundle, /Built by mc-ui\/build/);
    assert.match(bundle, /document\.title = "built"/);
    assert.throws(() => assertMcUiResolvable(tmp), /did not resolve/, "preflight names the private-repo fix");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("bundleEntry + runNodeChild round-trip through a child process", async () => {
  const { bundlePath, cleanup } = await bundleEntry({
    appRoot: repoRoot,
    source: `export function double(n) { return n * 2; }`,
  });
  try {
    const runner = join(bundlePath, "..", "runner.mjs");
    writeFileSync(runner, `
import { double } from "./entry.bundle.mjs";
let data = "";
for await (const chunk of process.stdin) data += chunk;
process.stdout.write(JSON.stringify({ result: double(JSON.parse(data)) }), () => process.exit(0));
`);
    const output = await runNodeChild({ scriptPath: runner, input: 21 });
    assert.equal(output.result, 42);
  } finally {
    cleanup();
  }
});

test("createSpaRenderHarness renders a store-backed app from preloaded state", async () => {
  // Fixture app over the COMPILED state layer (plain react-redux Provider —
  // "mc-ui" itself is not resolvable from inside this repo's node_modules).
  const fixtureDir = mkdtempSync(join(repoRoot, ".toolchain-fixture-"));
  const storeModule = join(fixtureDir, "store.js");
  const appModule = join(fixtureDir, "app.js");
  writeFileSync(storeModule, `
import { createMcStore, Toasts } from ${JSON.stringify(join(repoRoot, "lib", "state", "index.js"))};
export function createFixtureStore({ preloadedState } = {}) {
  return createMcStore({ slices: [Toasts], preloadedState });
}
`);
  writeFileSync(appModule, `
import React from "react";
import { useSelector } from "react-redux";
import { selectToasts } from ${JSON.stringify(join(repoRoot, "lib", "state", "index.js"))};
export function FixtureApp() {
  const toasts = useSelector(selectToasts);
  return React.createElement("main", { "data-toast-count": toasts.length }, toasts.map((t) => t.message).join("|"));
}
`);
  const harness = await createSpaRenderHarness({
    appRoot: repoRoot,
    storeModule,
    storeExport: "createFixtureStore",
    appModule,
    appExport: "FixtureApp",
    mcProviders: false,
  });
  try {
    const html = await harness.renderApp({ Toasts: { items: [{ id: "a", kind: "success", message: "hello" }, { id: "b", kind: "info", message: "world" }] } });
    assert.match(html, /data-toast-count="2"/);
    assert.match(html, /hello\|world/);
  } finally {
    harness.cleanup();
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("create-mc-app scaffolds a complete skeleton with placeholders resolved", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mc-scaffold-"));
  try {
    const output = execFileSync(process.execPath, [join(repoRoot, "bin", "create-mc-app.mjs"), "demo-app", "--pin", "abc123", "--name", "Demo App"], { cwd: tmp, encoding: "utf8" });
    assert.match(output, /Scaffolded Demo App/);
    for (const file of ["package.json", "tsconfig.json", ".gitignore", "scripts/build-web.mjs", "src/main.jsx", "src/AppComponent.jsx", "src/theme.css", "src/state/StoreManager.js", "src/state/ExampleManager.js"]) {
      assert.ok(existsSync(join(tmp, "demo-app", file)), `scaffold missing ${file}`);
    }
    const pkg = JSON.parse(readFileSync(join(tmp, "demo-app", "package.json"), "utf8"));
    assert.equal(pkg.name, "Demo App");
    assert.equal(pkg.dependencies["mc-ui"], "git+ssh://git@github.com/scshafe/mc-ui.git#abc123");
    const main = readFileSync(join(tmp, "demo-app", "src", "main.jsx"), "utf8");
    assert.doesNotMatch(main, /__APP_NAME__/);
    assert.match(main, /McProviders/);
    // refuses to overwrite
    assert.throws(() => execFileSync(process.execPath, [join(repoRoot, "bin", "create-mc-app.mjs"), "demo-app"], { cwd: tmp, encoding: "utf8" }));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
