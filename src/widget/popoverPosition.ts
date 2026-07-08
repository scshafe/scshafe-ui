import type React from "react";

// Popover viewport positioning math (M0 mobile-triage). Extracted from
// PopoverComponent so the clamp is a pure, window-free function that can be
// unit-tested by injecting the viewport (see test/popovers.test.mjs).
//
// The PopoverComponent renders a fixed-position panel at `anchor` (viewport
// coords). Before M0 it set `left: anchor.x` with a CSS translateX(-50%) and NO
// viewport clamp, so a popover anchored near a screen edge (composer pickers,
// column menu, MoreActionsMenu, context panels) overflowed horizontally at
// ~390px and could be partly unreachable.
//
// The clamp runs ONLY at/below the mobile breakpoint (MOBILE_CLAMP_MAX_WIDTH):
// PopoverComponent gates it via `popoverStyleForViewport`, which returns the RAW
// pre-M0 position verbatim above 880px so the DESKTOP UI stays byte-identical
// (that 880px line is the plan's exact byte-identity boundary). At/below 880px
// the panel is clamped so it stays inside a [8px, viewport-8px] safe box
// HORIZONTALLY (both edges reserved); the VERTICAL clamp pins only the panel's
// leading edge and relies on the CSS `max-height: calc(100vh - 16px)` +
// `overflow:auto` (styles.css `.mc-popover`) to bound a tall panel's trailing
// edge. The phone/small-tablet edge-trap is what the clamp targets.

export type PopoverAnchor = { x: number; y: number };
export type PopoverSide = "bottom" | "top" | "left" | "right";
export type PopoverViewport = { width: number; height: number };

// Keep the panel this far from every viewport edge.
const EDGE_MARGIN = 8;

// The mobile-clamp gate: the viewport clamp runs ONLY at/below this width. Above
// it (desktop) `popoverStyleForViewport` returns the raw pre-M0 position so the
// desktop UI is provably byte-identical — this is the plan's exact byte-identity
// line ("Desktop (>880px) must stay byte-identical").
export const MOBILE_CLAMP_MAX_WIDTH = 880;

// The CSS width cap the stylesheet enforces
// (`.mc-popover { max-width: min(360px, calc(100vw - 16px)) }`). The real DOM
// width is unknown at position-compute time (the panel isn't mounted yet), so
// the cap is used as the panel's worst-case width. Consequence: a NARROW popover
// anchored within ~half-the-cap of an edge shifts inward slightly more than
// strictly necessary. This over-clamp only ever happens at/below the mobile
// breakpoint (the clamp is gated to <=880px), where keeping the panel off the
// screen edges is the whole point — so the slight extra inset is
// acceptable/desirable there, NOT a desktop regression (desktop takes the raw
// path and is untouched).
const MAX_WIDTH = 360;

// Clamp `value` into [min, max]; when the range is inverted (a viewport narrower
// than the panel) fall back to `fallback` (viewport center) rather than emit an
// inverted clamp or NaN.
function clampRange(value: number, min: number, max: number, fallback: number): number {
  if (!(max >= min)) return fallback;
  return Math.min(max, Math.max(min, value));
}

// The ORIGINAL (pre-M0) unclamped math, kept for the no-window fallback path so
// SSR / a window-less test render behaves exactly as before.
export function rawPopoverStyle(anchor: PopoverAnchor, side: PopoverSide, offset: number): React.CSSProperties {
  switch (side) {
    case "top":
      return { position: "fixed", left: anchor.x, bottom: `calc(100vh - ${anchor.y - offset}px)` };
    case "left":
      return { position: "fixed", top: anchor.y, right: `calc(100vw - ${anchor.x - offset}px)` };
    case "right":
      return { position: "fixed", top: anchor.y, left: anchor.x + offset };
    case "bottom":
    default:
      return { position: "fixed", left: anchor.x, top: anchor.y + offset };
  }
}

// Viewport-clamped position for the MOBILE breakpoint (<=880px; gated by
// `popoverStyleForViewport`). `view` is injected (window-free) so this is pure
// and unit-testable. The translateX(-50%) sides (top/bottom) center on `left`;
// the translateY(-50%) sides (left/right) center on `top`. HORIZONTALLY the
// clamp keeps the centered axis inside EDGE_MARGIN + half the width cap and
// reserves the full cap on the growth (left/right) sides so BOTH panel edges
// stay in-box. VERTICALLY it pins only the leading edge inside the margin — a
// tall panel's trailing edge is bounded by the CSS max-height + overflow, not
// this math. For an in-bounds anchor every clamp is a no-op, so the emitted
// position equals rawPopoverStyle for those cases.
export function clampPopoverStyle(anchor: PopoverAnchor, side: PopoverSide, offset: number, view: PopoverViewport): React.CSSProperties {
  const vw = view.width;
  const vh = view.height;
  const halfW = Math.min(MAX_WIDTH, vw - 2 * EDGE_MARGIN) / 2;
  // Horizontal center for the translateX(-50%) sides.
  const centerX = clampRange(anchor.x, EDGE_MARGIN + halfW, vw - EDGE_MARGIN - halfW, vw / 2);
  switch (side) {
    case "top":
      // Grows UP from a bottom edge at (anchor.y - offset); keep that edge in-box.
      return { position: "fixed", left: centerX, bottom: vh - clampRange(anchor.y - offset, EDGE_MARGIN, vh - EDGE_MARGIN, vh / 2) };
    case "left":
      // Grows LEFT from a right edge at (anchor.x - offset); reserve the cap width so the far (left) edge stays in-box (mirror of the right side).
      return { position: "fixed", top: clampRange(anchor.y, EDGE_MARGIN, vh - EDGE_MARGIN, vh / 2), right: vw - clampRange(anchor.x - offset, EDGE_MARGIN + 2 * halfW, vw - EDGE_MARGIN, vw - EDGE_MARGIN) };
    case "right":
      // Grows RIGHT from a left edge at (anchor.x + offset); reserve the cap width so the far edge stays in-box.
      return { position: "fixed", top: clampRange(anchor.y, EDGE_MARGIN, vh - EDGE_MARGIN, vh / 2), left: clampRange(anchor.x + offset, EDGE_MARGIN, vw - EDGE_MARGIN - 2 * halfW, EDGE_MARGIN) };
    case "bottom":
    default:
      // Grows DOWN from a top edge at (anchor.y + offset); keep that edge in-box.
      return { position: "fixed", left: centerX, top: clampRange(anchor.y + offset, EDGE_MARGIN, vh - EDGE_MARGIN, vh / 2) };
  }
}

// The mobile-clamp GATE, applied purely (window-free; the viewport is injected).
// Returns the raw pre-M0 position when there's no viewport (SSR / window-less
// render) OR the viewport is wider than the mobile breakpoint (desktop =>
// byte-identical, including the top/left `calc(...)` strings); otherwise clamps
// so a phone / small-tablet popover stays inside the safe box. PopoverComponent
// reads the live window and delegates here so the desktop-raw / mobile-clamp
// split is a single, testable pure function.
export function popoverStyleForViewport(
  anchor: PopoverAnchor,
  side: PopoverSide,
  offset: number,
  view: PopoverViewport | null,
): React.CSSProperties {
  // `!(width <= MAX)` also routes a NaN width to the raw path (SSR safety).
  if (!view || !(view.width <= MOBILE_CLAMP_MAX_WIDTH)) return rawPopoverStyle(anchor, side, offset);
  return clampPopoverStyle(anchor, side, offset, view);
}
