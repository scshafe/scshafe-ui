import React from "react";
import { type BaseLayoutProps, type SpaceToken } from "./layoutShared.js";
export type InlineAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type InlineJustify = "start" | "center" | "end" | "between" | "around" | "evenly";
export interface InlineProps extends BaseLayoutProps {
    gap?: SpaceToken;
    align?: InlineAlign;
    justify?: InlineJustify;
    wrap?: boolean;
}
export declare const Inline: React.ForwardRefExoticComponent<InlineProps & React.RefAttributes<HTMLElement>>;
