import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Status } from "../primitive/StatusComponent.js";
import { Tooltip } from "../widget/TooltipComponent.js";
import { relativeTimeLabel, timestamp as timestampLabel } from "../format.js";
export function ListRow({ title, subtitle, titleLevel = 5, status, timestamp: timestampValue, chips = [], media, actions, children, className = "task-row", componentName = "ListRow", as = "div", tooltip, ...rest }) {
    const Tag = as;
    const defaultTooltip = {
        component: componentName,
        layer: "container",
        description: "Dense repeated row with optional media slot, Title + Description heading, status chips, action slot, and detail body.",
        values: { title, subtitle: subtitle ?? "none", titleLevel, chipCount: chips.length, hasMedia: Boolean(media), hasActions: Boolean(actions), className }
    };
    const hasAside = chips.length > 0 || Boolean(actions) || Boolean(status) || Boolean(timestampValue);
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsxs(Tag, { className: className, "data-mc-component": componentName, ...rest, children: [_jsxs("div", { className: "card-top", children: [media ? _jsx("div", { className: "list-row-media", children: media }) : null, _jsxs("div", { className: "list-row-content", children: [_jsx(Title, { level: titleLevel, children: title }), subtitle ? _jsx(Description, { children: subtitle }) : null] }), hasAside ? _jsxs("div", { className: "list-row-aside", children: [timestampValue ? _jsx("small", { className: "mc-card-timestamp", title: timestampLabel(timestampValue), children: relativeTimeLabel(timestampValue) }) : null, status ? _jsx("span", { className: "mc-card-status", children: _jsx(Status, { state: status }) }) : null, chips.length ? _jsx("div", { className: "chips", children: chips.map((chip) => _jsx(Status, { state: chip.value ?? chip, tooltip: chip.tooltip, icon: null }, chip.value ?? chip)) }) : null, actions ? _jsx("div", { className: "list-row-actions", children: actions }) : null] }) : null] }), children] }) });
}
