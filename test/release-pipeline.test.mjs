// The install-back contract for the optional editor: scripts/release.config.mjs
// names the editor phase, the base and editor peer sets partition the peers,
// and publish.yml proves the registry install first without the editor
// peers, then with them (the scshafe-dev master's phase loop).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { phaseNames, readReleaseConfig, smokePeerSpecs } from "../scripts/release-identity.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const config = await readReleaseConfig();
const isEditorPeer = (name) => /^@tiptap\//.test(name) || name === "tiptap-markdown";

test("the editor is the one optional phase, and it claims exactly the tiptap peers", () => {
  assert.deepEqual(phaseNames(config), ["editor"]);
  const editor = smokePeerSpecs(pkg, config, "editor").map((peer) => peer.name);
  assert.deepEqual([...editor].sort(), Object.keys(pkg.peerDependencies).filter(isEditorPeer).sort());
  assert.ok(editor.every((name) => pkg.peerDependenciesMeta[name]?.optional === true));
});

test("base and editor peer sets partition the peers, each pinned exactly", () => {
  const base = smokePeerSpecs(pkg, config, "base");
  const editor = smokePeerSpecs(pkg, config, "editor");
  const baseNames = base.map((peer) => peer.name);
  const editorNames = editor.map((peer) => peer.name);
  assert.deepEqual(baseNames.filter((name) => editorNames.includes(name)), []);
  assert.deepEqual([...baseNames, ...editorNames].sort(), [...Object.keys(pkg.peerDependencies), ...config.smokeExtraPackages].sort());
  for (const peer of [...base, ...editor]) assert.equal(peer.version, pkg.devDependencies[peer.name]);
});

test("publish.yml smokes the registry install as the base phase, then adds each optional phase's peers", () => {
  const workflow = readFileSync(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");
  const order = [
    "node scripts/smoke-peers.mjs)",
    'node scripts/check-install-back.mjs "$RUNNER_TEMP/consumer"',
    "RELEASE_SMOKE_PHASE: base",
    "node scripts/smoke-peers.mjs --phases",
    'node scripts/smoke-peers.mjs --phase "$phase"',
    'RELEASE_SMOKE_PHASE="$phase" node scripts/check-pack-install.mjs',
    "Create the GitHub Release with digests"
  ].map((marker) => workflow.indexOf(marker));
  assert.ok(order.every((index) => index > 0), "every step is present");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "in this order");
});

test("the package's smokes are where the master check runs them", () => {
  for (const file of ["exports.smoke.mjs", "render.smoke.mjs", "no-editor.smoke.mjs", "package.smoke.ts", "editor/editor.smoke.mjs", "editor/editor.smoke.ts"]) {
    assert.ok(readFileSync(new URL(`./smoke/${file}`, import.meta.url), "utf8").length > 0, file);
  }
});
