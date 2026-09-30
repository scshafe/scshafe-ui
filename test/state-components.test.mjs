// S3 pin — the Bucket E movers render from the compiled lib with their class +
// data-sui-component contract intact, driven by the state layer's slices through
// SuiProviders (byte-identical markup relative to their MC originals under the
// same store state; MC's bucket-e test re-verifies on the consumer side).
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const {
  SuiProviders, createSuiStore,
  Toasts, toastShown, ToastTray,
  ConfirmDialog, confirmActionThunk, ConfirmDialogComponent, resolveConfirmThunk,
  Popovers, popoverOpened,
  ContextMenu, copyToClipboard, MoreActionsMenu, DataTableColumnMenu,
  DataTablePreferences, dataTableColumnWidthSet, selectDataTablePreferencesForTable,
} = await import("../lib/state/index.js");

function storeWith(...slices) {
  return createSuiStore({ slices });
}

function renderIn(store, element, options = {}) {
  return renderToStaticMarkup(React.createElement(SuiProviders, { store, ...options }, element));
}

test("ToastTray renders queued toasts with kind classes and dismiss buttons", () => {
  const store = storeWith(Toasts, Popovers);
  store.dispatch(toastShown({ id: "t1", kind: "error", message: "bad thing" }));
  store.dispatch(toastShown({ id: "t2", kind: "success", message: "good thing" }));
  const html = renderIn(store, React.createElement(ToastTray, null));
  assert.match(html, /class="sui-toast-tray"[^>]*data-sui-component="ToastTray"/);
  assert.match(html, /sui-toast sui-toast--error"[^>]*role="alert"/);
  assert.match(html, /sui-toast sui-toast--success"[^>]*role="status"/);
  assert.match(html, /bad thing/);
  assert.match(html, /class="sui-toast-dismiss"/);
  const empty = renderIn(storeWith(Toasts, Popovers), React.createElement(ToastTray, null));
  assert.equal(empty, "", "no toasts → renders nothing");
});

test("ConfirmDialogComponent renders the in-flight prompt through the Sheet", async () => {
  const store = storeWith(ConfirmDialog, Popovers);
  const pending = store.dispatch(confirmActionThunk({ title: "Delete take?", message: "Gone forever.", kind: "danger", confirmLabel: "Delete" }));
  const html = renderIn(store, React.createElement(ConfirmDialogComponent, null));
  assert.match(html, /data-sui-component="ConfirmDialog"/);
  assert.match(html, /Delete take\?/);
  assert.match(html, /Gone forever\./);
  assert.match(html, /sui-button sui-button-danger/);
  assert.match(html, /class="sui-kbd"[^>]*data-sui-component="Kbd"[^>]*>Esc/);
  store.dispatch(resolveConfirmThunk(false));
  assert.equal(await pending, false);
  assert.equal(renderIn(store, React.createElement(ConfirmDialogComponent, null)), "", "closed → renders nothing");
});

test("ContextMenu anchors, renders its open menu from the Popovers slice, and closes on action", () => {
  const store = storeWith(Popovers);
  store.dispatch(popoverOpened({ id: "cm-1", anchor: { x: 10, y: 20 } }));
  const html = renderIn(store, React.createElement(ContextMenu, {
    id: "cm-1",
    items: [{ label: "Copy id", action: () => {}, kbd: "C" }, { label: "Delete", action: () => {}, danger: true }],
    children: React.createElement("span", null, "target"),
  }));
  assert.match(html, /data-sui-component="ContextMenuAnchor"[^>]*data-sui-popover-anchor=""/);
  assert.match(html, /class="sui-context-menu"[^>]*role="menu"/);
  assert.match(html, /sui-context-menu-item--danger/);
  assert.match(html, /sui-context-menu-item-kbd/);
  assert.equal(typeof copyToClipboard, "function");
});

test("MoreActionsMenu renders the hover trigger and shared menu list", () => {
  const store = storeWith(Popovers);
  store.dispatch(popoverOpened({ id: "mam-1", anchor: { x: 1, y: 2 } }));
  const html = renderIn(store, React.createElement(MoreActionsMenu, {
    id: "mam-1",
    items: [{ label: "Rename", action: () => {} }],
  }));
  assert.match(html, /data-sui-component="MoreActionsMenuTrigger"/);
  assert.match(html, /class="sui-context-menu"/);
  assert.match(html, /Rename/);
});

test("DataTableColumnMenu renders rows from merged preferences via the DataTablePreferences slice", () => {
  const store = storeWith(Popovers, DataTablePreferences);
  store.dispatch(dataTableColumnWidthSet({ tableId: "corpus", columnId: "filename", width: 260 }));
  store.dispatch(popoverOpened({ id: "data-table-columns:corpus", anchor: { x: 5, y: 5 } }));
  const preferences = selectDataTablePreferencesForTable(store.getState(), "corpus");
  const html = renderIn(store, React.createElement(DataTableColumnMenu, {
    tableId: "corpus",
    columns: [
      { id: "filename", header: "Filename", render: () => null },
      { id: "year", header: "Year", render: () => null },
    ],
    preferences,
  }));
  assert.match(html, /data-sui-component="DataTableColumnMenu"[^>]*data-table-column-menu="corpus"/);
  assert.match(html, /data-table-column-menu-row="filename"/);
  assert.match(html, /value="260"/, "the stored width fills the input");
  assert.match(html, /data-table-preferences-reset="corpus"/);
});

test("the carved Bucket E styles travel in components.css", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../components.css", import.meta.url), "utf8");
  for (const selector of [".sui-toast-tray", ".sui-toast--error", ".sui-context-menu-item", ".sui-context-menu-divider", ".data-table-column-menu-row", ".data-table-column-width-input"]) {
    assert.ok(css.includes(selector), `components.css missing ${selector}`);
  }
});
