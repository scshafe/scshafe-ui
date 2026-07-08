import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";
/**
 * Atomic form label. Renders a <label> element with consistent typography
 * and an optional required marker. Pairs with Description below it and a
 * field control beside it.
 *
 * Props:
 *  - htmlFor: id of the form control this label is for
 *  - children: label text
 *  - required: when true, append a visual required marker
 *  - tooltip: tooltip metadata object or string
 */
export function Label({ htmlFor = null, children, required = false, tooltip = null }) {
    const defaultTooltip = {
        component: "Label",
        layer: "primitive",
        description: "Atomic form label that pairs with a Description and a field control.",
        values: { required }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, children: _jsxs("label", { htmlFor: htmlFor ?? undefined, className: "mc-label", "data-mc-component": "Label", children: [children, required ? _jsx("span", { className: "mc-label-required", "aria-hidden": "true", children: " *" }) : null] }) });
}
