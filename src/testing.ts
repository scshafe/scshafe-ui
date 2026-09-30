// S4 — @scshafe/ui/testing: the test harness both consumers copied, as library imports.
// Node-only (test-time); esbuild resolves from the consumer's devDependencies.
//
// Two primitives, extracted from the copies in MC's bucket tests and
// voice-journey's web-spa test:
//
//   bundleEntry   — write an inline entry source into a temp dir INSIDE the app
//                   root (so node_modules resolution finds the app's react/@scshafe/ui)
//                   and bundle it; returns the bundle path + a cleanup fn.
//
//   runNodeChild  — run a script in a CHILD node process, feeding `input` on
//                   stdin and parsing one JSON object from stdout. Exists
//                   because importing a bundled React graph holds Node's event
//                   loop open and wedges `node --test` after the assertions
//                   pass — render in a child that exits explicitly instead.
//                   (Discovered twice before this helper existed.)

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface BundleEntryOptions {
  /** App root whose node_modules should resolve imports (temp entry is created inside it). */
  appRoot: string;
  /** Inline entry source (imports resolve against appRoot's node_modules). */
  source: string;
  /** Modules left as external imports (default: react family). */
  external?: string[];
  /** Extra esbuild options merged last. */
  esbuild?: Record<string, unknown>;
}

export interface BundledEntry {
  bundlePath: string;
  cleanup: () => void;
}

export async function bundleEntry({ appRoot, source, external, esbuild: extra = {} }: BundleEntryOptions): Promise<BundledEntry> {
  const { build } = await import("esbuild");
  const tmp = mkdtempSync(join(appRoot, ".sui-testing-"));
  const entryPath = join(tmp, "entry.mjs");
  const bundlePath = join(tmp, "entry.bundle.mjs");
  writeFileSync(entryPath, source);
  try {
    await build({
      entryPoints: [entryPath],
      bundle: true,
      format: "esm",
      platform: "browser",
      absWorkingDir: appRoot,
      outfile: bundlePath,
      external: external ?? [],
      logLevel: "silent",
      ...extra
    } as any);
  } catch (error) {
    rmSync(tmp, { recursive: true, force: true });
    throw error;
  }
  return { bundlePath, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

export interface RunNodeChildOptions {
  /** Script path to run with the current node executable. */
  scriptPath: string;
  /** Value JSON-serialized onto the child's stdin. */
  input?: unknown;
  /** Kill the child after this many ms (default 30000). */
  timeoutMs?: number;
}

export function runNodeChild({ scriptPath, input, timeoutMs = 30000 }: RunNodeChildOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`runNodeChild: ${scriptPath} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.stderr.on("data", (chunk) => { err += chunk; });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`runNodeChild: exited ${code}: ${err.slice(0, 800)}`));
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error(`runNodeChild: unparseable stdout: ${out.slice(0, 200)}`));
      }
    });
    child.stdin.end(input === undefined ? "" : JSON.stringify(input));
  });
}

// The composed harness voice-journey's web-spa test hand-rolled: bundle a
// renderApp(preloadedState) entry over the app's store + root component, then
// render each preloaded state in a child process (see runNodeChild's rationale).
export interface SpaRenderHarnessOptions {
  appRoot: string;
  /** Absolute path to the module exporting the store factory. */
  storeModule: string;
  /** Export name of the store factory taking { preloadedState } (default "createSuiStore"-style factories accept it). */
  storeExport: string;
  /** Absolute path to the module exporting the root component. */
  appModule: string;
  /** Export name of the root component. */
  appExport: string;
  /** Wrap in SuiProviders (default true; set false for a plain react-redux Provider). */
  suiProviders?: boolean;
}

export async function createSpaRenderHarness({ appRoot, storeModule, storeExport, appModule, appExport, suiProviders = true }: SpaRenderHarnessOptions) {
  const providerImport = suiProviders
    ? `import { SuiProviders } from "@scshafe/ui/state";`
    : `import { Provider as SuiProviders } from "react-redux";`;
  const { bundlePath, cleanup } = await bundleEntry({
    appRoot,
    source: `
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
${providerImport}
import { ${storeExport} } from ${JSON.stringify(storeModule)};
import { ${appExport} } from ${JSON.stringify(appModule)};
export function renderApp(preloadedState) {
  const store = ${storeExport}({ preloadedState });
  return renderToStaticMarkup(
    React.createElement(SuiProviders, { store },
      React.createElement(${appExport}, null)));
}
`
  });
  const runnerPath = join(bundlePath, "..", "runner.mjs");
  writeFileSync(runnerPath, `
import { renderApp } from "./entry.bundle.mjs";
let data = "";
for await (const chunk of process.stdin) data += chunk;
const html = renderApp(data ? JSON.parse(data) : undefined);
process.stdout.write(JSON.stringify({ html }), () => process.exit(0));
`);
  return {
    renderApp: async (preloadedState: unknown): Promise<string> => {
      const result = await runNodeChild({ scriptPath: runnerPath, input: preloadedState });
      return result.html;
    },
    cleanup
  };
}
