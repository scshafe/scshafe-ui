import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { useIcon } from "../widget/IconContext.js";
const ICON_SIZE = { sm: 10, md: 12, lg: 14 };
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
export function HoverButton({ icon, label, onClick, disabled, variant = "neutral", size = "md", type = "button", title, ariaPressed, ariaExpanded, ariaControls, popoverTarget, popoverTargetAction, dataMcComponent = "HoverButton", data, }) {
    // C1: icon-name string resolves through the INJECTED renderer (byte-identical
    // for MC via McIconProvider; graceful no-op glyph for standalone consumers).
    const renderIcon = useIcon();
    const handle = (event) => {
        event.stopPropagation();
        onClick?.(event);
    };
    const extraDataAttrs = data ?? {};
    return (_jsx("button", { type: type, className: `mc-hover-button mc-hover-button--${variant} mc-hover-button--size-${size}`, "aria-label": label, title: title ?? label, disabled: disabled, "aria-pressed": ariaPressed, "aria-expanded": ariaExpanded, "aria-controls": ariaControls, popoverTarget: popoverTarget, popoverTargetAction: popoverTargetAction, "data-mc-component": dataMcComponent, ...extraDataAttrs, onClick: handle, children: renderIcon(icon, { size: ICON_SIZE[size], "aria-hidden": "true" }) }));
}
