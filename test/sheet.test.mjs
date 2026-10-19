// 0.6.1 — Sheet opens as a modal whenever its `open` prop turns true, not only when it mounts
// open: a host may keep the Sheet mounted and flip the prop. Closed, it renders nothing.
import assert from "node:assert/strict";
import test from "node:test";
import { installDom, render } from "./support/dom.mjs";

installDom();
const React = await import("react");
const ui = await import("@scshafe/ui");

const h = React.createElement;

// Count showModal calls; jsdom's dialog (native or the support polyfill) sets `open`.
const proto = window.HTMLDialogElement.prototype;
const nativeShowModal = proto.showModal;
let showModalCalls = 0;
proto.showModal = function showModal() { showModalCalls += 1; return nativeShowModal.call(this); };

function sheet(open, onClose = () => {}) {
  return h(ui.Sheet, { open, onClose, ariaLabel: "Plan settings" }, h(ui.SheetBody, null, h("p", null, "Body")));
}

test("Sheet mounted closed opens as a modal when its open prop flips to true", async () => {
  let setOpen;
  function Host() {
    const [open, set] = React.useState(false);
    setOpen = set;
    return sheet(open);
  }
  showModalCalls = 0;
  const view = await render(h(Host));
  try {
    assert.equal(view.container.querySelector("dialog"), null, "closed → renders nothing");
    await React.act(async () => { setOpen(true); });
    const dialog = view.container.querySelector("dialog.sui-sheet");
    assert.ok(dialog, "open → the dialog is rendered");
    assert.equal(dialog.open, true, "the dialog is opened");
    assert.equal(showModalCalls, 1, "as a modal");
    await React.act(async () => { setOpen(false); });
    assert.equal(view.container.querySelector("dialog"), null, "closed again → unmounted");
    await React.act(async () => { setOpen(true); });
    assert.equal(view.container.querySelector("dialog.sui-sheet").open, true, "reopens");
    assert.equal(showModalCalls, 2);
  } finally {
    await view.unmount();
  }
});

test("Sheet mounted open opens once, and re-renders do not call showModal again", async () => {
  let rerender;
  function Host() {
    const [, set] = React.useState(0);
    rerender = () => set((n) => n + 1);
    return sheet(true);
  }
  showModalCalls = 0;
  const view = await render(h(Host));
  try {
    assert.equal(view.container.querySelector("dialog.sui-sheet").open, true);
    await React.act(async () => { rerender(); });
    assert.equal(showModalCalls, 1);
  } finally {
    await view.unmount();
  }
});

test("Sheet: Escape (the cancel event) asks the host to close instead of closing itself", async () => {
  let closes = 0;
  const view = await render(sheet(true, () => { closes += 1; }));
  try {
    const dialog = view.container.querySelector("dialog.sui-sheet");
    const cancel = new window.Event("cancel", { cancelable: true });
    await React.act(async () => { dialog.dispatchEvent(cancel); });
    assert.equal(cancel.defaultPrevented, true, "the dialog stays open until the host closes it");
    assert.equal(closes, 1);
  } finally {
    await view.unmount();
  }
});
