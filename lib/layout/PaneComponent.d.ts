import React, { type ReactNode } from "react";
import { type BaseLayoutProps, type SpaceToken } from "./layoutShared.js";
export type PaneBodyScroll = "auto" | "always" | "never";
export type PaneHeight = "fill" | "auto";
export interface PaneProps extends BaseLayoutProps {
    header?: ReactNode;
    footer?: ReactNode;
    bodyScroll?: PaneBodyScroll;
    height?: PaneHeight;
    padding?: SpaceToken;
}
export declare const Pane: React.ForwardRefExoticComponent<PaneProps & React.RefAttributes<HTMLElement>>;
