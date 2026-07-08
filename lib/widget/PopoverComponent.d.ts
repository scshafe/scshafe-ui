import React from "react";
type Side = "bottom" | "top" | "left" | "right";
export interface PopoverProps {
    id: string;
    side?: Side;
    offset?: number;
    ariaLabel?: string;
    dataMcComponent?: string;
    children: React.ReactNode;
}
export declare function Popover({ id, side, offset, ariaLabel, dataMcComponent, children }: PopoverProps): import("react/jsx-runtime").JSX.Element | null;
export {};
