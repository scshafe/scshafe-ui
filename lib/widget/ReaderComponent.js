import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Tooltip } from "./TooltipComponent.js";
/**
 * Read-only detail surface. Assembles Title + optional Description +
 * arbitrary content (typically MarkdownContent or a list of facts) into
 * a consistent reader card. Use Reader for entity detail views (plan
 * detail, project overview block, thought detail) and Editor for the
 * matching mutation form.
 *
 * Props:
 *  - title: heading text (rendered as a Title primitive)
 *  - titleLevel: 1-6 for the heading tag (default 3)
 *  - description: optional helper text under the title
 *  - actions: optional node rendered on the right side of the header
 *  - children: the body content (MarkdownContent, lists, tables, …)
 *  - tooltip: tooltip metadata object or string
 */
export function Reader({ title = null, titleLevel = 3, description = null, actions = null, children, tooltip = null }) {
    const defaultTooltip = {
        component: "Reader",
        layer: "widget",
        description: "Read-only detail composite assembled from Title + Description + body content.",
        values: { title: title ?? "none", titleLevel, hasDescription: Boolean(description), hasActions: Boolean(actions) }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsxs("section", { className: "mc-reader", "data-mc-component": "Reader", children: [title || actions ? (_jsxs("header", { className: "mc-reader-header", children: [_jsxs("div", { className: "mc-reader-heading", children: [title ? _jsx(Title, { level: titleLevel, children: title }) : null, description ? _jsx(Description, { children: description }) : null] }), actions ? _jsx("div", { className: "mc-reader-actions", children: actions }) : null] })) : null, _jsx("div", { className: "mc-reader-body", children: children })] }) });
}
