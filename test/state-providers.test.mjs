// S1 pin — McProviders/RtkPopoverProvider feed the SAME injected contexts the
// components read (PopoverControllerContext + IconContext + DevUxContext), backed
// by the Popovers slice. Server-rendered against the committed lib artifact.
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { PopoverControllerContext, useIcon, Tooltip } = await import("../lib/index.js");
const { McProviders, createMcStore, Popovers, popoverOpened } = await import("../lib/state/index.js");

function ControllerProbe() {
  const controller = React.useContext(PopoverControllerContext);
  return React.createElement("span", { "data-open-id": controller.openId ?? "none" }, "probe");
}

function IconProbe() {
  const renderIcon = useIcon();
  return React.createElement("span", null, renderIcon("action.test", { size: 14 }));
}

test("McProviders wires the popover controller to the Popovers slice", () => {
  const store = createMcStore({ slices: [Popovers] });
  store.dispatch(popoverOpened({ id: "menu-1", anchor: { x: 10, y: 20 } }));
  const html = renderToStaticMarkup(
    React.createElement(McProviders, { store },
      React.createElement(ControllerProbe, null))
  );
  assert.match(html, /data-open-id="menu-1"/, "the controller reads openId from the slice");
});

test("McProviders renders package components (Tooltip family) without extra setup", () => {
  const store = createMcStore({ slices: [Popovers] });
  const html = renderToStaticMarkup(
    React.createElement(McProviders, { store },
      React.createElement(Tooltip, { tooltip: "hi", as: "div" },
        React.createElement("button", null, "hover me")))
  );
  assert.match(html, /hover me/);
  assert.match(html, /data-mc-component="HoverCard"|mc-tooltip/, "Tooltip renders through the injected controller");
});

test("McProviders injects the icon renderer only when provided", () => {
  const store = createMcStore({ slices: [Popovers] });
  const withIcons = renderToStaticMarkup(
    React.createElement(McProviders, { store, icons: (name, props) => React.createElement("i", { "data-icon": name, "data-size": props?.size }) },
      React.createElement(IconProbe, null))
  );
  assert.match(withIcons, /data-icon="action\.test"/);
  assert.match(withIcons, /data-size="14"/);
  const withoutIcons = renderToStaticMarkup(
    React.createElement(McProviders, { store }, React.createElement(IconProbe, null))
  );
  assert.equal(withoutIcons.includes("data-icon"), false, "no renderer → the no-op default renders nothing");
});
