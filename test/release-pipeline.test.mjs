// The install-back contract for the optional editor: the base peer set and
// the editor peer set partition the peers, and publish.yml proves the
// registry install first without the editor peers, then with them.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { SMOKE_EXTRA_PACKAGES, smokePeerSpecs } from "../scripts/release-identity.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("base and editor peer sets partition the peers, each pinned exactly", () => {
  const base = smokePeerSpecs(pkg).map((peer) => peer.name);
  const editor = smokePeerSpecs(pkg, { editor: true }).map((peer) => peer.name);
  assert.deepEqual(base.filter((name) => editor.includes(name)), []);
  assert.deepEqual([...base, ...editor].sort(), [...Object.keys(pkg.peerDependencies), ...SMOKE_EXTRA_PACKAGES].sort());
  assert.ok(editor.every((name) => pkg.peerDependenciesMeta[name]?.optional === true));
});

test("publish.yml smokes the registry install without, then with, the editor peers", () => {
  const workflow = readFileSync(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");
  const order = ["node scripts/smoke-peers.mjs)", "SUI_SMOKE_PHASE: base", "node scripts/smoke-peers.mjs --editor", "SUI_SMOKE_PHASE: editor"].map((marker) => workflow.indexOf(marker));
  assert.ok(order.every((index) => index > 0), "every step is present");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "in this order");
});
