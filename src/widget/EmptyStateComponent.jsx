import React from "react";
import { Tooltip } from "./TooltipComponent.js";
import { useIcon } from "./IconContext.js";

/** @param {{ children?: any, message?: any, className?: string, componentName?: string, role?: string, tooltip?: any, [extra: string]: any }} props */
export function EmptyState({ children, message, className = "empty", componentName = "EmptyState", role, tooltip, icon = null, ...rest }) {
  const renderIcon = useIcon();
  const content = children ?? message;
  const defaultTooltip = {
    component: componentName,
    layer: "widget",
    description: "Reusable empty, loading, or unavailable-state message.",
    values: { className, role: role ?? "none", message: typeof content === "string" ? content : "custom content" }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <div
      className={className}
      data-sui-component={componentName}
      role={role}
      {...rest}
    >{icon ? <span className="sui-empty-icon">{renderIcon(icon, { size: 20, "aria-hidden": "true" })}</span> : null}{content}</div>
  </Tooltip>;
}
