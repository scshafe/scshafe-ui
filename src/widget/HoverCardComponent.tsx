import React from "react";
// C0: the open/close of the single popover now flows through the injected
// PopoverController context instead of dispatching popoverOpened /
// popoverClosedIfCurrent directly on the Popovers slice. MC's RtkPopoverProvider
// maps these 1:1 to those exact actions, so the timing / scoped-close / instant
// handoff (P1-B1) logic below is UNCHANGED — only the source of state inverted.
import { usePopoverController } from "./PopoverControllerContext.js";
import { Popover } from "./PopoverComponent.js";

export interface HoverCardProps {
  id: string;
  content: React.ReactNode;
  side?: "bottom" | "top" | "left" | "right";
  openDelayMs?: number;
  closeDelayMs?: number;
  disabled?: boolean;
  payload?: unknown;
  ariaLabel?: string;
  className?: string;
  as?: "span" | "div";
  children: React.ReactNode;
}

// Hover-to-open Popover wrapper. mouseEnter on the wrapper schedules a
// popoverOpened after `openDelayMs` (default 400ms). mouseLeave cancels
// the pending open OR schedules a delayed close. Hovering into the popover
// itself cancels the close timer so the user can interact with the popover
// content. Returns a single `<span>` wrapper to keep the host element
// (a row, a chip, etc.) responsible for layout — and marks it as a
// popover-anchor so the global outside-click listener leaves the wrapper
// alone.
export function HoverCard({
  id,
  content,
  side = "right",
  openDelayMs = 400,
  closeDelayMs = 120,
  disabled = false,
  payload,
  ariaLabel,
  className,
  as = "span",
  children
}: HoverCardProps) {
  const popover = usePopoverController();
  const openId = popover.openId;
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = React.useRef<HTMLElement | null>(null);
  const isOpen = openId === id;

  React.useEffect(() => {
    return () => {
      if (openTimerRef.current) { clearTimeout(openTimerRef.current); openTimerRef.current = null; }
      if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    };
  }, []);

  const clearOpenTimer = () => {
    if (openTimerRef.current) { clearTimeout(openTimerRef.current); openTimerRef.current = null; }
  };
  const clearCloseTimer = () => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  };

  const handleEnter = () => {
    if (disabled) return;
    clearCloseTimer();
    if (isOpen) return;
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      const element = wrapperRef.current;
      if (!element) return;
      const rect = anchorRect(element);
      if (!rect) return;
      const anchor = anchorFor(rect, side);
      popover.open(id, anchor, payload);
    }, openDelayMs);
  };

  const handleLeave = () => {
    clearOpenTimer();
    if (!isOpen) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      // P1-B1: SCOPED close — only close if THIS card is still the open one. A delayed close
      // must not clobber a newer popover that opened during the close delay (e.g. an instant
      // tooltip handoff to the adjacent tab).
      popover.closeIfCurrent(id);
    }, closeDelayMs);
  };

  const handlePopoverEnter = () => clearCloseTimer();
  const handlePopoverLeave = () => handleLeave();

  const Wrapper = as as React.ElementType;
  return (
    <Wrapper
      ref={wrapperRef}
      className={className}
      data-sui-component="HoverCard"
      data-sui-popover-anchor=""
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      <Popover id={id} side={side} ariaLabel={ariaLabel}>
        <div className="sui-hover-card-content" onMouseEnter={handlePopoverEnter} onMouseLeave={handlePopoverLeave}>
          {content}
        </div>
      </Popover>
    </Wrapper>
  );
}

// When the wrapper has `display: contents` (layout-neutral), its own
// getBoundingClientRect() returns a zero-size rect. Fall back to the
// first element child's box in that case so positioning works either
// way without forcing callers to choose a layout-impacting wrapper.
function anchorRect(element: HTMLElement): DOMRect | null {
  const ownRect = element.getBoundingClientRect();
  if (ownRect.width > 0 || ownRect.height > 0) return ownRect;
  const child = element.firstElementChild as HTMLElement | null;
  if (!child) return ownRect;
  return child.getBoundingClientRect();
}

function anchorFor(rect: DOMRect, side: "bottom" | "top" | "left" | "right"): { x: number; y: number } {
  switch (side) {
    case "top":
      return { x: rect.left + rect.width / 2, y: rect.top };
    case "left":
      return { x: rect.left, y: rect.top + rect.height / 2 };
    case "right":
      return { x: rect.right, y: rect.top + rect.height / 2 };
    case "bottom":
    default:
      return { x: rect.left + rect.width / 2, y: rect.bottom };
  }
}
