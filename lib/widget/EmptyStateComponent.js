import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { Tooltip } from "./TooltipComponent.js";
/** @param {{ children?: any, message?: any, className?: string, componentName?: string, role?: string, tooltip?: any, [extra: string]: any }} props */
export function EmptyState({ children, message, className = "empty", componentName = "EmptyState", role, tooltip, ...rest }) {
    const content = children ?? message;
    const defaultTooltip = {
        component: componentName,
        layer: "widget",
        description: "Reusable empty, loading, or unavailable-state message.",
        values: { className, role: role ?? "none", message: typeof content === "string" ? content : "custom content" }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsx("div", { className: className, "data-mc-component": componentName, role: role, ...rest, children: content }) });
}
