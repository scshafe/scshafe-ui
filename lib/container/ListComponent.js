import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { EmptyState } from "../widget/EmptyStateComponent.js";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Tooltip } from "../widget/TooltipComponent.js";
/**
 * Container for a sequence of list rows (typically ListRow). Composes a
 * Title + Description header, an empty state fallback, and the children
 * wrapped in a single class so call sites stop reinventing the markup.
 *
 * Props:
 *  - title: optional list heading
 *  - description: optional list description
 *  - count: optional count shown in the header
 *  - empty: { title, description } for the EmptyState shown when children is empty
 *  - actions: optional node rendered on the right of the header
 *  - children: ListRow elements (or any rows)
 *  - tooltip: tooltip metadata object or string
 */
export function List({ title = null, description = null, count = null, empty = null, actions = null, children, tooltip = null }) {
    const childArray = React.Children.toArray(children).filter(Boolean);
    const hasItems = childArray.length > 0;
    const defaultTooltip = {
        component: "List",
        layer: "container",
        description: "Container for a sequence of ListRow items with header + empty-state support.",
        values: { title: title ?? "none", count: count ?? childArray.length, hasItems }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsxs("section", { className: "mc-list", "data-mc-component": "List", children: [title || actions ? (_jsxs("header", { className: "mc-list-header", children: [_jsxs("div", { className: "mc-list-heading", children: [title ? _jsx(Title, { level: 4, children: count !== null ? `${title} (${count})` : title }) : null, description ? _jsx(Description, { children: description }) : null] }), actions ? _jsx("div", { className: "mc-list-actions", children: actions }) : null] })) : null, hasItems ? (_jsx("div", { className: "mc-list-items", children: children })) : empty ? (_jsx(EmptyState, { title: empty.title ?? "Empty", description: empty.description ?? "Nothing to show yet." })) : null] }) });
}
