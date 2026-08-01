import React from "react";
import { FALLBACK_ICON_COMPONENT, iconComponentFor } from "./iconRegistry.js";

// L4 — render a semantic icon by name (moved from MC's web/src/icons/Icon.jsx,
// behavior unchanged). Without `aria-label` the icon is aria-hidden so screen
// readers fall through to the surrounding button label / text.
//
//   <Icon name="nav.home" size={16} className="sidebar-nav-icon" />

export interface IconProps {
  name: string;
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  "aria-label"?: string;
  title?: string;
  [extra: string]: unknown;
}

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.7,
  className,
  "aria-label": ariaLabel,
  title,
  ...rest
}: IconProps) {
  const Component = iconComponentFor(name) ?? FALLBACK_ICON_COMPONENT;
  const a11y = ariaLabel
    ? { role: "img", "aria-label": ariaLabel }
    : { "aria-hidden": "true", focusable: "false" };
  return <Component
    width={size}
    height={size}
    strokeWidth={strokeWidth}
    className={className}
    {...a11y}
    {...rest}
  >{title ? <title>{title}</title> : null}</Component>;
}
