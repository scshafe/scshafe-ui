// S4 — mc-ui/testing: the test harness both consumers copied, as library imports.
// Node-only (test-time); esbuild resolves from the consumer's devDependencies.
//
// Two primitives, extracted from the copies in MC's bucket tests and
// voice-journey's web-spa test:
//
//   bundleEntry   — write an inline entry source into a temp dir INSIDE the app
//                   root (so node_modules resolution finds the app's react/mc-ui)
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
export async function bundleEntry({ appRoot, source, external, esbuild: extra = {} }) {
    const { build } = await import("esbuild");
    const tmp = mkdtempSync(join(appRoot, ".mc-testing-"));
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
        });
    }
    catch (error) {
        rmSync(tmp, { recursive: true, force: true });
        throw error;
    }
    return { bundlePath, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}
export function runNodeChild({ scriptPath, input, timeoutMs = 30000 }) {
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
            if (code !== 0)
                return reject(new Error(`runNodeChild: exited ${code}: ${err.slice(0, 800)}`));
            try {
                resolve(JSON.parse(out));
            }
            catch {
                reject(new Error(`runNodeChild: unparseable stdout: ${out.slice(0, 200)}`));
            }
        });
        child.stdin.end(input === undefined ? "" : JSON.stringify(input));
    });
}
export async function createSpaRenderHarness({ appRoot, storeModule, storeExport, appModule, appExport, mcProviders = true }) {
    const providerImport = mcProviders
        ? `import { McProviders } from "mc-ui/state";`
        : `import { Provider as McProviders } from "react-redux";`;
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
    React.createElement(McProviders, { store },
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
        renderApp: async (preloadedState) => {
            const result = await runNodeChild({ scriptPath: runnerPath, input: preloadedState });
            return result.html;
        },
        cleanup
    };
}
