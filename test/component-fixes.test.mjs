// 0.9.1 — component behaviour the review found wrong: Status's developer metadata shown as a
// tooltip, a column width that could not be typed, Copyable claiming a copy that did not happen,
// a danger confirm focused on its destructive button, MarkdownEditor's handle on React 18, and
// protocol-relative links in MarkdownContent.
import assert from "node:assert/strict";
import test from "node:test";
import { installDom, render } from "./support/dom.mjs";

installDom();
const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const ui = await import("@scshafe/ui");
const state = await import("@scshafe/ui/state");
const { useSelector } = await import("react-redux");

const h = React.createElement;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("Status renders no tooltip unless one is passed; its metadata is the developer-mode fallback", () => {
  const plain = renderToStaticMarkup(h(ui.Status, { state: "running" }));
  assert.doesNotMatch(plain, /sui-tooltip/, "no hover-card wrapper by default");
  assert.match(plain, /^<span class="sui-badge sui-badge--green"[^>]*data-sui-component="Status"/);
  const withTooltip = renderToStaticMarkup(h(ui.Status, { state: "running", tooltip: "Started 9:00" }));
  assert.match(withTooltip, /class="sui-tooltip"/, "a tooltip the host passes still shows");
  const card = renderToStaticMarkup(h(ui.StatCount, { state: "running", count: 3 }));
  assert.doesNotMatch(card, /sui-tooltip/, "StatCount inherits the fix");
});

test("DataTableColumnMenu: the width field keeps what is typed and commits on Enter or leaving it", async () => {
  const store = state.createSuiStore({ slices: [state.DataTablePreferences, state.Popovers] });
  store.dispatch(state.popoverOpened({ id: "data-table-columns:files", anchor: { x: 5, y: 5 } }));
  const columns = [{ id: "name", header: "Name", width: 200, render: (row) => row.name }];
  function Menu() {
    const preferences = useSelector((root) => state.selectDataTablePreferencesForTable(root, "files"));
    return h(state.DataTableColumnMenu, { tableId: "files", columns, preferences });
  }
  const view = await render(h(state.SuiProviders, { store }, h(Menu)));
  const widthOf = () => state.selectDataTablePreferencesForTable(store.getState(), "files")?.widthsByColumnId?.name;
  const input = () => view.container.querySelector(".sui-data-table-column-width-input");
  const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  const type = async (text) => {
    for (let end = 1; end <= text.length; end += 1) {
      await React.act(async () => {
        setValue.call(input(), text.slice(0, end));
        input().dispatchEvent(new window.Event("input", { bubbles: true }));
      });
    }
  };
  try {
    input().focus();
    await type("180");
    assert.equal(input().value, "180", "the draft is not clamped while typing");
    assert.equal(widthOf(), undefined, "nothing is stored before the commit");
    await React.act(async () => { input().dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
    assert.equal(widthOf(), 180, "Enter commits");
    await type("3");
    await React.act(async () => { input().blur(); });
    assert.equal(widthOf(), 48, "leaving the field commits; the store clamps to the minimum");
    assert.equal(input().value, "48", "the field shows the stored width after a commit");
    input().focus();
    await React.act(async () => {
      setValue.call(input(), "");
      input().dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    await React.act(async () => { input().blur(); });
    assert.equal(widthOf(), undefined, "an emptied field resets to the column's default");
  } finally {
    await view.unmount();
  }
});

test("Copyable shows and announces success only when the clipboard write succeeds", async () => {
  const view = await render(h(ui.Copyable, { value: "agent-server", kind: "slug" }, "agent-server"));
  const token = view.container.querySelector("[data-sui-component=Copyable]");
  const region = () => document.querySelector("[data-sui-live-region=copyable]");
  try {
    assert.equal(navigator.clipboard, undefined, "jsdom has no clipboard, like a plain-HTTP origin");
    await React.act(async () => { token.click(); });
    assert.equal(token.dataset.suiCopied, "false", "no clipboard: the failure state, not the success flash");
    await wait(150);
    assert.equal(region().getAttribute("role"), "status");
    assert.equal(region().getAttribute("aria-live"), "polite");
    assert.match(region().className, /sui-visually-hidden/);
    assert.equal(region().textContent, "Could not copy");

    const written = [];
    Object.defineProperty(window.navigator, "clipboard", { configurable: true, value: { writeText: async (text) => { written.push(text); } } });
    await wait(800);
    await React.act(async () => { token.click(); });
    assert.deepEqual(written, ["agent-server"]);
    assert.equal(token.dataset.suiCopied, "true");
    await wait(80);
    assert.equal(region().textContent, "Copied");

    Object.defineProperty(window.navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } });
    await wait(800);
    await React.act(async () => { token.click(); });
    assert.equal(token.dataset.suiCopied, "false", "a refused write is a failure");
  } finally {
    delete window.navigator.clipboard;
    await view.unmount();
  }
});

test("ConfirmDialog focuses Cancel for a danger prompt and the confirm button otherwise", async () => {
  const store = state.createSuiStore({ slices: [state.ConfirmDialog, state.Popovers] });
  const view = await render(h(state.SuiProviders, { store }, h(state.ConfirmDialogComponent)));
  try {
    await React.act(async () => { void store.dispatch(state.confirmActionThunk({ title: "Delete plan?", confirmLabel: "Delete", cancelLabel: "Cancel", kind: "danger" })); });
    assert.match(document.activeElement?.textContent ?? "", /^Cancel/, "Enter right away does not delete");
    await React.act(async () => { void store.dispatch(state.resolveConfirmThunk(false)); });
    await React.act(async () => { void store.dispatch(state.confirmActionThunk({ title: "Archive plan?", confirmLabel: "Archive", cancelLabel: "Cancel" })); });
    assert.equal(document.activeElement?.textContent, "Archive");
    await React.act(async () => { void store.dispatch(state.resolveConfirmThunk(false)); });
  } finally {
    await view.unmount();
  }
});

test("MarkdownEditor forwards its ref, so the handle attaches on React 18 as well as 19", async () => {
  const { MarkdownEditor } = await import("@scshafe/ui/editor");
  assert.equal(MarkdownEditor.$$typeof, Symbol.for("react.forward_ref"), "a forwardRef component, not a ref prop");
  const ref = React.createRef();
  const view = await render(h(MarkdownEditor, { ref, ariaLabel: "Message", initialValue: "hi" }));
  try {
    for (const method of ["clear", "setContent", "getMarkdown", "focus"]) assert.equal(typeof ref.current?.[method], "function", method);
  } finally {
    await view.unmount();
  }
});

test("MarkdownContent links: a protocol-relative or backslash host is text, a path is a link", () => {
  const markup = renderToStaticMarkup(h(ui.MarkdownContent, { value: "[a](//elsewhere.example/x) [b](/inbox) [c](/\\elsewhere.example) [d](\\\\elsewhere.example) [e](https://example.test/)" }));
  const hrefs = [...markup.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
  assert.deepEqual(hrefs, ["/inbox", "https://example.test/"]);
});
