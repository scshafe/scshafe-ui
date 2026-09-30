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
  return <Tooltip tooltip={tooltip ?? toggleLabel} fallback={defaultTooltip}>
    <button
      type="button"
      className="collapsible-list-rail-toggle panel-rail-toggle"
      data-sui-component="RailToggle"
      data-sui-action="toggle-list-rail"
      data-surface-id={surfaceId}
      aria-pressed={!collapsed}
      aria-label={toggleLabel}
      onClick={() => dispatch(surfaceListCollapseToggled(surfaceId))}
    >{collapsed ? renderIcon("action.chevron-right", { size: 12 }) : renderIcon("action.chevron-left", { size: 12 })}</button>
  </Tooltip>;
}
