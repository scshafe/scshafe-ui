import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";
import { useIcon } from "../widget/IconContext.js";

function buttonClassName({ variant = "secondary", size = null, iconOnly = false, className = null } = {}) {
  return [
    "sui-button",
    variant ? `sui-button-${variant}` : null,
    size === "mini" ? "sui-button-mini" : null,
    iconOnly ? "sui-button-icon" : null,
    className
  ].filter(Boolean).join(" ");
}

/** @param {{ label?: any, children?: any, icon?: any, variant?: string, size?: any, tooltip?: any, className?: any, disabled?: boolean, type?: string, [extra: string]: any }} props */
export function Button({ label, children, icon, variant = "secondary", size, tooltip, className, disabled = false, type = "button", ...rest }) {
  // C1: icon-name strings resolve through the INJECTED renderer (MC → its
  // registry; standalone → its own set / nothing). Byte-identical for MC.
  const renderIcon = useIcon();
  const renderedLabel = children ?? label;
  const defaultTooltip = {
    component: "Button",
    layer: "primitive",
    description: "Command button with configurable tone, optional icon, disabled state, and tooltip.",
    values: { label: label ?? renderedLabel, variant, size: size ?? "default", disabled }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip}>
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      disabled={disabled}
      data-sui-component="Button"
      {...rest}
    >
      {icon ? renderIcon(icon, { size: 14, "aria-hidden": "true" }) : null}
      {renderedLabel}
    </button>
  </Tooltip>;
}

/** @param {{ label?: any, icon?: any, variant?: string, size?: any, tooltip?: any, className?: any, disabled?: boolean, type?: string, children?: any, [extra: string]: any }} props */
export function IconButton({ label, icon, variant = "ghost", size, tooltip, className, disabled = false, type = "button", children, ...rest }) {
  const renderIcon = useIcon();
  const defaultTooltip = {
    component: "IconButton",
    layer: "primitive",
    description: "Icon-only command button. The label is carried through aria-label and tooltip.",
    values: { label, icon, variant, size: size ?? "default", disabled }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip}>
    <button
      type={type}
      className={buttonClassName({ variant, size, iconOnly: true, className })}
      disabled={disabled}
      aria-label={label}
      data-sui-component="IconButton"
      {...rest}
    >
      {children ?? renderIcon(icon, { size: 14, "aria-hidden": "true" })}
    </button>
  </Tooltip>;
}
