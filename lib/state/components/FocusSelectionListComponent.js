import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { IconButton } from "../../primitive/ButtonComponent.js";
import { CollapsibleListRail } from "./CollapsibleListRailComponent.js";
// Generic focus-tab selection rail: a card-style CollapsibleListRail whose
// header carries the focus name (+ count), an optional refresh button, and
// an optional add (+) button. This is the chats-tab rail pattern lifted
// into a reusable widget for every focus tab that follows the "many items,
// view one at a time" shape (chats, plans, architectures, agents, ...).
//
// Add-button clicks pass the React event through so callers can position
// follow-up popovers against the button's bounding rect (the rendered
// IconButton is already a data-mc-popover-anchor so outside-click won't
// close such popovers when re-clicking the trigger).
export function FocusSelectionList({ surfaceId, title, count, ariaLabel, refresh, add, secondaryAdd, className, expandOnMobile, children, }) {
    const displayTitle = count !== undefined ? `${title} (${count})` : title;
    const actions = (refresh || add || secondaryAdd) ? (_jsxs(_Fragment, { children: [refresh ? (_jsx(IconButton, { label: refresh.label, icon: "action.refresh", size: "mini", tooltip: refresh.tooltip, disabled: refresh.disabled, onClick: refresh.onClick })) : null, secondaryAdd ? (_jsx(IconButton, { label: secondaryAdd.label, icon: secondaryAdd.icon ?? "action.add", size: "mini", tooltip: secondaryAdd.tooltip, disabled: secondaryAdd.disabled, onClick: secondaryAdd.onClick })) : null, add ? (_jsx(IconButton, { label: add.label, icon: add.icon ?? "action.add", variant: "primary", size: "mini", tooltip: add.tooltip, disabled: add.disabled, onClick: add.onClick, "data-mc-popover-anchor": "" })) : null] })) : null;
    return (_jsx(CollapsibleListRail, { surfaceId: surfaceId, title: displayTitle, ariaLabel: ariaLabel ?? displayTitle, actions: actions, className: className, expandOnMobile: expandOnMobile, children: children }));
}
