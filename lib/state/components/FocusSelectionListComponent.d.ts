import React from "react";
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
export declare function FocusSelectionList({ surfaceId, title, count, ariaLabel, refresh, add, secondaryAdd, className, expandOnMobile, children, }: FocusSelectionListProps): React.JSX.Element;
