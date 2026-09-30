// The editor subpath: MarkdownEditor lives in "@scshafe/ui/editor", tiptap is
// an OPTIONAL peer, and nothing else in the package loads it. Proven three
// ways: a bundle probe (esbuild fails any tiptap import it meets), a Node
// process in which tiptap cannot be resolved (as in an app that never
// installed it), and a render of the editor itself.
import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const TIPTAP = /^(@tiptap\/|tiptap-markdown$)/;
const EDITOR_PEERS = Object.keys(pkg.peerDependencies).filter((name) => TIPTAP.test(name));
const WITHOUT_EDITOR = ["@scshafe/ui", "@scshafe/ui/state", "@scshafe/ui/icons", "@scshafe/ui/identity", "@scshafe/ui/tokens", "@scshafe/ui/format", "@scshafe/ui/build", "@scshafe/ui/testing"];

async function tiptapImports(specifier) {
  const seen = [];
  await build({
    stdin: { contents: `export * from ${JSON.stringify(specifier)};`, resolveDir: repoRoot },
    bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent",
    external: ["react", "react-dom", "react/*", "react-dom/*", "@reduxjs/toolkit", "react-redux", "iconoir-react", "esbuild"],
    plugins: [{
      name: "no-tiptap",
      setup(context) {
        context.onResolve({ filter: /^(@tiptap\/|tiptap-markdown)/ }, (args) => {
          seen.push(args.path);
          return { path: args.path, external: true };
        });
      }
    }]
  });
  return seen;
}

test("package.json: tiptap is an optional peer, the editor a subpath, no runtime dependencies", () => {
  assert.equal(pkg.dependencies, undefined, "no hard dependencies at all");
  assert.deepEqual(EDITOR_PEERS.sort(), ["@tiptap/core", "@tiptap/extension-link", "@tiptap/extension-placeholder", "@tiptap/pm", "@tiptap/react", "@tiptap/starter-kit", "tiptap-markdown"]);
  for (const name of EDITOR_PEERS) {
    assert.equal(pkg.peerDependenciesMeta?.[name]?.optional, true, `${name} is optional`);
    assert.match(pkg.devDependencies[name], /^\d+\.\d+\.\d+$/, `${name} is pinned for the checks`);
  }
  assert.deepEqual(pkg.exports["./editor"], { types: "./lib/editor/index.d.ts", default: "./lib/editor/index.js" });
});

test("no subpath but ./editor imports tiptap (bundle probe)", async () => {
  for (const specifier of WITHOUT_EDITOR) {
    assert.deepEqual(await tiptapImports(specifier), [], `${specifier} reaches no tiptap module`);
  }
  const editor = await tiptapImports("@scshafe/ui/editor");
  assert.ok(editor.includes("@tiptap/react") && editor.includes("tiptap-markdown"), "positive control: the editor subpath does");
});

test("the root and every other subpath import in a process where tiptap is not installed", () => {
  const hooks = `data:text/javascript,${encodeURIComponent(`
    export async function resolve(specifier, context, next) {
      if (/^(@tiptap\\/|tiptap-markdown$)/.test(specifier)) {
        const error = new Error("Cannot find package '" + specifier + "' (not installed)");
        error.code = "ERR_MODULE_NOT_FOUND";
        throw error;
      }
      return next(specifier, context);
    }`)}`;
  const script = `
    import { register } from "node:module";
    register(${JSON.stringify(hooks)});
    const loaded = [];
    for (const specifier of ${JSON.stringify(WITHOUT_EDITOR)}) {
      const namespace = await import(specifier);
      loaded.push(specifier + ":" + Object.keys(namespace).length);
    }
    let editorError = null;
    try { await import("@scshafe/ui/editor"); } catch (error) { editorError = error.code; }
    const root = await import("@scshafe/ui");
    console.log(JSON.stringify({ loaded, editorError, rootHasEditor: "MarkdownEditor" in root }));
  `;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(child.status, 0, child.stderr);
  const result = JSON.parse(child.stdout.trim().split("\n").pop());
  assert.equal(result.loaded.length, WITHOUT_EDITOR.length);
  assert.equal(result.editorError, "ERR_MODULE_NOT_FOUND", "the editor subpath needs tiptap (positive control)");
  assert.equal(result.rootHasEditor, false, "MarkdownEditor left the root export");
});

test("MarkdownEditor renders on the server and in the browser, keyboard-focusable", async () => {
  const React = await import("react");
  const { renderToString } = await import("react-dom/server");
  const { MarkdownEditor } = await import("@scshafe/ui/editor");
  const html = renderToString(React.createElement(MarkdownEditor, { ariaLabel: "Message", initialValue: "**hi**" }));
  assert.match(html, /class="sui-markdown-editor"[^>]*data-sui-component="MarkdownEditor"/, "SSR renders the shell without tiptap's DOM");

  const { installDom, render } = await import("./support/dom.mjs");
  installDom();
  const { act } = React;
  const view = await render(React.createElement(MarkdownEditor, { ariaLabel: "Message", initialValue: "**hi**", placeholder: "Write…" }));
  try {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    const content = view.container.querySelector(".sui-markdown-editor-content");
    assert.ok(content, "the editor mounts its content element");
    assert.equal(content.getAttribute("contenteditable"), "true");
    assert.equal(content.getAttribute("aria-label"), "Message");
    assert.match(content.innerHTML, /<strong>hi<\/strong>/, "markdown is parsed");
    const { default: axe } = await import("axe-core");
    const audit = await axe.run(view.container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
    });
    assert.deepEqual(audit.violations.map((violation) => violation.id), [], "axe finds no violations in the mounted editor");
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    content.focus();
    document.documentElement.setAttribute("data-style-generation", "editor");
    assert.equal(document.activeElement, content);
    assert.match(getComputedStyle(content).getPropertyValue("outline"), /2px solid/, "the focus ring shows");
  } finally {
    document.activeElement?.blur();
    await view.unmount();
  }
});
