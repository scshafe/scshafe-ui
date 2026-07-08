import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Tooltip } from "../widget/TooltipComponent.js";
/** @param {{ children: any, className?: string, componentName?: string, as?: string, tooltip?: any, [extra: string]: any }} props */
export function Panel({ children, className = "panel", componentName = "Panel", as = "section", tooltip, ...rest }) {
    const Tag = as;
    const defaultTooltip = {
        component: componentName,
        layer: "container",
        description: "Bounded content region with standard panel spacing and surface treatment.",
        values: { as, className }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsx(Tag, { className: className, "data-mc-component": componentName, ...rest, children: children }) });
}
/** @param {{ title: any, description?: any, aside?: any, children?: any, className?: string, headingLevel?: number, componentName?: string, tooltip?: any, [extra: string]: any }} props */
export function PanelHeader({ title, description, aside, children, className = "panel-header", headingLevel = 2, componentName = "PanelHeader", tooltip, ...rest }) {
    const defaultTooltip = {
        component: componentName,
        layer: "container",
        description: "Compact panel heading row with optional description, aside, and child actions.",
        values: { title, description: description ?? "none", aside: aside ?? "none" }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsxs("div", { className: className, "data-mc-component": componentName, ...rest, children: [_jsxs("div", { children: [_jsx(Title, { level: headingLevel, children: title }), description ? _jsx(Description, { children: description }) : null] }), children ?? (aside ? _jsx("span", { children: aside }) : null)] }) });
}
