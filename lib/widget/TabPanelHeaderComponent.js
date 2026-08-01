import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useIcon } from "./IconContext.js";
export function TabPanelHeader({ title, headingLevel = 4, aside, statusLabel, refresh, leading, actions, className, dataMcComponent = "TabPanelHeader" }) {
    const renderIcon = useIcon();
    const Heading = `h${headingLevel}`;
    return (_jsxs("div", { className: ["mc-tab-panel-header", className].filter(Boolean).join(" "), "data-mc-component": dataMcComponent, children: [_jsxs("div", { className: "mc-tab-panel-title-group", children: [leading, _jsx(Heading, { children: title }), aside ? _jsx("span", { className: "mc-tab-panel-aside", children: aside }) : null] }), _jsxs("div", { className: "mc-tab-panel-actions", children: [statusLabel ? _jsx("span", { className: "mc-tab-panel-status", role: "status", children: statusLabel }) : null, actions, refresh ? (_jsxs("button", { type: "button", className: "mc-button", disabled: refresh.disabled, onClick: refresh.onClick, "aria-label": refresh.label ?? "Refresh", children: [renderIcon("action.refresh", { size: 12, "aria-hidden": "true" }), " Refresh"] })) : null] })] }));
}
