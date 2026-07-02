import React from "react";
import { type BaseLayoutProps, type ClampToken, type SpaceToken } from "./layoutShared.js";
export type StackAlign = "start" | "center" | "end" | "stretch";
export interface StackProps extends BaseLayoutProps {
    gap?: SpaceToken;
    align?: StackAlign;
    itemHeight?: ClampToken;
}
export declare const Stack: React.ForwardRefExoticComponent<StackProps & React.RefAttributes<HTMLElement>>;
