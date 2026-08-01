import React from "react";
export interface FocusTabItemModel {
    key: string;
    id: string;
    icon: string;
    tooltip?: string;
    countBadges?: ReadonlyArray<{
        label: string;
        value: number | string;
    }>;
    className?: string;
    ariaSelected?: boolean;
    controlsId?: string;
    disabled?: boolean;
    dividerBefore?: boolean;
}
export interface FocusTabsModel {
    className?: string;
    role?: string;
    ariaLabel?: string;
    ariaOrientation?: "horizontal" | "vertical";
    tooltip?: unknown;
    items: ReadonlyArray<FocusTabItemModel>;
}
export interface FocusTabsProps {
    model: FocusTabsModel | null | undefined;
    onSelect?: (item: FocusTabItemModel) => void;
    wrapItem?: (item: FocusTabItemModel, button: React.ReactNode) => React.ReactNode;
}
export declare function FocusTabs({ model, onSelect, wrapItem }: FocusTabsProps): React.JSX.Element | null;
export { FocusTabs as FocusTabsComponent };
