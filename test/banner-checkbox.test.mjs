// 0.5.0 — CheckboxField and Banner, React and server-rendered. The marker parity of the two
// flavours is in ssr.test.mjs and their axe, keyboard and namespace checks run over the catalog;
// this file pins behaviour: checkbox state and its description, the banner's tones, roles,
// dismissing (a button in React, a link on the server) and controlled visibility.
import assert from "node:assert/strict";
import test from "node:test";
import { installDom, render } from "./support/dom.mjs";

installDom();
const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const ui = await import("@scshafe/ui");
const ssr = await import("@scshafe/ui/ssr");

const h = React.createElement;

async function click(element) {
  await React.act(async () => { element.click(); });
}

test("CheckboxField: controlled onChange gets the new boolean; the label toggles it", async () => {
  const calls = [];
  function Host() {
    const [checked, setChecked] = React.useState(false);
    return h(ui.CheckboxField, { id: "notify", label: "Notify me", checked, onChange: (next, event) => { calls.push([next, event.type]); setChecked(next); } });
  }
  const view = await render(h(Host));
  try {
    const input = view.container.querySelector("input[type=checkbox]");
    const label = view.container.querySelector("label.sui-checkbox-field-label");
    assert.equal(label.htmlFor, "notify");
    assert.equal(input.labels[0], label, "the label names the checkbox");
    assert.equal(input.checked, false);
    await click(label);
    assert.equal(input.checked, true);
    await click(input);
    assert.equal(input.checked, false);
    assert.deepEqual(calls, [[true, "change"], [false, "change"]]);
  } finally {
    await view.unmount();
  }
});

test("CheckboxField: without onChange it is an uncontrolled form field with its initial state", async () => {
  const view = await render(h("form", null, h(ui.CheckboxField, { id: "a", label: "Archive", name: "archive", value: "yes", checked: true })));
  try {
    const form = view.container.querySelector("form");
    const input = form.querySelector("input");
    assert.deepEqual([...new window.FormData(form)], [["archive", "yes"]]);
    await click(input);
    assert.equal(input.checked, false, "the user can still toggle it");
    assert.deepEqual([...new window.FormData(form)], []);
  } finally {
    await view.unmount();
  }
});

test("CheckboxField: description, required and aria-describedby", () => {
  const markup = renderToStaticMarkup(h(ui.CheckboxField, { id: "c", label: "Agree", description: "Read the terms first.", required: true, "aria-describedby": "terms" }));
  assert.match(markup, /aria-describedby="terms c-description"/);
  assert.match(markup, /<span class="sui-checkbox-field-description" id="c-description">Read the terms first\.<\/span>/);
  assert.match(markup, /required=""/);
  assert.match(markup, /<span class="sui-checkbox-field-required" aria-hidden="true"> \*<\/span>/);
  const plain = renderToStaticMarkup(h(ui.CheckboxField, { id: "p", label: "Plain" }));
  assert.doesNotMatch(plain, /aria-describedby|sui-checkbox-field-description|checked=/);
  assert.equal(String(ssr.checkboxField({ id: "p", label: "Plain" })), '<div class="sui-checkbox-field" data-sui-component="CheckboxField"><input id="p" type="checkbox" class="sui-checkbox-field-input"/><label class="sui-checkbox-field-label" for="p">Plain</label></div>');
});

test("Banner: tones map to colour classes, glyphs, hidden prefixes and roles", () => {
  const expected = { info: ["status", "Information", "i"], ok: ["status", "Success", "✓"], warn: ["alert", "Warning", "!"], danger: ["alert", "Error", "!"] };
  assert.deepEqual([...ui.BANNER_TONES], Object.keys(expected));
  for (const [tone, [role, prefix, mark]] of Object.entries(expected)) {
    for (const markup of [renderToStaticMarkup(h(ui.Banner, { tone, text: "Message" })), String(ssr.banner({ tone, text: "Message" }))]) {
      assert.match(markup, new RegExp(`^<div class="sui-banner sui-banner--${tone}" role="${role}" data-sui-component="Banner" data-sui-tone="${tone}">`));
      assert.match(markup, new RegExp(`<span class="sui-banner-mark" aria-hidden="true">${mark}</span>`));
      assert.match(markup, new RegExp(`<span class="sui-visually-hidden">${prefix}: </span><div class="sui-banner-text">Message</div>`));
    }
  }
  assert.equal(ui.bannerTone("loud"), "info");
  assert.throws(() => ssr.banner({ text: "x", role: "log" }), /role must be one of/);
});

test("Banner (React): Dismiss hides it and calls onDismiss; a controlled banner asks the host", async () => {
  let dismissed = 0;
  const view = await render(h(ui.Banner, { tone: "ok", text: "Saved.", dismissible: true, dismissLabel: "Close notice", onDismiss: () => { dismissed += 1; } }));
  try {
    const button = view.container.querySelector("button.sui-banner-dismiss");
    assert.equal(button.getAttribute("aria-label"), "Close notice");
    assert.equal(button.type, "button", "never submits a surrounding form");
    await click(button);
    assert.equal(view.container.querySelector("[data-sui-component=Banner]"), null);
    assert.equal(dismissed, 1);
  } finally {
    await view.unmount();
  }

  const log = [];
  function Host() {
    const [open, setOpen] = React.useState(true);
    return h(ui.Banner, { open, text: "Held.", dismissible: true, onDismiss: () => { log.push("dismiss"); setOpen(false); } });
  }
  const controlled = await render(h(Host));
  try {
    await click(controlled.container.querySelector("button.sui-banner-dismiss"));
    assert.deepEqual(log, ["dismiss"]);
    assert.equal(controlled.container.innerHTML, "");
  } finally {
    await controlled.unmount();
  }
  assert.equal(renderToStaticMarkup(h(ui.Banner, { open: false, text: "x" })), "");
  assert.doesNotMatch(renderToStaticMarkup(h(ui.Banner, { text: "x" })), /sui-banner-dismiss/);
});

test("Banner (server): Dismiss is a link to where the notice is gone; no script, no style", () => {
  const markup = String(ssr.banner({ tone: "warn", title: "Endpoint held", text: "Paused.", dismissHref: "/endpoints?view=all" }));
  assert.match(markup, /<a class="sui-banner-dismiss" href="\/endpoints\?view=all" aria-label="Dismiss">×<\/a><\/div>$/);
  assert.match(String(ssr.banner({ text: "x", dismissHref: "javascript:alert(1)" })), /href="#"/);
  assert.doesNotMatch(markup, /\sstyle=|<script|\son[a-z]+=/i);
  assert.doesNotMatch(String(ssr.banner({ text: "x" })), /sui-banner-dismiss/);
  assert.doesNotMatch(String(ssr.banner({ text: "x", title: "" })), /sui-banner-title/);
});
