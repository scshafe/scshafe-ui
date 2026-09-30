import React from "react";
import { IconButton } from "../../primitive/ButtonComponent.js";
import { CollapsibleListRail } from "./CollapsibleListRailComponent.js";

export interface FocusSelectionListAction {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  disabled?: boolean;
  tooltip?: string;
}

export interface FocusSelectionListAddAction extends FocusSelectionListAction {
  icon?: string;
}

export interface FocusSelectionListProps {
  surfaceId: string;
  title: string;
  count?: number;
  ariaLabel?: string;
  refresh?: FocusSelectionListAction;
  add?: FocusSelectionListAddAction;
  /** An optional SECOND add-style action, rendered before the primary add (e.g. the
   *  P0-A3 "no-consequence chat" entry alongside the normal "new chat"). Non-primary. */
  secondaryAdd?: FocusSelectionListAddAction;
  className?: string;
  /** M4 mobile-triage: when set, the underlying rail ignores a carried-over desktop
   *  collapse on mobile so its rows render in the phone list view. Opt-in per rail
   *  (the chats master-detail); default off keeps every other focus tab unchanged. */
  expandOnMobile?: boolean;
  children: React.ReactNode;
}

// Generic focus-tab selection rail: a card-style CollapsibleListRail whose
// header carries the focus name (+ count), an optional refresh button, and
// an optional add (+) button. This is the chats-tab rail pattern lifted
// into a reusable widget for every focus tab that follows the "many items,
// view one at a time" shape (chats, plans, architectures, agents, ...).
//
// Add-button clicks pass the React event through so callers can position
// follow-up popovers against the button's bounding rect (the rendered
// IconButton is already a data-sui-popover-anchor so outside-click won't
// close such popovers when re-clicking the trigger).
export function FocusSelectionList({
  surfaceId,
  title,
  count,
  ariaLabel,
  refresh,
  add,
  secondaryAdd,
  className,
  expandOnMobile,
  children,
}: FocusSelectionListProps) {
  const displayTitle = count !== undefined ? `${title} (${count})` : title;
  const actions = (refresh || add || secondaryAdd) ? (
    <>
      {refresh ? (
        <IconButton
          label={refresh.label}
          icon="action.refresh"
          size="mini"
          tooltip={refresh.tooltip}
          disabled={refresh.disabled}
          onClick={refresh.onClick}
        />
      ) : null}
      {secondaryAdd ? (
        <IconButton
          label={secondaryAdd.label}
          icon={secondaryAdd.icon ?? "action.add"}
          size="mini"
          tooltip={secondaryAdd.tooltip}
          disabled={secondaryAdd.disabled}
          onClick={secondaryAdd.onClick}
        />
      ) : null}
      {add ? (
        <IconButton
          label={add.label}
          icon={add.icon ?? "action.add"}
          variant="primary"
          size="mini"
          tooltip={add.tooltip}
          disabled={add.disabled}
          onClick={add.onClick}
          data-sui-popover-anchor=""
        />
      ) : null}
    </>
  ) : null;
  return (
    <CollapsibleListRail
      surfaceId={surfaceId}
      title={displayTitle}
      ariaLabel={ariaLabel ?? displayTitle}
      actions={actions}
      className={className}
      expandOnMobile={expandOnMobile}
    >
      {children}
    </CollapsibleListRail>
  );
}
