import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useDispatch } from "react-redux";
import { useIcon } from "../../widget/IconContext.js";
import { popoverClosed, popoverOpened } from "../Popovers.js";
import { HoverButton } from "../../primitive/HoverButtonComponent.js";
import { Popover } from "../../widget/PopoverComponent.js";
import {} from "./ContextMenuComponent.js";
// Click-triggered dropdown of menu items. Pairs a hover-revealed icon
// button (kebab / 3-dots by default) with a Popover anchored to the
// button's bounding rect. Items render with the same .mc-context-menu
// CSS as the right-click ContextMenu, so the action list looks
// consistent across triggers.
//
// Parent must carry `mc-hover-host` so the trigger button only shows on
// hover or focus-within.
export function MoreActionsMenu({ id, items, label = "More actions", icon = "action.more", ariaLabel, disabled }) {
    const dispatch = useDispatch();
    const renderIcon = useIcon();
    const buttonRef = React.useRef(null);
    const handleClick = (event) => {
        event.stopPropagation();
        event.preventDefault();
        if (disabled || items.length === 0)
            return;
        const rect = event.currentTarget.getBoundingClientRect();
        dispatch(popoverOpened({ id, anchor: { x: rect.right, y: rect.bottom } }));
    };
    // Attach the ref via wrapping span — HoverButton doesn't forward refs.
    return (_jsxs("span", { ref: (node) => { buttonRef.current = node; }, "data-mc-popover-anchor": "", children: [_jsx(HoverButton, { icon: icon, label: label, size: "lg", disabled: disabled, onClick: handleClick, dataMcComponent: "MoreActionsMenuTrigger" }), _jsx(Popover, { id: id, side: "bottom", ariaLabel: ariaLabel ?? label, children: _jsx("ul", { className: "mc-context-menu", role: "menu", children: items.map((item, index) => (_jsx("li", { role: "none", children: _jsxs("button", { type: "button", role: "menuitem", className: `mc-context-menu-item${item.danger ? " mc-context-menu-item--danger" : ""}`, disabled: item.disabled, onClick: (event) => {
                                event.stopPropagation();
                                if (item.disabled)
                                    return;
                                dispatch(popoverClosed());
                                item.action();
                            }, children: [item.icon ? renderIcon(item.icon, { size: 12, "aria-hidden": "true" }) : null, _jsx("span", { className: "mc-context-menu-item-label", children: item.label }), item.kbd ? _jsx("span", { className: "mc-context-menu-item-kbd", children: item.kbd }) : null] }) }, `${item.label}:${index}`))) }) })] }));
}
