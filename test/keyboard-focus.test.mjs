// Keyboard focus, per interactive component (WCAG 2.1.1, 2.4.3, 2.4.7): in
// jsdom, with the package stylesheets loaded, every catalog component that
// declares a focus target puts it in the sequential focus order (the order
// Tab follows: positive tabindex first, then document order, skipping
// disabled, hidden and tabindex="-1" elements), each element in that order
// takes focus, and while focused it matches the :focus-visible rule — a
// visible outline in --sui-focus-ring — and is not transparent. Components
// without a focus target must render nothing tabbable.
import assert from "node:assert/strict";
import test from "node:test";
import { installDom, render } from "./support/dom.mjs";
import { declarations, parseRules, readStylesheet, styleRules } from "./support/css.mjs";

installDom();
const { CATALOG, renderEntry } = await import("./support/catalog.mjs");

const FOCUSABLE = "a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=''], [contenteditable='true']";

function tabSequence(container) {
  const candidates = [...container.querySelectorAll(FOCUSABLE)].filter((element) =>
    !element.disabled
    && element.tabIndex >= 0
    && !(element.tagName === "INPUT" && element.type === "hidden")
    && !element.closest("[hidden], [inert], [popover]:not(:popover-open), dialog:not([open])"));
  const positive = candidates.filter((element) => element.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  return [...positive, ...candidates.filter((element) => element.tabIndex === 0)];
}

// jsdom caches computed styles until the DOM mutates, and focus is not a
// mutation: touch a scratch attribute on <html> so each read is fresh.
let generation = 0;
function invalidate() {
  document.documentElement.setAttribute("data-style-generation", String(generation += 1));
}
function freshStyle(element) {
  invalidate();
  return getComputedStyle(element);
}

/**
 * Move keyboard focus to `element` from the document: a Tab keydown, then
 * focus. jsdom's :focus-visible follows the browser heuristic (focus that
 * follows a Tab key is visible); starting from the document each time keeps
 * that heuristic out of the per-element result.
 */
function pressTabTo(element) {
  document.activeElement?.blur();
  document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", code: "Tab", bubbles: true }));
  element.focus();
  invalidate();
}

function focusIndicator(element) {
  const style = freshStyle(element);
  const outline = style.getPropertyValue("outline");
  return { outline, visible: /\b[1-9]\d*(?:\.\d+)?px\b/.test(outline) && /\bsolid\b/.test(outline) && style.getPropertyValue("opacity") !== "0" };
}

const interactive = CATALOG.filter((entry) => entry.focus);
assert.ok(interactive.length >= 25, "the catalog covers the interactive components");

for (const entry of interactive) {
  test(`${entry.name}: keyboard-reachable with a visible focus indicator`, async () => {
    const view = await render(renderEntry(entry));
    try {
      const sequence = tabSequence(view.container);
      const targets = [...view.container.querySelectorAll(entry.focus)];
      assert.ok(targets.length > 0, `${entry.name} renders ${entry.focus}`);
      assert.ok(targets.some((target) => sequence.includes(target)), `${entry.focus} is in the Tab order`);
      document.activeElement?.blur();
      for (const element of sequence) {
        pressTabTo(element);
        assert.equal(document.activeElement, element, `${element.outerHTML.slice(0, 80)} takes focus`);
        assert.ok(element.matches(":focus-visible"), "keyboard focus matches :focus-visible");
        const indicator = focusIndicator(element);
        assert.ok(indicator.visible, `${element.outerHTML.slice(0, 80)} shows a focus ring (outline: ${indicator.outline})`);
      }
    } finally {
      // Leave focus the way a user does before the component goes away.
      document.activeElement?.blur();
      await view.unmount();
    }
  });
}

test("components without a focus target render nothing tabbable", async () => {
  for (const entry of CATALOG.filter((candidate) => !candidate.focus)) {
    const view = await render(renderEntry(entry));
    try {
      assert.deepEqual(tabSequence(view.container).map((element) => element.outerHTML.slice(0, 60)), [], entry.name);
    } finally {
      await view.unmount();
    }
  }
});

test("no stylesheet rule removes the focus outline", () => {
  const offenders = [];
  for (const sheet of ["layout.css", "components.css"]) {
    for (const rule of styleRules(parseRules(readStylesheet(sheet)))) {
      for (const [property, value] of declarations(rule.body)) {
        if (/^outline(-style|-width)?$/.test(property) && /^(none|0|0px|hidden)$/.test(value.trim())) offenders.push(`${sheet}: ${rule.prelude}`);
        if (property === "outline" && !rule.prelude.includes(":focus-visible")) offenders.push(`${sheet}: ${rule.prelude} sets an outline outside :focus-visible`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});
