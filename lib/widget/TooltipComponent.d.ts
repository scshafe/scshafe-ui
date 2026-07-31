import React from "react";
type Side = "bottom" | "top" | "left" | "right";
export interface TooltipProps {
    tooltip?: unknown;
    fallback?: unknown;
    side?: Side;
    openDelayMs?: number;
    closeDelayMs?: number;
    className?: string;
    as?: "span" | "div";
    children: React.ReactNode;
}
export declare function Tooltip({ tooltip, fallback, side, openDelayMs, closeDelayMs, className, as, children }: TooltipProps): React.JSX.Element;
export {};
