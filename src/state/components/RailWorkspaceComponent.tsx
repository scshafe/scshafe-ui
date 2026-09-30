import React from "react";

// ============================================================================
// RailWorkspace — the rail + detail focus-tab body (L2), with the
// contained-scroll and responsive behavior owned by package CSS.
//
//   <RailWorkspace>
//     <FocusSelectionList surfaceId="plans" title="Plans" count={12}>…</FocusSelectionList>
//     <Scroll axis="y">…detail…</Scroll>
//   </RailWorkspace>
//
// Layout contract: flex row, clipped, `flex: 1 1 0` so it IS the growing child
// of a pinned-children panel; the rail owns its own scroll; stacks to a column
// at ≤560px (rail capped at 38vh), or already at ≤880px with
// stackAt="mobile" (the chat master-detail shape).
// ============================================================================

export interface RailWorkspaceProps {
  children: React.ReactNode;
  className?: string;
  /** "narrow" (default): column at ≤560px. "mobile": column at ≤880px. */
  stackAt?: "narrow" | "mobile";
  dataSuiComponent?: string;
  ariaLabel?: string;
}

export function RailWorkspace({ children, className, stackAt = "narrow", dataSuiComponent = "RailWorkspace", ariaLabel }: RailWorkspaceProps) {
  const classes = ["sui-rail-workspace", stackAt === "mobile" ? "sui-rail-workspace--stack-mobile" : null, className]
    .filter(Boolean).join(" ");
  return (
    <div className={classes} data-sui-component={dataSuiComponent} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
