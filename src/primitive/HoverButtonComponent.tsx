import React from "react";
import { useIcon } from "../widget/IconContext.js";

export type HoverButtonVariant = "neutral" | "danger" | "accent";
export type HoverButtonSize = "sm" | "md" | "lg";

export interface HoverButtonProps {
  icon: string;
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: HoverButtonVariant;
  size?: HoverButtonSize;
  type?: "button" | "submit";
  title?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  popoverTarget?: string;
  popoverTargetAction?: "show" | "hide" | "toggle";
  dataSuiComponent?: string;
  /** Additional attributes (typically `data-*`) spread onto the button. Use the full attribute name as the key (e.g. `{ "data-workspace-refresh": "home" }`). */
  data?: Record<string, string>;
}

const ICON_SIZE: Record<HoverButtonSize, number> = { sm: 10, md: 12, lg: 14 };

/**
 * Small icon-only button that stays invisible until its parent container is
 * hovered or focused. Parent must carry the `sui-hover-host` class. The
 * button itself has a circular tinted hover background.
 *
 * Usage:
 *   <div className="sui-hover-host">
 *     <span>Some name</span>
 *     <HoverButton icon="action.edit" label="Rename" onClick={...} />
 *   </div>
 */
export function HoverButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "neutral",
  size = "md",
  type = "button",
  title,
  ariaPressed,
  ariaExpanded,
  ariaControls,
  popoverTarget,
  popoverTargetAction,
  dataSuiComponent = "HoverButton",
  data,
}: HoverButtonProps) {
  // C1: icon-name string resolves through the INJECTED renderer (the host's
  // icon set; graceful no-op glyph when no provider is mounted).
  const renderIcon = useIcon();
  const handle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.(event);
  };
  const extraDataAttrs = data ?? {};
  return (
    <button
      type={type}
      className={`sui-hover-button sui-hover-button--${variant} sui-hover-button--size-${size}`}
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      popoverTarget={popoverTarget}
      popoverTargetAction={popoverTargetAction}
      data-sui-component={dataSuiComponent}
      {...extraDataAttrs}
      onClick={handle}
    >
      {renderIcon(icon, { size: ICON_SIZE[size], "aria-hidden": "true" })}
    </button>
  );
}
