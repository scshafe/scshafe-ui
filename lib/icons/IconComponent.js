import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { FALLBACK_ICON_COMPONENT, iconComponentFor } from "./iconRegistry.js";
export function Icon({ name, size = 16, strokeWidth = 1.7, className, "aria-label": ariaLabel, title, ...rest }) {
    const Component = iconComponentFor(name) ?? FALLBACK_ICON_COMPONENT;
    const a11y = ariaLabel
        ? { role: "img", "aria-label": ariaLabel }
        : { "aria-hidden": "true", focusable: "false" };
    return _jsx(Component, { width: size, height: size, strokeWidth: strokeWidth, className: className, ...a11y, ...rest, children: title ? _jsx("title", { children: title }) : null });
}
