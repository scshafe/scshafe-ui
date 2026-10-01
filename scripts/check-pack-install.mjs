// Pack the package, install it into an empty consumer next to its peers at the
// exact versions this tree is verified against (scripts/release-identity.mjs
// smokePeerSpecs), and run smokes against the install, not the source tree:
//
//   - JS: every exported subpath resolves and carries its key exports; the
//     three stylesheets resolve and hold only --sui-* tokens and sui- classes.
//   - React: react-dom/server renders components from the installed package
//     (renderToString) and the markup carries data-sui-component markers.
//   - TypeScript: a .tsx consumer typechecks against the shipped .d.ts files.
//
// in two phases: first WITHOUT the editor's optional tiptap peers (the root
// and every other subpath must work; @scshafe/ui/editor must not resolve),
// then with them added (the editor subpath imports, renders and typechecks).
// A third phase (ssr, 0.4.0) installs the package ALONE — no peers at all — and
// proves @scshafe/ui/ssr renders and typechecks (skipLibCheck off) while react
// is not even resolvable: a server-rendered app needs no React.
//
// With SUI_SMOKE_CONSUMER set to a directory that already has the package and
// its peers installed (the publish workflow's install-back of the registry
// version), skip pack+install and run the same smokes there. Either way the
// consumer must depend directly on every peer at its pinned version: a peer
// pnpm only auto-installs is not importable from the consumer itself.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  PNPM_PACK_ARGS,
  projectRoot as root,
  readReleaseIdentity,
  singlePackReport,
  smokePeerSpecs
} from "./release-identity.mjs";

const installedConsumer = process.env.SUI_SMOKE_CONSUMER;
const scratch = installedConsumer ? undefined : await mkdtemp(join(tmpdir(), "sui-pack-"));

async function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? root,
    env: process.env,
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit"
  });
  let stdout = "";
  if (options.capture) {
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
  }
  const [code] = await once(child, "close");
  if (code !== 0) throw new Error(`${command} ${args.join(" ")} exited ${code}`);
  return stdout;
}

let packedBasename;

