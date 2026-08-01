import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { useDispatch } from "react-redux";
import { useIcon } from "../../widget/IconContext.js";
import { popoverClosed, popoverOpened } from "../Popovers.js";
import { Popover } from "../../widget/PopoverComponent.js";
// Right-click-to-open Popover wrapper. Anchors the popover at the
// pointer coordinates (clientX/clientY).
//
// Two content modes:
//   - `items`: flat action list — each item renders as a <button>, clicking
//     runs the action and dispatches popoverClosed.
//   - `panel`: arbitrary ReactNode rendered inside the popover. Use this for
//     richer cards (metadata rows, hover-reveal buttons, headers). The
//     consumer owns its own close behavior (call popoverClosed from inside
//     if needed, or just let outside-click / Escape close).
//
// If both are provided, the panel renders above the items list with a
// divider in between.
//
// The wrapper uses `display: contents` so it doesn't alter layout — the
// child element keeps its natural box. closest('[data-mc-popover-anchor]')
// still finds the wrapper through the DOM tree, which is what the global
// outside-click listener relies on to suppress accidental closes.
export function ContextMenu({ id, items = [], panel, payload, ariaLabel, className, children }) {
    const dispatch = useDispatch();
    const renderIcon = useIcon();
    const hasContent = items.length > 0 || panel !== undefined;
    const handleContextMenu = (event) => {
        if (!hasContent)
            return;
        event.preventDefault();
        event.stopPropagation();
        dispatch(popoverOpened({ id, anchor: { x: event.clientX, y: event.clientY }, payload }));
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: className, "data-mc-component": "ContextMenuAnchor", "data-mc-popover-anchor": "", style: { display: "contents" }, onContextMenu: handleContextMenu, children: children }), _jsxs(Popover, { id: id, side: "bottom", ariaLabel: ariaLabel, children: [panel !== undefined ? _jsx("div", { className: "mc-context-menu-panel", children: panel }) : null, panel !== undefined && items.length > 0 ? _jsx("div", { className: "mc-context-menu-divider", role: "separator" }) : null, items.length > 0 ? (_jsx("ul", { className: "mc-context-menu", role: "menu", children: items.map((item, index) => (_jsx("li", { role: "none", children: _jsxs("button", { type: "button", role: "menuitem", className: `mc-context-menu-item${item.danger ? " mc-context-menu-item--danger" : ""}`, disabled: item.disabled, onClick: (event) => {
                                    event.stopPropagation();
                                    if (item.disabled)
                                        return;
                                    // Close first so item.action can open a follow-up popover
                                    // without this close overwriting it (e.g. More info →
                                    // metadata popover for a chat message).
                                    dispatch(popoverClosed());
                                    item.action();
                                }, children: [item.icon ? renderIcon(item.icon, { size: 12, "aria-hidden": "true" }) : null, _jsx("span", { className: "mc-context-menu-item-label", children: item.label }), item.kbd ? _jsx("span", { className: "mc-context-menu-item-kbd", children: item.kbd }) : null] }) }, `${item.label}:${index}`))) })) : null] })] }));
}
// Universal helper: copy a string to the system clipboard. Centralized so
// every adoption site uses the same code path.
export function copyToClipboard(text) {
    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard?.writeText)
        void clipboard.writeText(text);
}
