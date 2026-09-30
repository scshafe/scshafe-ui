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

async function packAndInstall(peers) {
  const packed = singlePackReport(await run("pnpm", [
    ...PNPM_PACK_ARGS,
    "--pack-destination",
    scratch
  ], { capture: true }));

  const consumer = join(scratch, "consumer");
  await mkdir(consumer);
  await writeFile(
    join(consumer, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`
  );
  await copyFile(resolve(root, ".npmrc"), join(consumer, ".npmrc"));
  // The scratch consumer may sit on another filesystem (tmpdir), where pnpm
  // would pick a different, empty store; reuse the project's store.
  const storeDir = (await run("pnpm", ["store", "path"], { capture: true })).trim();
  await run("pnpm", [
    "add",
    "--ignore-scripts",
    "--prefer-offline",
    "--store-dir",
    storeDir,
    "--save-exact",
    join(scratch, packed.basename),
    ...peers.map((peer) => peer.spec)
  ], { cwd: consumer });
  return consumer;
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
  const peers = smokePeerSpecs(packageJson);
  const consumer = installedConsumer === undefined
    ? await packAndInstall(peers)
    : resolve(installedConsumer);
  await assertDirectPeers(consumer, peers);

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
    build.assertSuiResolvable(process.cwd());

    const exportNames = [root, state, icons, identity, build, testing, tokens, format].flatMap((ns) => Object.keys(ns));
    const retired = exportNames.filter((key) => /^Mc[A-Z]|[a-z]Mc[A-Z]|^mc[A-Z]/.test(key));
    expect(retired.length === 0, "retired mc export names: " + retired.join(", "));

    for (const sheet of ["layout.css", "components.css", "tokens.css"]) {
      const css = readFileSync(fileURLToPath(import.meta.resolve("@scshafe/ui/" + sheet)), "utf8");
      expect(/--sui-/.test(css), sheet + " declares no --sui- tokens");
      expect(!/\\.mc-|--mc-|data-mc-/.test(css), sheet + " still carries the mc namespace");
    }
    const tokensCss = readFileSync(fileURLToPath(import.meta.resolve("@scshafe/ui/tokens.css")), "utf8");
    for (const token of tokens.SUI_TOKENS) {
      expect(tokensCss.includes(token.name + ": " + token.default + ";"), "tokens.css lacks " + token.name);
    }
    const packageDir = fileURLToPath(new URL(".", import.meta.resolve("@scshafe/ui/package.json")));
    for (const retiredPath of ["bin", "templates", "DESIGN-STATE-LAYER.md", "DESIGN-SITE-LAYOUT.md"]) {
      expect(!existsSync(packageDir + retiredPath), "retired path shipped: " + retiredPath);
    }
    expect(metadata.bin === undefined, "package still declares a bin");
    console.log("JS smoke passed (" + exportNames.length + " exports across 8 subpaths).");
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
  console.log(
    installedConsumer === undefined
      ? "@scshafe/ui packed-install JS, React render and TypeScript smokes passed."
      : `@scshafe/ui installed-consumer JS, React render and TypeScript smokes passed (${consumer}).`
  );
} finally {
  if (scratch !== undefined) await rm(scratch, { force: true, recursive: true });
}
