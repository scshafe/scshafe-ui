// @scshafe/ui's own packed-install check, beside the scshafe-dev master
// scripts/check-pack-install.mjs. It is a test (run by `pnpm run test`, after
// the build in `pnpm run check`) so that neither package.json, which is in
// the payload, nor the master scripts change for it.
//
// The master's phases always install the base peers; @scshafe/ui/ssr (0.4.0)
// promises more: a server-rendered app (scshafe-dev's webapp-server apps)
// installs @scshafe/ui ALONE, with no React and no peer at all. So pack the
// package, install it into an empty consumer with auto-install-peers=false
// and nothing else, and prove there that react, react-dom and @types/react do
// not resolve, the React root does not import, and @scshafe/ui/ssr, /format,
// /tokens and the stylesheets import, render and typecheck (skipLibCheck off,
// so the shipped .d.ts may not reach for @types/react either). A CommonJS
// script in the same consumer loads @scshafe/ui/ssr with require() (Node's
// require(esm)) and with import(), the two recipes docs/ADOPTING.md gives
// CommonJS apps, and resolves the stylesheets with require.resolve.
//
// The publish workflow installs the registry version back and requires its
// integrity to equal a pack of the tag; this check runs inside `verify` on
// that tag, so it covers the same bytes.

import test from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  PNPM_PACK_ARGS,
  projectRoot as root,
  readReleaseIdentity,
  singlePackReport
} from "../scripts/release-identity.mjs";

const { name, version, base } = await readReleaseIdentity(root);

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
        ssr.emptyState({ message: "Nothing else." }),
        ssr.checkboxField({ id: "all", name: "all", label: "Show all", checked: true }),
        ssr.banner({ tone: "warn", title: "Held", text: "Paused.", dismissHref: "/" })
      ] })
    })
  }));
  for (const marker of ["AppFrame", "AppShell", "NavTabs", "Tab", "Stack", "InputField", "Button", "Status", "List", "ListRow", "EmptyState", "CheckboxField", "Banner"]) {
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

// The CommonJS recipe: no "type": "module" applies to a .cjs file, so this is
// what an Express app written in CommonJS runs.
const cjsSmoke = `
  "use strict";
  const { readFileSync } = require("node:fs");
  const expect = (condition, message) => { if (!condition) throw new Error(message); };
  // 1. require(esm): synchronous, Node 22.12+ (the package needs 22.22+ anyway).
  const ui = require("@scshafe/ui/ssr");
  const page = String(ui.documentPage({ title: "Jobs", body: ui.stack({ children: [
    ui.banner({ tone: "ok", text: "Saved." }),
    ui.checkboxField({ id: "remote", name: "remote", label: "Remote only" }),
    ui.listRow({ title: "<b>escaped</b>", status: "running" })
  ] }) }));
  expect(page.includes('data-sui-component="Banner"') && page.includes('data-sui-component="CheckboxField"'), "require(): markup");
  expect(page.includes("&lt;b&gt;escaped&lt;/b&gt;"), "require(): escaping");
  // 2. the stylesheets, for a static route.
  for (const sheet of ["tokens.css", "layout.css", "components.css"]) {
    expect(readFileSync(require.resolve("@scshafe/ui/" + sheet), "utf8").includes("--sui-"), "require.resolve " + sheet);
  }
  // 3. import(): the asynchronous recipe, the same module instance.
  import("@scshafe/ui/ssr").then((loaded) => {
    expect(loaded.banner === ui.banner, "import() and require() load one module");
    console.log("CommonJS smoke passed (require and import).");
  }).catch((error) => { console.error(error); process.exitCode = 1; });
`;

const typeSmoke = `
  import { html, stack, button, inputField, type SafeHtml, type StackProps, type Content } from "@scshafe/ui/ssr";
  const props: StackProps = { gap: "md", children: [button({ label: "Go" }), inputField({ id: "a", label: "A" })] };
  const out: SafeHtml = stack(props);
  const content: Content = [out, "text", 1, null];
  // @ts-expect-error unknown spacing token
  const bad: StackProps = { gap: "huge" };
  export const page: string = String(html\`<main>\${content}</main>\`);
  void bad;
`;

test("the packed package installed ALONE renders and typechecks @scshafe/ui/ssr without React", async () => {
  const scratch = await mkdtemp(join(tmpdir(), `${base}-ssr-alone-`));
  try {
    const packed = singlePackReport(await run("pnpm", [...PNPM_PACK_ARGS, "--pack-destination", scratch], { capture: true }));
    const consumer = join(scratch, "ssr-consumer");
    await mkdir(consumer);
    await writeFile(join(consumer, "package.json"), `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`);
    await copyFile(resolve(root, ".npmrc"), join(consumer, ".npmrc"));
    const storeDir = (await run("pnpm", ["store", "path"], { capture: true })).trim();
    await run("pnpm", [
      "add", "--config.auto-install-peers=false", "--ignore-scripts", "--prefer-offline",
      "--store-dir", storeDir, "--save-exact", join(scratch, packed.basename)
    ], { cwd: consumer });

    const deps = Object.keys(JSON.parse(await readFile(join(consumer, "package.json"), "utf8")).dependencies ?? {});
    if (deps.length !== 1 || deps[0] !== name) throw new Error(`the ssr consumer must depend on ${name} alone (found ${deps.join(", ")})`);

    await writeFile(join(consumer, "ssr-smoke.mjs"), smoke);
    await run(process.execPath, ["ssr-smoke.mjs"], { cwd: consumer });
    await writeFile(join(consumer, "ssr-smoke.cjs"), cjsSmoke);
    await run(process.execPath, ["ssr-smoke.cjs"], { cwd: consumer });
    await writeFile(join(consumer, "ssr-smoke.ts"), typeSmoke);
    await writeFile(join(consumer, "tsconfig.ssr.json"), `${JSON.stringify({
      compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", target: "ES2022", lib: ["ES2022"], strict: true, noEmit: true, skipLibCheck: false, types: [] },
      files: ["ssr-smoke.ts"]
    }, null, 2)}\n`);
    await run(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "--project", "tsconfig.ssr.json"], { cwd: consumer });
  } finally {
    await rm(scratch, { force: true, recursive: true });
  }
});
