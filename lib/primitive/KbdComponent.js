import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
export function Kbd({ children, keys, ariaLabel }) {
    if (keys && keys.length > 0) {
        const label = ariaLabel ?? keys.join(" + ");
        return (_jsx("span", { className: "mc-kbd-combo", "data-mc-component": "Kbd", "aria-label": label, children: keys.map((key, index) => (_jsx("kbd", { className: "mc-kbd", children: key }, `${key}:${index}`))) }));
    }
    return (_jsx("kbd", { className: "mc-kbd", "data-mc-component": "Kbd", "aria-label": ariaLabel, children: children }));
}
