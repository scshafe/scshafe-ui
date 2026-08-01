import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSurfaceListCollapsed, surfaceListCollapseToggled } from "../Layout.js";
import { Tooltip } from "../../widget/TooltipComponent.js";
import { useIcon } from "../../widget/IconContext.js";
export function RailToggle({ surfaceId, title, tooltip }) {
    const dispatch = useDispatch();
    const renderIcon = useIcon();
    const collapsed = useSelector(selectSurfaceListCollapsed(surfaceId));
    const toggleLabel = collapsed ? `Expand ${title} list` : `Collapse ${title} list`;
    const defaultTooltip = {
        component: "RailToggle",
        layer: "layout",
        description: "Icon button that toggles a manager-backed collapsible rail.",
        values: { surfaceId, title, collapsed }
    };
    return _jsx(Tooltip, { tooltip: tooltip ?? toggleLabel, fallback: defaultTooltip, children: _jsx("button", { type: "button", className: "collapsible-list-rail-toggle panel-rail-toggle", "data-mc-component": "RailToggle", "data-mc-action": "toggle-list-rail", "data-surface-id": surfaceId, "aria-pressed": !collapsed, "aria-label": toggleLabel, onClick: () => dispatch(surfaceListCollapseToggled(surfaceId)), children: collapsed ? renderIcon("action.chevron-right", { size: 12 }) : renderIcon("action.chevron-left", { size: 12 }) }) });
}
