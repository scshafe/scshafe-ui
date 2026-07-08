import type React from "react";
export type PopoverAnchor = {
    x: number;
    y: number;
};
export type PopoverSide = "bottom" | "top" | "left" | "right";
export type PopoverViewport = {
    width: number;
    height: number;
};
export declare const MOBILE_CLAMP_MAX_WIDTH = 880;
export declare function rawPopoverStyle(anchor: PopoverAnchor, side: PopoverSide, offset: number): React.CSSProperties;
export declare function clampPopoverStyle(anchor: PopoverAnchor, side: PopoverSide, offset: number, view: PopoverViewport): React.CSSProperties;
export declare function popoverStyleForViewport(anchor: PopoverAnchor, side: PopoverSide, offset: number, view: PopoverViewport | null): React.CSSProperties;
