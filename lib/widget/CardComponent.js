import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, {} from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Status } from "../primitive/StatusComponent.js";
import {} from "../layout/layoutShared.js";
function detectOverflowRef(node) {
    if (!node)
        return;
    const measure = () => {
        node.dataset.mcOverflowing = String(node.scrollHeight > node.clientHeight);
    };
    measure();
    if (typeof ResizeObserver === "undefined")
        return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
}
export function Card(props) {
    const { id, title, subtitle, titleLevel = 4, chips = [], actions = null, maxHeight, tone, children, as = "article", dataMcComponent = "Card", data, } = props;
    const Tag = as;
    const hasHeader = Boolean(title) || Boolean(subtitle) || chips.length > 0 || Boolean(actions);
    const popoverId = `${id}-detail`;
    const cardClassName = [
        "mc-card",
        maxHeight ? `mc-card-clamp--${maxHeight}` : null,
        tone ? `mc-card-tone--${tone}` : null,
    ].filter(Boolean).join(" ");
    return (_jsxs(_Fragment, { children: [_jsxs(Tag, { id: id, className: cardClassName, "data-mc-component": dataMcComponent, ...(data ?? {}), children: [hasHeader ? (_jsxs("header", { className: "mc-card-header", children: [(title || subtitle) ? (_jsxs("div", { className: "mc-card-header-title", children: [title ? _jsx(Title, { level: titleLevel, children: title }) : null, subtitle ? _jsx(Description, { children: subtitle }) : null] })) : null, (chips.length > 0 || actions) ? (_jsxs("div", { className: "mc-card-header-actions", children: [chips.map((chip) => (_jsx(Status, { state: chip.status ?? chip.label }, chip.label))), actions] })) : null] })) : null, _jsx("div", { ref: maxHeight ? detectOverflowRef : null, className: maxHeight ? "mc-card-body mc-card-body--clamped" : "mc-card-body", children: children }), maxHeight ? (_jsx("footer", { className: "mc-card-footer", children: _jsx("button", { type: "button", className: "mc-card-show-full", popoverTarget: popoverId, "aria-label": title ? `Show full ${title}` : "Show full details", children: "Show full" }) })) : null] }), maxHeight ? (_jsxs("div", { id: popoverId, className: "mc-card-detail-popover", popover: "auto", children: [_jsxs("header", { className: "mc-card-detail-popover-header", children: [title ? _jsx(Title, { level: titleLevel, children: title }) : _jsx("span", { children: "Details" }), _jsx("button", { type: "button", className: "mc-card-detail-close", popoverTarget: popoverId, popoverTargetAction: "hide", "aria-label": "Hide details", children: "\u00D7" })] }), _jsx("div", { className: "mc-card-detail-popover-body", children: children })] })) : null] }));
}
export function MetricCard(props) {
    const { label, value, detail, dataMcComponent = "MetricCard" } = props;
    return (_jsxs("article", { className: "metric", "data-mc-component": dataMcComponent, children: [_jsx("span", { children: label }), _jsx("strong", { children: value }), detail ? _jsx("small", { children: detail }) : null] }));
}
