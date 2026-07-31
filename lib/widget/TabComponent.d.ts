/**
 * Atomic single-tab button. Use this in any horizontal tab strip,
 * including the existing FocusTabsComponent (which can compose Tab
 * internally). For dynamic / focus-routing tab strips, prefer
 * FocusTabsComponent at the strip level and let it own the Tab
 * composition.
 *
 * Props:
 *  - id: identifier for the tab (forwarded to data-mc-tab-id and onSelect)
 *  - label: display text
 *  - icon: optional icon name from icons/icon-names.js
 *  - active: whether this tab is the currently selected one
 *  - disabled: when true, the tab is not selectable
 *  - badge: optional count/value rendered next to the label
 *  - onSelect: called with the id when the tab is clicked
 *  - tooltip: tooltip metadata object or string
 */
export function Tab({ id, label, icon, active, disabled, badge, onSelect, tooltip }: {
    id: any;
    label: any;
    icon?: null | undefined;
    active?: boolean | undefined;
    disabled?: boolean | undefined;
    badge?: null | undefined;
    onSelect?: null | undefined;
    tooltip?: null | undefined;
}): React.JSX.Element;
import React from "react";
