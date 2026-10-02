// Packed-install smoke (scripts/check-pack-install.mjs copies it into an empty
// consumer that installed the packed tarball and its base peers, then runs it
// there): every exported subpath resolves from the published name and carries
// its key exports; the three stylesheets hold only --sui-* tokens and sui-
// classes; nothing retired ships.
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
expect(metadata.name === "@scshafe/ui", "package identity mismatch");
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
  expect(!/\.mc-|--mc-|data-mc-/.test(css), sheet + " still carries the mc namespace");
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
