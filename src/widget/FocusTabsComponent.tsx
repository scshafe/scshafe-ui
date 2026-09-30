import React from "react";
import { Tooltip } from "./TooltipComponent.js";
import { useIcon } from "./IconContext.js";

// L1 — the icon-first focus tab strip. Model-driven and app-agnostic: every
// aria attribute and behavior arrives on the model (the host builds the model
// in its selectors). Icons resolve through the injected renderer. The strip
// carries `sui-focus-tabs`, each button `sui-focus-tab`, plus the model's own
// classes; the inner classes (sui-focus-tab-icon / -counts / -count and
// sui-focus-tabs-divider) are the render contract. Styles ship in components.css.

export interface FocusTabItemModel {
  key: string;
  id: string;
  icon: string;
  tooltip?: string;
  countBadges?: ReadonlyArray<{ label: string; value: number | string }>;
  className?: string;
  ariaSelected?: boolean;
  controlsId?: string;
  disabled?: boolean;
  dividerBefore?: boolean;
}

export interface FocusTabsModel {
  className?: string;
  role?: string;
  ariaLabel?: string;
  ariaOrientation?: "horizontal" | "vertical";
  tooltip?: unknown;
  items: ReadonlyArray<FocusTabItemModel>;
}

export interface FocusTabsProps {
  model: FocusTabsModel | null | undefined;
  onSelect?: (item: FocusTabItemModel) => void;
  wrapItem?: (item: FocusTabItemModel, button: React.ReactNode) => React.ReactNode;
}

export function FocusTabs({ model, onSelect, wrapItem }: FocusTabsProps) {
  const renderIcon = useIcon();
  const defaultTooltip = {
    component: "FocusTabs",
    layer: "layout",
    description: "Icon-first tab strip for switching between workspace focus areas.",
    values: { items: model?.items?.length ?? 0, active: model?.items?.find((item) => item.ariaSelected)?.id ?? "none" }
  };
  if (!model) return null;
  const selectTab = (item: FocusTabItemModel) => {
    if (item.disabled || typeof onSelect !== "function") return;
    onSelect(item);
  };
  return <Tooltip tooltip={model?.tooltip} fallback={defaultTooltip} as="div">
    <div className={["sui-focus-tabs", model.className].filter(Boolean).join(" ")} data-sui-component="FocusTabs" role={model.role} aria-label={model.ariaLabel} aria-orientation={model.ariaOrientation}>
      {model.items.map((item) => {
        const tabButton = <Tooltip tooltip={item.tooltip} side="bottom">
          <button type="button" className={["sui-focus-tab", item.className].filter(Boolean).join(" ")} data-sui-focus-tab={item.id} role="tab" aria-selected={item.ariaSelected} aria-controls={item.controlsId} aria-label={item.tooltip} disabled={item.disabled} onClick={() => selectTab(item)}>
            <span className="sui-focus-tab-icon" aria-hidden="true">{renderIcon(item.icon, { size: 16 })}</span>
            {item.countBadges?.length ? <span className="sui-focus-tab-counts">{item.countBadges.map((badge) => <span key={badge.label} className="sui-focus-tab-count" aria-label={`${badge.value} ${badge.label}`}>{badge.value}</span>)}</span> : null}
          </button>
        </Tooltip>;
        const wrappedButton = typeof wrapItem === "function" ? wrapItem(item, tabButton) : tabButton;
        return <React.Fragment key={item.key}>
          {item.dividerBefore ? <span className="sui-focus-tabs-divider" role="separator" aria-hidden="true" /> : null}
          {wrappedButton}
        </React.Fragment>;
      })}
    </div>
  </Tooltip>;
}

// Also exported under the file's *Component name.
export { FocusTabs as FocusTabsComponent };
