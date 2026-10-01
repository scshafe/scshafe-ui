import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

const { PinnedDataTable } = await import("../lib/index.js");

test("resizable columns expose a focusable, valued keyboard separator", () => {
  const html = renderToStaticMarkup(React.createElement(PinnedDataTable, {
    ariaLabel: "Projects",
    tableId: "projects",
    columns: [{ id: "project", header: "Project", width: 240, render: (row) => row.title }],
    rows: [{ id: "one", title: "One" }],
    rowKey: (row) => row.id,
    onColumnWidthSet() {},
    onColumnWidthReset() {}
  }));

  assert.match(html, /role="separator"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /aria-valuemin="72"/);
  assert.match(html, /aria-valuemax="960"/);
  assert.match(html, /aria-valuenow="240"/);
  assert.match(html, /aria-valuetext="240 pixels wide"/);
  assert.match(html, /Left and Right Arrow keys/);
});

test("the resize separator wires Arrow, Shift, Home, and End keyboard behavior", () => {
  const source = readFileSync(new URL("../src/table/PinnedDataTableComponent.tsx", import.meta.url), "utf8");
  assert.match(source, /event\.key === "ArrowLeft"/);
  assert.match(source, /event\.key === "ArrowRight"/);
  assert.match(source, /event\.shiftKey \? KEYBOARD_RESIZE_LARGE_STEP : KEYBOARD_RESIZE_STEP/);
  assert.match(source, /event\.key === "Home"/);
  assert.match(source, /event\.key === "End"/);
  assert.match(source, /onKeyDown=\{handleKeyDown\}/);
});

test("data table cells have default styling whose text pairs reach 4.5:1 in both themes", async () => {
  const { SUI_THEMES } = await import("@scshafe/ui/tokens");
  const { declarations, parseRules, readStylesheet, styleRules } = await import("./support/css.mjs");
  const { color, composite, contrastRatio } = await import("./support/contrast.mjs");
  const rules = styleRules(parseRules(readStylesheet("components.css")));
  const rule = (prelude) => {
    // Every rule with this exact selector, in source order (later declarations win, as in the cascade).
    const found = rules.filter((candidate) => candidate.prelude === prelude && candidate.context.length === 0);
    assert.ok(found.length > 0, `missing rule ${prelude}`);
    return Object.fromEntries(found.flatMap((candidate) => declarations(candidate.body)));
  };
  const cells = rule(".sui-data-table th, .sui-data-table td");
  assert.equal(cells["text-align"], "start", "headers are not browser-centred");
  assert.match(cells.padding, /^\d+px \d+px$/);
  assert.match(cells["border-bottom"], /var\(--sui-line\)/);
  const head = rule(".sui-data-table thead th");
  const hover = rule(".sui-data-table tbody tr:hover > td");
  const token = (value) => /var\((--sui-[\w-]+)\)/.exec(value)[1];
  for (const theme of SUI_THEMES) {
    const headGround = color(token(head.background), theme);
    assert.equal(headGround.a, 1, `${theme}: the sticky header surface is opaque, so scrolled rows do not show through`);
    const headRatio = contrastRatio(color(token(head.color), theme), headGround.a === 1 ? headGround : composite(headGround, color("--sui-bg", theme)));
    assert.ok(headRatio >= 4.5, `${theme}: header text ${headRatio.toFixed(2)}:1`);
    for (const page of ["--sui-bg", "--sui-panel", "--sui-card"]) {
      const raw = color(page, theme);
      const ground = raw.a === 1 ? raw : composite(raw, color("--sui-bg", theme)); // translucent surfaces sit on the page
      const rows = [ground, composite(color(token(hover.background), theme), ground)];
      for (const row of rows) {
        const ratio = contrastRatio(color(token(cells.color), theme), row);
        assert.ok(ratio >= 4.5, `${theme}: cell text on ${page} ${ratio.toFixed(2)}:1`);
      }
    }
  }
});
