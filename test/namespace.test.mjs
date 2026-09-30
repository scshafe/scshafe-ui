// The namespace guard: every class a component renders or a stylesheet styles
// is sui-*, and every data attribute is data-sui-*. Unprefixed public classes
// (the pre-0.3.0 `chip`, `panel`, `task-row`, `project-chat-*`, …) cannot come
// back. The catalog renders every public component; the stylesheet scan covers
// hosts that only use the CSS contract.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { CATALOG, renderEntry } from "./support/catalog.mjs";

// Classes owned by third-party code the package styles (tiptap's placeholder).
const THIRD_PARTY_CLASSES = new Set(["is-editor-empty"]);
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function attributes(html, name) {
  return [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((match) => match[1]);
}

test("every rendered class is sui-* and every data attribute data-sui-*", () => {
  const offenders = [];
  for (const entry of CATALOG) {
    const html = renderToStaticMarkup(renderEntry(entry));
    assert.ok(html.length > 0, `${entry.name} renders markup`);
    for (const value of attributes(html, "class")) {
      for (const token of value.split(/\s+/).filter(Boolean)) {
        if (!token.startsWith("sui-") && !THIRD_PARTY_CLASSES.has(token)) offenders.push(`${entry.name}: class ${token}`);
      }
    }
    for (const [, name] of html.matchAll(/\s(data-[\w-]+)=/g)) {
      if (!name.startsWith("data-sui-")) offenders.push(`${entry.name}: ${name}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("every class and attribute selector in the stylesheets is in the sui namespace", () => {
  const offenders = [];
  for (const sheet of ["layout.css", "components.css"]) {
    const css = stripComments(readFileSync(new URL(`../${sheet}`, import.meta.url), "utf8"))
      // declaration blocks hold values (e.g. `0.5s`), not selectors
      .replace(/\{[^{}]*\}/g, "{}");
    for (const [, name] of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      if (!name.startsWith("sui-") && !THIRD_PARTY_CLASSES.has(name)) offenders.push(`${sheet}: .${name}`);
    }
    for (const [, name] of css.matchAll(/\[\s*([\w-]+)/g)) {
      if (name.startsWith("data-") && !name.startsWith("data-sui-")) offenders.push(`${sheet}: [${name}]`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("the markers carry no application-specific names", () => {
  const html = CATALOG.map((entry) => renderToStaticMarkup(renderEntry(entry))).join("\n");
  assert.doesNotMatch(html, /project-(?:chat|tab)|task-row|FocusTabsComponent|data-project-/);
  for (const [, marker] of html.matchAll(/data-sui-component="([^"]+)"/g)) {
    assert.match(marker, /^[A-Z][A-Za-z]+$/, `marker ${marker} is a component name`);
  }
});
