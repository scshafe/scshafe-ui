// A jsdom browser for the component tests: installs the window's globals so
// react-dom/client renders into it, loads the package stylesheets (jsdom
// cascades custom properties, :where() and :focus-visible), and polyfills the
// few APIs jsdom lacks. Each test file runs in its own process (node --test),
// so the globals never leak between files.
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const STYLESHEETS = ["tokens.css", "layout.css", "components.css"];

export function installDom({ stylesheets = STYLESHEETS } = {}) {
  const css = stylesheets.map((name) => readFileSync(new URL(`../../${name}`, import.meta.url), "utf8")).join("\n");
  const dom = new JSDOM(`<!doctype html><html lang="en"><head><title>@scshafe/ui test</title><style>${css}</style></head><body></body></html>`, {
    pretendToBeVisual: true,
    url: "https://app.example.test/"
  });
  const { window } = dom;
  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in globalThis || key.startsWith("_")) continue;
    Object.defineProperty(globalThis, key, { configurable: true, get: () => window[key] });
  }
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? window : window[key] });
  }
  // jsdom has no modal dialogs: showModal/close toggle the open attribute.
  const dialog = window.HTMLDialogElement.prototype;
  if (typeof dialog.showModal !== "function") {
    dialog.showModal = function showModal() { this.setAttribute("open", ""); };
    dialog.show = function show() { this.setAttribute("open", ""); };
    dialog.close = function close() { this.removeAttribute("open"); this.dispatchEvent(new window.Event("close")); };
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

/** Render `element` into a fresh container; returns { container, unmount }. */
export async function render(element) {
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => { root.render(element); });
  return {
    container,
    async unmount() {
      await React.act(async () => { root.unmount(); });
      container.remove();
    }
  };
}
