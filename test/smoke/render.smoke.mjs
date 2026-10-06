// Packed-install smoke: react-dom/server renders components from the installed
// package, and the markup carries the data-sui-component markers, sui-
// classes, icons and store state.
import React from "react";
import { renderToString } from "react-dom/server";
import { Banner, Button, CheckboxField, EmptyState, Stack, Status, InputField } from "@scshafe/ui";
import { SuiProviders, ToastTray, Toasts, Popovers, createSuiStore } from "@scshafe/ui/state";
import { DefaultIconProvider } from "@scshafe/ui/icons";

const h = React.createElement;
const store = createSuiStore({ slices: [Toasts, Popovers], preloadedState: { Toasts: { items: [{ id: "t1", kind: "info", message: "Saved" }] } } });
const html = renderToString(
  h(SuiProviders, { store },
    h(DefaultIconProvider, null,
      h(Stack, { gap: "md" },
        h(Status, { state: "running" }),
        h(InputField, { id: "name", label: "Name", value: "", onChange() {} }),
        h(CheckboxField, { id: "notify", label: "Notify me", checked: true, onChange() {} }),
        h(Banner, { tone: "warn", title: "Held", text: "Paused.", dismissible: true }),
        h(Button, { label: "Save", icon: "action.copy", variant: "primary" }),
        h(EmptyState, { message: "Nothing here yet." })),
      h(ToastTray))));
for (const marker of ["Stack", "Status", "InputField", "CheckboxField", "Banner", "Button", "EmptyState", "ToastTray"]) {
  if (!html.includes('data-sui-component="' + marker + '"')) {
    throw new Error("rendered markup lacks data-sui-component=" + marker + ": " + html.slice(0, 400));
  }
}
if (!/class="sui-stack/.test(html) || !/<svg/.test(html) || !html.includes("Saved")) {
  throw new Error("rendered markup lacks sui- classes, icons or store state");
}
if (/data-mc-|\bmc-/.test(html)) throw new Error("rendered markup carries the mc namespace");
console.log("React render smoke passed (" + html.length + " bytes of markup).");
