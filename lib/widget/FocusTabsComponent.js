import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Tooltip } from "./TooltipComponent.js";
import { useIcon } from "./IconContext.js";
export function FocusTabs({ model, onSelect, wrapItem }) {
    const renderIcon = useIcon();
    const defaultTooltip = {
        component: "FocusTabsComponent",
        layer: "layout",
        description: "Icon-first tab strip for project and workspace focus areas.",
        values: { items: model?.items?.length ?? 0, active: model?.items?.find((item) => item.ariaSelected)?.id ?? "none" }
    };
    if (!model)
        return null;
    const selectTab = (item) => {
        if (item.disabled || typeof onSelect !== "function")
            return;
        onSelect(item);
    };
    return _jsx(Tooltip, { tooltip: model?.tooltip, fallback: defaultTooltip, as: "div", children: _jsx("div", { className: model.className, "data-mc-component": "FocusTabsComponent", role: model.role, "aria-label": model.ariaLabel, "aria-orientation": model.ariaOrientation, children: model.items.map((item) => {
                const tabButton = _jsx(Tooltip, { tooltip: item.tooltip, side: "bottom", children: _jsxs("button", { type: "button", className: item.className, "data-project-tab": item.id, role: "tab", "aria-selected": item.ariaSelected, "aria-controls": item.controlsId, "aria-label": item.tooltip, disabled: item.disabled, onClick: () => selectTab(item), children: [_jsx("span", { className: "project-tab-icon", "aria-hidden": "true", children: renderIcon(item.icon, { size: 16 }) }), item.countBadges?.length ? _jsx("span", { className: "project-tab-counts", children: item.countBadges.map((badge) => _jsx("span", { className: "project-tab-count", "aria-label": `${badge.value} ${badge.label}`, children: badge.value }, badge.label)) }) : null] }) });
                const wrappedButton = typeof wrapItem === "function" ? wrapItem(item, tabButton) : tabButton;
                return _jsxs(React.Fragment, { children: [item.dividerBefore ? _jsx("span", { className: "project-tab-divider", role: "separator", "aria-hidden": "true" }) : null, wrappedButton] }, item.key);
            }) }) });
}
// MC's historical export name for the same component.
export { FocusTabs as FocusTabsComponent };
