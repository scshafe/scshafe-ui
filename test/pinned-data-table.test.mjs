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
