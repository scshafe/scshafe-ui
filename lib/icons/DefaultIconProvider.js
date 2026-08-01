import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { IconContext } from "../widget/IconContext.js";
import { Icon } from "./IconComponent.js";
// L4 — the packaged answer to MC's McIconProvider: feed the shipped registry
// into the IconContext seam so every icon-consuming component (Button / Tab /
// HoverButton / ContextMenu / …) renders glyphs with zero host code.
//
//   <McProviders store={store} icons={renderDefaultIcon}>…</McProviders>
//   // or, store-free:
//   <DefaultIconProvider><App /></DefaultIconProvider>
export const renderDefaultIcon = (name, props = {}) => _jsx(Icon, { name: name, ...props });
export function DefaultIconProvider({ children }) {
    return _jsx(IconContext.Provider, { value: renderDefaultIcon, children: children });
}
