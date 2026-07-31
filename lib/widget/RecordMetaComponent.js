import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { timestamp } from "../format.js";
import { Tooltip } from "./TooltipComponent.js";
export function reactMetaEntry(label, value) {
    if (value === undefined || value === null || value === "")
        return null;
    return { label, value: typeof value === "object" ? JSON.stringify(value) : String(value) };
}
export function reactTimeMetaEntry(label, value) {
    if (value === undefined || value === null || value === "")
        return null;
    return { label, value: timestamp(value) };
}
/** @param {{ entries?: any, tooltip?: any }} props */
export function RecordMeta({ entries, tooltip }) {
    const filtered = (entries ?? []).filter(Boolean);
    const defaultTooltip = {
        component: "RecordMeta",
        layer: "widget",
        description: "Metadata pill list for provenance and record details.",
        values: { entries: filtered.length }
    };
    if (filtered.length === 0)
        return null;
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsx("div", { className: "card-meta", "data-mc-component": "RecordMeta", "aria-label": "Record provenance", children: filtered.map((entry, index) => _jsxs("span", { className: "meta-pill", children: [_jsx("span", { children: entry.label }), entry.value] }, `${entry.label}:${index}`)) }) });
}
