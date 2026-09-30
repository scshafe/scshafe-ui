import React from "react";
import { useIcon } from "./IconContext.js";

// L1 — the standardized focus-tab panel header: title group (with an optional
// leading slot for a RailToggle), an aside, a status line, and THE refresh
// convention — one icon+label button (never icon-only in one panel, text in the next).
// Pure props; the host owns the refresh thunk/gesture behind `onRefresh`.
//
//   <TabPanelHeader title="Implementation plans" aside="12 open"
//     statusLabel="refreshed 2m ago"
//     refresh={{ label: "Refresh plans", onClick: refreshTab }}
//     leading={<RailToggle surfaceId="plans" title="Plans" />} />

export interface TabPanelHeaderRefresh {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export interface TabPanelHeaderProps {
  title: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  aside?: React.ReactNode;
  statusLabel?: string | null;
  refresh?: TabPanelHeaderRefresh | null;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  dataSuiComponent?: string;
}

export function TabPanelHeader({
  title,
  headingLevel = 4,
  aside,
  statusLabel,
  refresh,
  leading,
  actions,
  className,
  dataSuiComponent = "TabPanelHeader"
}: TabPanelHeaderProps) {
  const renderIcon = useIcon();
  const Heading = `h${headingLevel}` as unknown as React.ElementType;
  return (
    <div className={["sui-tab-panel-header", className].filter(Boolean).join(" ")} data-sui-component={dataSuiComponent}>
      <div className="sui-tab-panel-title-group">
        {leading}
        <Heading>{title}</Heading>
        {aside ? <span className="sui-tab-panel-aside">{aside}</span> : null}
      </div>
      <div className="sui-tab-panel-actions">
        {statusLabel ? <span className="sui-tab-panel-status" role="status">{statusLabel}</span> : null}
        {actions}
        {refresh ? (
          <button
            type="button"
            className="sui-button"
            disabled={refresh.disabled}
            onClick={refresh.onClick}
            aria-label={refresh.label ?? "Refresh"}
          >
            {renderIcon("action.refresh", { size: 12, "aria-hidden": "true" })} Refresh
          </button>
        ) : null}
      </div>
    </div>
  );
}
