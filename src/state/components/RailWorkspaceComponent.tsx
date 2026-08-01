import React from "react";

// ============================================================================
// RailWorkspace — the rail + detail focus-tab body (L2). The pattern MC carried
// as FOUR hand-rolled per-tab copies (.architecture-workspace,
// .project-notes-workspace, .implementation-plan-workspace,
// .project-chat-live-grid — literally the same declaration + duplicated rail
// chrome), written once with the contained-scroll and responsive behavior owned
// by package CSS. Supersedes the never-adopted SplitWorkspace.
//
//   <RailWorkspace className="project-tab-fill">
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
  dataMcComponent?: string;
  ariaLabel?: string;
}

export function RailWorkspace({ children, className, stackAt = "narrow", dataMcComponent = "RailWorkspace", ariaLabel }: RailWorkspaceProps) {
  const classes = ["mc-rail-workspace", stackAt === "mobile" ? "mc-rail-workspace--stack-mobile" : null, className]
    .filter(Boolean).join(" ");
  return (
    <div className={classes} data-mc-component={dataMcComponent} aria-label={ariaLabel}>
      {children}
    </div>
  );
}
