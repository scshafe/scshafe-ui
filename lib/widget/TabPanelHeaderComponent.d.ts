import React from "react";
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
    dataMcComponent?: string;
}
export declare function TabPanelHeader({ title, headingLevel, aside, statusLabel, refresh, leading, actions, className, dataMcComponent }: TabPanelHeaderProps): React.JSX.Element;
