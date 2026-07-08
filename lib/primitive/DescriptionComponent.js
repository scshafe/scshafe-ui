import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";
/**
 * Helper / descriptive text primitive. Pairs with Label above and a field
 * control beside; also used standalone under section Titles or inside
 * Cards.
 *
 * Props:
 *  - children: descriptive text
 *  - tone: default | muted (default "muted")
 *  - tooltip: tooltip metadata object or string
 */
export function Description({ children, tone = "muted", tooltip = null }) {
    const defaultTooltip = {
        component: "Description",
        layer: "primitive",
        description: "Short helper or contextual text shown next to a Title, Label, or field.",
        values: { tone }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, children: _jsx("p", { className: `mc-description mc-description-${tone}`, "data-mc-component": "Description", children: children }) });
}
