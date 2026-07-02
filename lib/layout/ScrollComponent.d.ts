import React from "react";
import { type BaseLayoutProps } from "./layoutShared.js";
export type ScrollAxis = "y" | "x" | "both";
export type ScrollDimension = "fill" | "auto";
export interface ScrollProps extends BaseLayoutProps {
    axis?: ScrollAxis;
    height?: ScrollDimension;
    width?: ScrollDimension;
}
export declare const Scroll: React.ForwardRefExoticComponent<ScrollProps & React.RefAttributes<HTMLElement>>;
