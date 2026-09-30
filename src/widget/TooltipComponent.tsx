import React from "react";
// C0: devUxEnabled + the open-popover id now arrive via the injected
// PopoverController context, not a direct useSelector on a store.
// RtkPopoverProvider feeds the Popovers slice in; a store-free consumer mounts
// LocalPopoverProvider.
import { useDevUxEnabled, usePopoverController } from "./PopoverControllerContext.js";
import { tooltipText } from "../tooltip.js";
import { HoverCard } from "./HoverCardComponent.js";

type Side = "bottom" | "top" | "left" | "right";

// P1-B1: the shared id prefix that marks a popover as a tooltip. Minting + the
// "is another tooltip open?" check both use it, so they can't drift apart.
const TOOLTIP_POPOVER_ID_PREFIX = "tooltip-";

export interface TooltipProps {
  tooltip?: unknown;
  fallback?: unknown;
  side?: Side;
  openDelayMs?: number;
  closeDelayMs?: number;
  className?: string;
  as?: "span" | "div";
  children: React.ReactNode;
}

// Hover-triggered tooltip rendered through the shared HoverCard/Popover
// stack. Pass-through (no wrapper, no DOM cost) when there is no text to
// show. Defers to any other open popover so chrome tooltips do not
// preempt a context menu or picker the user is actively using.
export function Tooltip({
  tooltip,
  fallback = null,
  side = "top",
  openDelayMs = 200,
  closeDelayMs = 80,
  className,
  as = "span",
  children
}: TooltipProps) {
  const devUxEnabled = useDevUxEnabled();
  const openPopoverId = usePopoverController().openId;
  const reactId = React.useId();
  const tooltipId = `${TOOLTIP_POPOVER_ID_PREFIX}${reactId}`;
  // Pass tooltip and fallback separately so metadata-only primitives don't
  // surface their component metadata in normal mode — only in dev-ux,
  // where tooltipText combines tooltip + fallback into a single string.
  const text = tooltipText(tooltip as any, { devUxEnabled, fallback: fallback as any });
  if (!text) return <>{children}</>;
  // P1-B1: another TOOLTIP being open must NOT block this one. Defer only to a genuinely
  // different popover (a context menu / picker the user is actively using) — tooltips are
  // peers. Previously any open tooltip made the next defer, so only the FIRST-hovered tab
  // ever showed its tooltip; now the tooltip follows the mouse across tabs.
  const openPopoverIsTooltip = typeof openPopoverId === "string" && openPopoverId.startsWith(TOOLTIP_POPOVER_ID_PREFIX);
  const deferToOtherPopover = openPopoverId !== null && openPopoverId !== tooltipId && !openPopoverIsTooltip;
  // P1-B1: instant HANDOFF — when a tooltip is already showing, open this one with no delay so
  // moving across adjacent triggers feels continuous instead of re-waiting the open delay each hop.
  const effectiveOpenDelayMs = openPopoverIsTooltip ? 0 : openDelayMs;
  return (
    <HoverCard
      id={tooltipId}
      side={side}
      openDelayMs={effectiveOpenDelayMs}
      closeDelayMs={closeDelayMs}
      disabled={deferToOtherPopover}
      ariaLabel={text}
      className={tooltipWrapperClassName(className, as)}
      as={as}
      content={<span className="sui-tooltip-text">{text}</span>}
    >
      {children}
    </HoverCard>
  );
}

function tooltipWrapperClassName(extra?: string, as: "span" | "div" = "span"): string {
  return ["sui-tooltip", as === "div" ? "sui-tooltip-block" : null, extra].filter(Boolean).join(" ");
}
