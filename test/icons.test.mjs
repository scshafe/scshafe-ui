// L4 pin — @scshafe/ui/icons: the registry invariant, the Icon render contract, the
// default provider feeding the IconContext seam, and the state→glyph map.
// Tested against the committed lib artifact. Optionality (root pulls no
// iconoir) is pinned in state-optionality.test.mjs alongside the RTK probe.
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const {
  ICON_NAMES, ICON_NAME_SET, isIconName,
  iconComponentFor, iconRegistryKeys, ICON_LIBRARY_ID,
  Icon, iconByState, iconNameForState,
  DefaultIconProvider, renderDefaultIcon,
} = await import("../lib/icons/index.js");
const { Button } = await import("../lib/index.js");
const { toneByState } = await import("../lib/format.js");

test("the registry is closed, exhaustive, and includes the L4 additions", () => {
  assert.equal(new Set(ICON_NAMES).size, ICON_NAMES.length, "no duplicate names");
  assert.deepEqual(iconRegistryKeys().sort(), [...ICON_NAMES].sort(), "names ↔ bindings exhaustive");
  for (const fixed of ["tab.git", "tab.delete"]) {
    assert.ok(isIconName(fixed), `${fixed} declared (once a silent QuestionMark fallback)`);
    assert.notEqual(iconComponentFor(fixed), null);
  }
  assert.ok(ICON_NAMES.filter((n) => n.startsWith("state.")).length >= 10, "state.* section present");
  assert.equal(iconComponentFor("nope.nothing"), null);
  assert.equal(ICON_LIBRARY_ID, "iconoir-react@regular");
  assert.equal(ICON_NAME_SET.has("action.copy"), true);
});

test("Icon renders an svg with size, stroke, and a11y contract", () => {
  const hidden = renderToStaticMarkup(React.createElement(Icon, { name: "action.refresh", size: 12 }));
  assert.match(hidden, /<svg/);
  assert.match(hidden, /width="12"[^>]*height="12"|height="12"[^>]*width="12"/);
  assert.match(hidden, /aria-hidden="true"/);
  const labeled = renderToStaticMarkup(React.createElement(Icon, { name: "action.copy", "aria-label": "Copy id" }));
  assert.match(labeled, /role="img"[^>]*aria-label="Copy id"|aria-label="Copy id"[^>]*role="img"/);
  const fallback = renderToStaticMarkup(React.createElement(Icon, { name: "not.a.name" }));
  assert.match(fallback, /<svg/, "unknown names degrade to the visible fallback glyph");
});

test("DefaultIconProvider makes package components render glyphs with zero host code", () => {
  const bare = renderToStaticMarkup(React.createElement(Button, { label: "Go", icon: "action.send" }));
  assert.doesNotMatch(bare, /<svg/, "no provider → the no-op default renders nothing (unchanged)");
  const provided = renderToStaticMarkup(
    React.createElement(DefaultIconProvider, null,
      React.createElement(Button, { label: "Go", icon: "action.send" }))
  );
  assert.match(provided, /<svg/, "provider → the glyph renders inside the Button");
  assert.match(provided, /data-sui-component="Button"/);
  assert.equal(typeof renderDefaultIcon, "function");
});

test("iconNameForState maps lifecycle words, skips kind words, and every glyph is registered", () => {
  assert.equal(iconNameForState("running"), "state.running");
  assert.equal(iconNameForState("blocked"), "state.blocked");
  assert.equal(iconNameForState("needs_human"), "state.warning");
  assert.equal(iconNameForState("queued"), "state.pending");
  assert.equal(iconNameForState("patch"), null, "kind words get no glyph by design");
  assert.equal(iconNameForState("handoff"), null);
  assert.equal(iconNameForState(42), null);
  for (const [state, iconName] of iconByState) {
    assert.ok(isIconName(iconName), `${state} → ${iconName} must be a registered name`);
    assert.ok(toneByState.has(state), `${state} should exist in the toneByState vocabulary`);
  }
});
