import React from "react";
import { IconContext, type IconRenderer } from "../widget/IconContext.js";
import { Icon } from "./IconComponent.js";

// L4 — the packaged answer to MC's McIconProvider: feed the shipped registry
// into the IconContext seam so every icon-consuming component (Button / Tab /
// HoverButton / ContextMenu / …) renders glyphs with zero host code.
//
//   <McProviders store={store} icons={renderDefaultIcon}>…</McProviders>
//   // or, store-free:
//   <DefaultIconProvider><App /></DefaultIconProvider>

export const renderDefaultIcon: IconRenderer = (name, props = {}) => <Icon name={name} {...props} />;

export function DefaultIconProvider({ children }: { children: React.ReactNode }) {
  return <IconContext.Provider value={renderDefaultIcon}>{children}</IconContext.Provider>;
}