async function packAndInstall(peers, name = "consumer") {
  if (packedBasename === undefined) {
    packedBasename = singlePackReport(await run("pnpm", [
      ...PNPM_PACK_ARGS,
      "--pack-destination",
      scratch
    ], { capture: true })).basename;
  }

  const consumer = join(scratch, name);
  await mkdir(consumer);
  await writeFile(
    join(consumer, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`
  );
  await copyFile(resolve(root, ".npmrc"), join(consumer, ".npmrc"));
  const storeDir = await pnpmStoreDir();
  await run("pnpm", [
    "add",
    // pnpm 10 auto-installs optional peers too; the base consumer must not
    // receive the editor's tiptap peers (0.3.0's release smoke found this).
    "--config.auto-install-peers=false",
    "--ignore-scripts",
    "--prefer-offline",
    "--store-dir",
    storeDir,
    "--save-exact",
    join(scratch, packedBasename),
    ...peers.map((peer) => peer.spec)
  ], { cwd: consumer });
  return consumer;
}

async function pnpmStoreDir() {
  // The scratch consumer may sit on another filesystem (tmpdir), where pnpm
  // would pick a different, empty store; reuse the project's store.
  return (await run("pnpm", ["store", "path"], { capture: true })).trim();
}

async function addPeers(consumer, peers) {
  await run("pnpm", [
    "add", "--ignore-scripts", "--prefer-offline", "--store-dir", await pnpmStoreDir(), "--save-exact",
    ...peers.map((peer) => peer.spec)
  ], { cwd: consumer });
}

// The base phase proves the root and every other subpath work WITHOUT the
// editor's tiptap peers: none may be a dependency of, or resolvable from, the
// consumer (pnpm must not have auto-installed the optional peers).
async function assertNoEditorPeers(consumer, editorPeers) {
  const consumerJson = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
  const present = editorPeers.filter((peer) => consumerJson.dependencies?.[peer.name] !== undefined);
  if (present.length > 0) throw new Error(`base consumer must not depend on ${present.map((peer) => peer.name).join(", ")}`);
  const probe = `
    const found = [];
    for (const name of ${JSON.stringify(editorPeers.map((peer) => peer.name))}) {
      try { import.meta.resolve(name); found.push(name); } catch {}
    }
    if (found.length > 0) throw new Error("tiptap is resolvable from the base consumer: " + found.join(", "));
    let code = null;
    try { await import("@scshafe/ui/editor"); } catch (error) { code = error.code; }
    if (code !== "ERR_MODULE_NOT_FOUND") throw new Error("@scshafe/ui/editor should need tiptap here (got " + code + ")");
    console.log("No tiptap installed: the editor subpath is unavailable, as intended.");
  `;
  await writeFile(join(consumer, "no-editor-probe.mjs"), probe);
  await run(process.execPath, ["no-editor-probe.mjs"], { cwd: consumer });
}

// The ssr phase: a consumer with @scshafe/ui as its ONLY dependency (installed
// with auto-install-peers=false, so no peer arrives). react must not resolve;
// @scshafe/ui/ssr, /format and /tokens and the stylesheets must import, render
// and typecheck — with skipLibCheck off, so the shipped .d.ts may not reach
// for @types/react either.
async function assertSsrWithoutReact(consumer, name, version) {
  const consumerJson = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
  const deps = Object.keys(consumerJson.dependencies ?? {});
  if (deps.length !== 1 || deps[0] !== name) throw new Error(`the ssr consumer must depend on ${name} alone (found ${deps.join(", ")})`);
  const smoke = `
    import { readFileSync } from "node:fs";
    import { fileURLToPath } from "node:url";
    import * as ssr from "@scshafe/ui/ssr";
    import { toneByState } from "@scshafe/ui/format";
    import { SUI_TOKENS } from "@scshafe/ui/tokens";
    import metadata from "@scshafe/ui/package.json" with { type: "json" };
    const expect = (condition, message) => { if (!condition) throw new Error(message); };
    expect(metadata.name === ${JSON.stringify(name)} && metadata.version === ${JSON.stringify(version)}, "package identity mismatch");
    for (const name of ["react", "react-dom", "react/jsx-runtime", "@types/react"]) {
      let found = true;
      try { import.meta.resolve(name); } catch { found = false; }
      expect(!found, name + " is resolvable from the ssr consumer");
    }
    let code = null;
    try { await import("@scshafe/ui"); } catch (error) { code = error.code; }
    expect(code === "ERR_MODULE_NOT_FOUND", "the React root should need react here (got " + code + ")");
    const page = String(ssr.documentPage({
      title: "Inbox",
      stylesheets: ["/assets/tokens.css", "/assets/layout.css", "/assets/components.css"],
      body: ssr.appShell({
        chrome: ssr.navTabs({ ariaLabel: "Sections", items: [{ id: "inbox", label: "Inbox", href: "/", active: true }] }),
        children: ssr.stack({ children: [
          ssr.inputField({ id: "q", name: "q", label: "Search", value: "<b>" }),
          ssr.button({ label: "Search", type: "submit", variant: "primary" }),
          ssr.status({ state: "running" }),
          ssr.list({ title: "Messages", children: ssr.listRow({ title: "Hello", status: "queued" }) }),
          ssr.emptyState({ message: "Nothing else." })
        ] })
      })
    }));
    for (const marker of ["AppFrame", "AppShell", "NavTabs", "Tab", "Stack", "InputField", "Button", "Status", "List", "ListRow", "EmptyState"]) {
      expect(page.includes('data-sui-component="' + marker + '"'), "ssr markup lacks " + marker);
    }
    expect(page.includes('value="&lt;b&gt;"') && !/\\sstyle=|<script/.test(page), "escaping or CSP shape");
    expect(toneByState.get("running") === "green" && SUI_TOKENS.length > 0, "format/tokens");
    for (const sheet of ["layout.css", "components.css", "tokens.css"]) {
      expect(/--sui-/.test(readFileSync(fileURLToPath(import.meta.resolve("@scshafe/ui/" + sheet)), "utf8")), sheet);
    }
    expect(readFileSync(fileURLToPath(import.meta.resolve("@scshafe/ui/layout.css")), "utf8").includes(".sui-grid-columns--3 "), "grid column classes");
    console.log("SSR smoke passed without React (" + page.length + " bytes).");
  `;
  await writeFile(join(consumer, "ssr-smoke.mjs"), smoke);
  await run(process.execPath, ["ssr-smoke.mjs"], { cwd: consumer });
  await writeFile(join(consumer, "ssr-smoke.ts"), `
    import { html, stack, button, inputField, type SafeHtml, type StackProps, type Content } from "@scshafe/ui/ssr";
    const props: StackProps = { gap: "md", children: [button({ label: "Go" }), inputField({ id: "a", label: "A" })] };
    const out: SafeHtml = stack(props);
    const content: Content = [out, "text", 1, null];
    // @ts-expect-error unknown spacing token
    const bad: StackProps = { gap: "huge" };
    export const page: string = String(html\`<main>\${content}</main>\`);
    void bad;
  `);
  await writeFile(join(consumer, "tsconfig.ssr.json"), `${JSON.stringify({
    compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", target: "ES2022", lib: ["ES2022"], strict: true, noEmit: true, skipLibCheck: false, types: [] },
    files: ["ssr-smoke.ts"]
  }, null, 2)}\n`);
  await run(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "--project", "tsconfig.ssr.json"], { cwd: consumer });
}

async function assertDirectPeers(consumer, peers) {
  const consumerJson = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
  const wrong = peers.filter((peer) => consumerJson.dependencies?.[peer.name] !== peer.version);
  if (wrong.length > 0) {
    throw new Error(
      `consumer ${consumer} must depend directly on ${wrong.map((peer) => peer.spec).join(", ")}` +
      ` (found ${JSON.stringify(consumerJson.dependencies ?? {})}); install the peers next to @scshafe/ui`
    );
  }
}

try {
  const { name, version, packageJson } = await readReleaseIdentity(root);
  const basePeers = smokePeerSpecs(packageJson);
  const editorPeers = smokePeerSpecs(packageJson, { editor: true });
  // Packed mode runs both phases; an installed consumer (publish.yml) runs
  // SUI_SMOKE_PHASE=base right after installing, then =editor after adding
  // the editor peers.
  const phase = installedConsumer === undefined ? "all" : process.env.SUI_SMOKE_PHASE;
  if (!["base", "editor", "ssr", "all"].includes(phase)) {
    throw new Error("with SUI_SMOKE_CONSUMER, set SUI_SMOKE_PHASE to base, editor or ssr");
  }
  const consumer = phase === "ssr"
    ? undefined
    : installedConsumer === undefined ? await packAndInstall(basePeers) : resolve(installedConsumer);

  if (phase === "base" || phase === "all") {
    await assertDirectPeers(consumer, basePeers);
    await assertNoEditorPeers(consumer, editorPeers);

    const jsSmoke = `
      import { existsSync, readFileSync } from "node:fs";
      import { fileURLToPath } from "node:url";
      import * as root from "@scshafe/ui";
      import * as state from "@scshafe/ui/state";
      import * as icons from "@scshafe/ui/icons";
      import * as identity from "@scshafe/ui/identity";
      import * as build from "@scshafe/ui/build";
      import * as testing from "@scshafe/ui/testing";
      import * as tokens from "@scshafe/ui/tokens";
      import * as format from "@scshafe/ui/format";
      import * as ssr from "@scshafe/ui/ssr";
      import metadata from "@scshafe/ui/package.json" with { type: "json" };

      const expect = (condition, message) => { if (!condition) throw new Error(message); };
      expect(metadata.name === ${JSON.stringify(name)} && metadata.version === ${JSON.stringify(version)}, "package identity mismatch");
      for (const exported of ["Stack", "Inline", "Grid", "Pane", "Scroll", "Button", "Status", "EmptyState", "FocusTabs", "InputField", "Card"]) {
        expect(typeof root[exported] === "function" || typeof root[exported] === "object", "root export missing: " + exported);
      }
      expect(typeof state.SuiProviders === "function" && typeof state.createSuiStore === "function", "state exports missing");
      expect(typeof icons.DefaultIconProvider === "function", "icons export missing");
      expect(typeof identity.UserMenu === "function" && typeof identity.buildSignOutUrl === "function", "identity exports missing");
      expect(typeof build.buildWebApp === "function" && typeof build.assertSuiResolvable === "function", "build exports missing");
      expect(typeof testing.bundleEntry === "function" && typeof testing.createSpaRenderHarness === "function", "testing exports missing");
      expect(Array.isArray(tokens.SUI_TOKENS) && tokens.SUI_TOKENS.length > 0, "token registry missing");
      expect(typeof format.timestamp === "function", "format export missing");
      expect(typeof ssr.stack === "function" && typeof ssr.html === "function", "ssr exports missing");
      build.assertSuiResolvable(process.cwd());

      const exportNames = [root, state, icons, identity, build, testing, tokens, format, ssr].flatMap((ns) => Object.keys(ns));
      const retired = exportNames.filter((key) => /^Mc[A-Z]|[a-z]Mc[A-Z]|^mc[A-Z]/.test(key));
      expect(retired.length === 0, "retired mc export names: " + retired.join(", "));

      for (const sheet of ["layout.css", "components.css", "tokens.css"]) {
        const css = readFileSync(fileURLToPath(import.meta.resolve("@scshafe/ui/" + sheet)), "utf8");
        expect(/--sui-/.test(css), sheet + " declares no --sui- tokens");
        expect(!/\\.mc-|--mc-|data-mc-/.test(css), sheet + " still carries the mc namespace");
      }
      const tokensCss = readFileSync(fileURLToPath(import.meta.resolve("@scshafe/ui/tokens.css")), "utf8");
      for (const token of tokens.SUI_TOKENS) {
        for (const theme of tokens.SUI_THEMES) {
          expect(tokensCss.includes(token.name + ": " + token[theme] + ";"), "tokens.css lacks the " + theme + " " + token.name);
        }
      }
      expect(tokensCss.includes("@media (prefers-color-scheme: dark)") && tokensCss.includes('[data-sui-theme="dark"]'), "tokens.css lacks the theme selectors");
      expect(typeof root.applySuiTheme === "function" && root.SUI_THEME_ATTRIBUTE === "data-sui-theme", "theme helpers missing");
      const packageDir = fileURLToPath(new URL(".", import.meta.resolve("@scshafe/ui/package.json")));
      for (const retiredPath of ["bin", "templates", "DESIGN-STATE-LAYER.md", "DESIGN-SITE-LAYOUT.md"]) {
        expect(!existsSync(packageDir + retiredPath), "retired path shipped: " + retiredPath);
      }
      expect(metadata.bin === undefined, "package still declares a bin");
    expect(metadata.dependencies === undefined, "package declares hard dependencies (tiptap belongs in optional peers)");
      console.log("JS smoke passed (" + exportNames.length + " exports across 9 subpaths).");
    `;
    await writeFile(join(consumer, "smoke.mjs"), jsSmoke);
    await run(process.execPath, ["smoke.mjs"], { cwd: consumer });

    const renderSmoke = `
      import React from "react";
      import { renderToString } from "react-dom/server";
      import { Button, EmptyState, Stack, Status, InputField } from "@scshafe/ui";
      import { SuiProviders, ToastTray, Toasts, Popovers, createSuiStore } from "@scshafe/ui/state";
      import { DefaultIconProvider } from "@scshafe/ui/icons";

      const h = React.createElement;
      const store = createSuiStore({ slices: [Toasts, Popovers], preloadedState: { Toasts: { items: [{ id: "t1", kind: "info", message: "Saved" }] } } });
      const html = renderToString(
        h(SuiProviders, { store },
          h(DefaultIconProvider, null,
            h(Stack, { gap: "md" },
              h(Status, { state: "running" }),
              h(InputField, { id: "name", label: "Name", value: "", onChange() {} }),
              h(Button, { label: "Save", icon: "action.copy", variant: "primary" }),
              h(EmptyState, { message: "Nothing here yet." })),
            h(ToastTray))));
      for (const marker of ["Stack", "Status", "InputField", "Button", "EmptyState", "ToastTray"]) {
        if (!html.includes('data-sui-component="' + marker + '"')) {
          throw new Error("rendered markup lacks data-sui-component=" + marker + ": " + html.slice(0, 400));
        }
      }
      if (!/class="sui-stack/.test(html) || !/<svg/.test(html) || !html.includes("Saved")) {
        throw new Error("rendered markup lacks sui- classes, icons or store state");
      }
      if (/data-mc-|\\bmc-/.test(html)) throw new Error("rendered markup carries the mc namespace");
      console.log("React render smoke passed (" + html.length + " bytes of markup).");
    `;
    await writeFile(join(consumer, "render-smoke.mjs"), renderSmoke);
    await run(process.execPath, ["render-smoke.mjs"], { cwd: consumer });

    const typeSmoke = `
      import { Stack, Button, Status, EmptyState, type StackProps } from "@scshafe/ui";
      import { SuiProviders, createSuiStore, Toasts, type SuiProvidersProps, type CreateSuiStoreOptions } from "@scshafe/ui/state";
      import { SUI_TOKENS, SUI_TOKEN_NAMES, type SuiToken } from "@scshafe/ui/tokens";
      import { buildWebApp, type BuildWebAppOptions } from "@scshafe/ui/build";
      import { useIdentity } from "@scshafe/ui/identity";

      const options: CreateSuiStoreOptions = { slices: [Toasts] };
      const store = createSuiStore(options);
      const props: SuiProvidersProps = { store, children: null };
      const first: SuiToken | undefined = SUI_TOKENS[0];
      const names: readonly string[] = SUI_TOKEN_NAMES;
      const stack: StackProps = { gap: "md", children: null };
      const buildOptions: BuildWebAppOptions = { entry: "src/main.tsx", outfile: "dist/app.js" };
      // @ts-expect-error unknown spacing token
      const badStack: StackProps = { gap: "huge", children: null };

      export function App() {
        return (
          <SuiProviders {...props}>
            <Stack {...stack}>
              <Status state="running" />
              <Button label="Save" />
              <EmptyState message="Nothing here yet." />
            </Stack>
          </SuiProviders>
        );
      }
      void first; void names; void buildWebApp; void buildOptions; void useIdentity; void badStack;
    `;
    await writeFile(join(consumer, "smoke.tsx"), typeSmoke);
    await writeFile(join(consumer, "tsconfig.json"), `${JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: []
      },
      files: ["smoke.tsx"]
    }, null, 2)}\n`);
    await run(process.execPath, [
      resolve(root, "node_modules/typescript/bin/tsc"),
      "--project",
      "tsconfig.json"
    ], { cwd: consumer });
  }

  if (phase === "editor" || phase === "all") {
    if (installedConsumer === undefined) await addPeers(consumer, editorPeers);
    await assertDirectPeers(consumer, [...basePeers, ...editorPeers]);
    const editorSmoke = `
      import React from "react";
      import { renderToString } from "react-dom/server";
      import { MarkdownEditor } from "@scshafe/ui/editor";
      import * as root from "@scshafe/ui";
      if (typeof MarkdownEditor !== "function") throw new Error("editor export missing");
      if ("MarkdownEditor" in root) throw new Error("MarkdownEditor is still in the root export");
      const html = renderToString(React.createElement(MarkdownEditor, { ariaLabel: "Message", initialValue: "**hi**" }));
      if (!html.includes('data-sui-component="MarkdownEditor"')) throw new Error("editor markup lacks its marker: " + html);
      console.log("Editor smoke passed (@scshafe/ui/editor with its tiptap peers).");
    `;
    await writeFile(join(consumer, "editor-smoke.mjs"), editorSmoke);
    await run(process.execPath, ["editor-smoke.mjs"], { cwd: consumer });
    await writeFile(join(consumer, "editor-smoke.tsx"), `
      import { useRef } from "react";
      import { MarkdownEditor, type MarkdownEditorHandle, type MarkdownEditorProps } from "@scshafe/ui/editor";
      const props: MarkdownEditorProps = { ariaLabel: "Message", onChange: (markdown: string) => void markdown };
      export function Composer() {
        const ref = useRef<MarkdownEditorHandle>(null);
        return <MarkdownEditor {...props} ref={ref} />;
      }
    `);
    await writeFile(join(consumer, "tsconfig.editor.json"), `${JSON.stringify({
      compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", target: "ES2022", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, types: [] },
      files: ["editor-smoke.tsx"]
    }, null, 2)}\n`);
    await run(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "--project", "tsconfig.editor.json"], { cwd: consumer });
  }

  if (phase === "ssr" || phase === "all") {
    const ssrConsumer = installedConsumer === undefined ? await packAndInstall([], "ssr-consumer") : resolve(installedConsumer);
    await assertSsrWithoutReact(ssrConsumer, name, version);
  }

  console.log(
    installedConsumer === undefined
      ? "@scshafe/ui packed-install smokes passed: JS, React render and TypeScript without the editor peers, the editor subpath with them, and @scshafe/ui/ssr with no peers at all."
      : `@scshafe/ui installed-consumer ${phase} smokes passed (${installedConsumer}).`
  );
} finally {
  if (scratch !== undefined) await rm(scratch, { force: true, recursive: true });
}
