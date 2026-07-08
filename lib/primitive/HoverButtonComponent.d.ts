import React from "react";
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
    dataMcComponent?: string;
    /** Additional attributes (typically `data-*`) spread onto the button. Use the full attribute name as the key (e.g. `{ "data-workspace-refresh": "home" }`). */
    data?: Record<string, string>;
}
/**
 * Small icon-only button that stays invisible until its parent container is
 * hovered or focused. Parent must carry the `mc-hover-host` class. The
 * button itself has a circular tinted hover background.
 *
 * Usage:
 *   <div className="mc-hover-host">
 *     <span>Some name</span>
 *     <HoverButton icon="action.edit" label="Rename" onClick={...} />
 *   </div>
 */
export declare function HoverButton({ icon, label, onClick, disabled, variant, size, type, title, ariaPressed, ariaExpanded, ariaControls, popoverTarget, popoverTargetAction, dataMcComponent, data, }: HoverButtonProps): import("react/jsx-runtime").JSX.Element;
