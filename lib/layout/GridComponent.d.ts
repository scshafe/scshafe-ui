import React from "react";
import { type BaseLayoutProps, type ClampToken, type SpaceToken } from "./layoutShared.js";
export type GridColumns = {
    kind: "equal";
    count: number;
} | {
    kind: "autoFit";
    minSize: string;
};
export type GridAlign = "start" | "center" | "end" | "stretch";
export type GridJustify = "start" | "center" | "end" | "stretch";
export interface GridProps extends BaseLayoutProps {
    columns: GridColumns;
    gap?: SpaceToken;
    rowGap?: SpaceToken;
    columnGap?: SpaceToken;
    rowHeight?: ClampToken;
    align?: GridAlign;
    justify?: GridJustify;
}
export declare const Grid: React.ForwardRefExoticComponent<GridProps & React.RefAttributes<HTMLElement>>;
