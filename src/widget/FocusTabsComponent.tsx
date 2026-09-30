import React from "react";
import { Tooltip } from "./TooltipComponent.js";
import { useIcon } from "./IconContext.js";

// L1 — the icon-first focus tab strip. Model-driven and app-agnostic: every
// outer class, aria attribute, and behavior arrives on the model (the host
// builds the model in its selectors). Icons resolve through the injected renderer. Inner class names (project-tab-icon / -counts / -count /
// -divider) are a frozen render contract (namespacing them is tracked for 0.3.0);
// their styles ship in components.css.

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
    component: "FocusTabsComponent",
    layer: "layout",
    description: "Icon-first tab strip for project and workspace focus areas.",
    values: { items: model?.items?.length ?? 0, active: model?.items?.find((item) => item.ariaSelected)?.id ?? "none" }
  };
  if (!model) return null;
  const selectTab = (item: FocusTabItemModel) => {
    if (item.disabled || typeof onSelect !== "function") return;
    onSelect(item);
  };
  return <Tooltip tooltip={model?.tooltip} fallback={defaultTooltip} as="div">
    <div className={model.className} data-sui-component="FocusTabsComponent" role={model.role} aria-label={model.ariaLabel} aria-orientation={model.ariaOrientation}>
      {model.items.map((item) => {
        const tabButton = <Tooltip tooltip={item.tooltip} side="bottom">
          <button type="button" className={item.className} data-project-tab={item.id} role="tab" aria-selected={item.ariaSelected} aria-controls={item.controlsId} aria-label={item.tooltip} disabled={item.disabled} onClick={() => selectTab(item)}>
            <span className="project-tab-icon" aria-hidden="true">{renderIcon(item.icon, { size: 16 })}</span>
            {item.countBadges?.length ? <span className="project-tab-counts">{item.countBadges.map((badge) => <span key={badge.label} className="project-tab-count" aria-label={`${badge.value} ${badge.label}`}>{badge.value}</span>)}</span> : null}
          </button>
        </Tooltip>;
        const wrappedButton = typeof wrapItem === "function" ? wrapItem(item, tabButton) : tabButton;
        return <React.Fragment key={item.key}>
          {item.dividerBefore ? <span className="project-tab-divider" role="separator" aria-hidden="true" /> : null}
          {wrappedButton}
        </React.Fragment>;
      })}
    </div>
  </Tooltip>;
}

// Also exported under the file's *Component name.
export { FocusTabs as FocusTabsComponent };
