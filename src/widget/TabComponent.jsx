import React from "react";
import { Tooltip } from "./TooltipComponent.js";
import { useIcon } from "./IconContext.js";

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
export function Tab({ id, label, icon = null, active = false, disabled = false, badge = null, onSelect = null, tooltip = null }) {
  // C1: icon-name string resolves through the INJECTED renderer (byte-identical
  // for MC via McIconProvider).
  const renderIcon = useIcon();
  const defaultTooltip = {
    component: "Tab",
    layer: "widget",
    description: "Single tab button in a focus / section tab strip.",
    values: { id, label, active, disabled, badge: badge ?? "none" }
  };
  const handleClick = () => {
    if (disabled || !onSelect) return;
    onSelect(id);
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip}>
    <button
      type="button"
      className={`mc-tab ${active ? "mc-tab-active" : ""}`.trim()}
      aria-pressed={active}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={handleClick}
      data-mc-component="Tab"
      data-mc-tab-id={id}
    >
      {icon ? renderIcon(icon, { size: 14, "aria-hidden": "true" }) : null}
      <span className="mc-tab-label">{label}</span>
      {badge !== null && badge !== undefined ? <span className="mc-tab-badge">{badge}</span> : null}
    </button>
  </Tooltip>;
}
