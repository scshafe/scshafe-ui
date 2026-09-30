import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsMobile, selectSurfaceListCollapsed, surfaceListCollapseToggled } from "../Layout.js";
import { paneSizeSet, selectPaneSize } from "../PaneSizes.js";
import { Tooltip } from "../../widget/TooltipComponent.js";
import { useIcon } from "../../widget/IconContext.js";

const RESIZE_MIN_WIDTH = 200;
const RESIZE_MAX_WIDTH = 720;
const RESIZE_DEFAULT_WIDTH = 280;

/** @param {{ surfaceId: any, title: any, ariaLabel: any, children: any, className?: any, showHeader?: boolean, tooltip?: any, actions?: any, resizable?: boolean, defaultWidth?: number, minWidth?: number, maxWidth?: number, expandOnMobile?: boolean }} props */
export function CollapsibleListRail({ surfaceId, title, ariaLabel, children, className, showHeader = true, tooltip, actions, resizable = true, defaultWidth = RESIZE_DEFAULT_WIDTH, minWidth = RESIZE_MIN_WIDTH, maxWidth = RESIZE_MAX_WIDTH, expandOnMobile = false }) {
  const dispatch = useDispatch();
  const renderIcon = useIcon();
  const storedCollapsed = useSelector(selectSurfaceListCollapsed(surfaceId));
  const isMobile = useSelector(selectIsMobile);
  // M4 mobile-triage: opt-in force-expand for the chat rail's phone LIST view. A
  // rail the operator collapsed on DESKTOP carries its collapsed state to the phone,
  // where the master-detail list would then show only the header + expand toggle
  // (the body is conditionally UNRENDERED when collapsed — not CSS-hideable). When
  // `expandOnMobile` is set AND the viewport is mobile, ignore the stored collapse so
  // the session rows always render. Defaults false + isMobile is always false on
  // desktop/SSR/tests → every other rail is byte-identical.
  const collapsed = storedCollapsed && !(expandOnMobile && isMobile);
  const storedWidth = useSelector(selectPaneSize(`rail:${surfaceId}`));
  const effectiveWidth = typeof storedWidth === "number" ? storedWidth : defaultWidth;
  const toggle = () => dispatch(surfaceListCollapseToggled(surfaceId));
  const toggleLabel = collapsed ? `Expand ${title}` : `Collapse ${title}`;
  const railClassName = ["collapsible-list-rail", collapsed ? "is-collapsed" : "", showHeader ? "" : "no-header", resizable && !collapsed ? "is-resizable" : "", className].filter(Boolean).join(" ");
  const defaultTooltip = {
    component: "CollapsibleListRail",
    layer: "layout",
    description: "Manager-backed collapsible rail for dense lists.",
    values: { surfaceId, title, collapsed, width: effectiveWidth }
  };
  const handleResizePointerDown = useCallback((event) => {
    if (collapsed) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const handleEl = event.currentTarget;
    const railElement = handleEl.closest(".collapsible-list-rail");
    if (!railElement) return;
    handleEl.setPointerCapture(event.pointerId);
    handleEl.dataset.startX = String(event.clientX);
    handleEl.dataset.startWidth = String(railElement.getBoundingClientRect().width);
    handleEl.dataset.lastWidth = handleEl.dataset.startWidth;
    railElement.dataset.resizing = "true";
  }, [collapsed]);

  const handleResizePointerMove = useCallback((event) => {
    const handleEl = event.currentTarget;
    if (!handleEl.hasPointerCapture(event.pointerId)) return;
    const startX = parseFloat(handleEl.dataset.startX ?? "");
    const startWidth = parseFloat(handleEl.dataset.startWidth ?? "");
    if (!Number.isFinite(startX) || !Number.isFinite(startWidth)) return;
    const railElement = handleEl.closest(".collapsible-list-rail");
    if (!railElement) return;
    const dx = event.clientX - startX;
    const next = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
    railElement.style.width = `${next}px`;
    railElement.style.flexBasis = `${next}px`;
    handleEl.dataset.lastWidth = String(next);
  }, [minWidth, maxWidth]);

  const handleResizePointerEnd = useCallback((event) => {
    const handleEl = event.currentTarget;
    if (handleEl.hasPointerCapture(event.pointerId)) handleEl.releasePointerCapture(event.pointerId);
    const lastWidth = parseFloat(handleEl.dataset.lastWidth ?? "");
    const railElement = handleEl.closest(".collapsible-list-rail");
    if (railElement) delete railElement.dataset.resizing;
    delete handleEl.dataset.startX;
    delete handleEl.dataset.startWidth;
    delete handleEl.dataset.lastWidth;
    if (Number.isFinite(lastWidth) && lastWidth > 0) {
      dispatch(paneSizeSet({ paneId: `rail:${surfaceId}`, size: lastWidth }));
    }
  }, [dispatch, surfaceId]);

  const handleResizeDoubleClick = useCallback((event) => {
    const railElement = event.currentTarget.closest(".collapsible-list-rail");
    if (railElement) {
      railElement.style.width = `${defaultWidth}px`;
      railElement.style.flexBasis = `${defaultWidth}px`;
    }
    dispatch(paneSizeSet({ paneId: `rail:${surfaceId}`, size: defaultWidth }));
  }, [dispatch, surfaceId, defaultWidth]);
  // L2 fix for the mobile !important war: on a phone the rail is full-width by
  // package CSS, so the persisted desktop width must NOT render as an inline style
  // (inline px could only be beaten by !important — the old MC pattern).
  const inlineStyle = collapsed || !resizable || isMobile ? undefined : { width: `${effectiveWidth}px`, flexBasis: `${effectiveWidth}px` };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <aside
      className={railClassName}
      data-sui-component="CollapsibleListRail"
      data-surface-id={surfaceId}
      data-collapsed={collapsed ? "true" : "false"}
      aria-label={ariaLabel ?? title}
      style={inlineStyle}
    >
      {showHeader ? <div className="collapsible-list-rail-header">
        <button
          type="button"
          className="collapsible-list-rail-toggle"
          data-sui-action="toggle-list-rail"
          aria-pressed={!collapsed}
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={toggle}
        >{collapsed ? renderIcon("action.chevron-right", { size: 12 }) : renderIcon("action.chevron-left", { size: 12 })}</button>
        {collapsed ? null : <span className="collapsible-list-rail-title">{title}</span>}
        {collapsed || !actions ? null : <span className="collapsible-list-rail-actions">{actions}</span>}
      </div> : null}
      {collapsed ? null : <div className="collapsible-list-rail-body">{children}</div>}
      {resizable && !collapsed ? (
        <div
          className="collapsible-list-rail-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${title}`}
          title="Drag to resize. Double-click to reset."
          data-sui-component="CollapsibleListRailResize"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerEnd}
          onPointerCancel={handleResizePointerEnd}
          onDoubleClick={handleResizeDoubleClick}
        />
      ) : null}
    </aside>
  </Tooltip>;
}
