#!/usr/bin/env node
// create-mc-app — scaffold a new site on the mc-ui stack (S4).
//
//   npx create-mc-app my-app [--pin <sha>] [--name <display-name>]
//
// Copies templates/app into ./my-app: package.json (react + RTK + mc-ui),
// tsconfig, a build script on mc-ui/build, theme.css with the token registry,
// and a doctrine-shaped first slice + page on mc-ui/state. Copied files are
// yours to edit — nothing references the generator afterward.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
let target = null;
let pin = null;
let name = null;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--pin") pin = args[++i];
  else if (args[i] === "--name") name = args[++i];
  else if (!args[i].startsWith("--") && !target) target = args[i];
  else {
    console.error(`create-mc-app: unsupported argument ${args[i]}`);
    process.exit(1);
  }
}
if (!target) {
  console.error("usage: create-mc-app <target-dir> [--pin <mc-ui sha>] [--name <app-name>]");
  process.exit(1);
}

const targetDir = join(process.cwd(), target);
if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
  console.error(`create-mc-app: ${target} exists and is not empty — refusing to overwrite`);
  process.exit(1);
}

const templateDir = fileURLToPath(new URL("../templates/app", import.meta.url));
mkdirSync(targetDir, { recursive: true });
cpSync(templateDir, targetDir, { recursive: true });

const appName = name ?? target.split("/").at(-1);
const mcUiPin = pin
  ? `git+ssh://git@github.com/scshafe/mc-ui.git#${pin}`
  : "git+ssh://git@github.com/scshafe/mc-ui.git";
for (const file of ["package.json", "src/theme.css", "src/main.jsx", "src/AppComponent.jsx"]) {
  const path = join(targetDir, file);
  writeFileSync(path, readFileSync(path, "utf8").replaceAll("__APP_NAME__", appName).replaceAll("__MC_UI_PIN__", mcUiPin));
}

console.log(`Scaffolded ${appName} at ${target}/`);
if (!pin) console.log("note: mc-ui is unpinned (tracks the default branch) — pin a SHA in package.json before relying on it.");
console.log(`next: cd ${target} && npm install && npm run build`);
