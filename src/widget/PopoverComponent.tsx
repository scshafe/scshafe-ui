import React from "react";
// C0: the open id + anchor now come from the injected PopoverController context
// instead of a direct useSelector on the Popovers slice. RtkPopoverProvider
// feeds the exact selectOpenPopoverId / selectPopoverAnchor values in; the menus (ContextMenu et al.) that dispatch
// to the slice directly still drive this Popover through that same live state.
import { usePopoverController } from "./PopoverControllerContext.js";
import { popoverStyleForViewport } from "./popoverPosition.js";

type Anchor = { x: number; y: number };
type Side = "bottom" | "top" | "left" | "right";

export interface PopoverProps {
  id: string;
  side?: Side;
  offset?: number;
  ariaLabel?: string;
  dataSuiComponent?: string;
  children: React.ReactNode;
}

// Renders a fixed-position floating container at viewport coords once the
// matching popover id is opened in the Popovers slice. Returns null when
// closed (subtree teardown). The slice owns visibility + anchor coords.
//
// Wrapper components like HoverCard, ContextMenu, and Picker compose this
// primitive with the appropriate trigger semantics (hover delay, right-click,
// click).
export function Popover({ id, side = "bottom", offset = 6, ariaLabel, dataSuiComponent = "Popover", children }: PopoverProps) {
  const { openId, anchor } = usePopoverController();
  if (openId !== id || !anchor) return null;
  const style: React.CSSProperties = positionStyle(anchor, side, offset);
  return (
    <div
      className={`sui-popover sui-popover-side--${side}`}
      data-sui-component={dataSuiComponent}
      data-popover-id={id}
      role="dialog"
      aria-label={ariaLabel}
      style={style}
    >
      {children}
    </div>
  );
}

function positionStyle(anchor: Anchor, side: Side, offset: number): React.CSSProperties {
  // Read the LIVE viewport and let popoverStyleForViewport apply the mobile-clamp
  // GATE (M0 mobile-triage — see popoverPosition.ts). WHY the gate: above the
  // 880px mobile breakpoint (desktop) it returns the RAW pre-M0 position verbatim
  // so desktop stays byte-identical (incl. the top/left calc(...) strings); the
  // phone/small-tablet edge-trap is what the clamp targets, so it only runs
  // at/below 880px. The popover only ever renders client-side, but a window-less
  // SSR/test render passes a null viewport → also the raw path.
  const vw = typeof window !== "undefined" ? window.innerWidth : NaN;
  const vh = typeof window !== "undefined" ? window.innerHeight : NaN;
  const view = Number.isFinite(vw) && Number.isFinite(vh) ? { width: vw, height: vh } : null;
  return popoverStyleForViewport(anchor, side, offset, view);
}
