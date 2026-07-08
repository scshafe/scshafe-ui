import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";
const LEVELS = new Set([1, 2, 3, 4, 5, 6]);
function tagForLevel(level) {
    return LEVELS.has(level) ? `h${level}` : "h3";
}
/**
 * Atomic title primitive. Renders the appropriate semantic heading tag
 * (h1-h6) with consistent typography. Cards, Panels, and Readers
 * compose Title + Description; this keeps the title styling consistent
 * across them.
 *
 * Props:
 *  - children: title text
 *  - level: 1-6, default 3 (h3 — typical card / section heading)
 *  - tooltip: tooltip metadata object or string
 */
export function Title({ children, level = 3, tooltip = null }) {
    const Tag = tagForLevel(level);
    const defaultTooltip = {
        component: "Title",
        layer: "primitive",
        description: "Semantic heading text; level chooses the h1-h6 tag without changing the visual style scale globally.",
        values: { level }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, children: _jsx(Tag, { className: `mc-title mc-title-h${level}`, "data-mc-component": "Title", "data-mc-level": level, children: children }) });
}
