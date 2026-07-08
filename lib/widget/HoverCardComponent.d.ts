import React from "react";
export interface HoverCardProps {
    id: string;
    content: React.ReactNode;
    side?: "bottom" | "top" | "left" | "right";
    openDelayMs?: number;
    closeDelayMs?: number;
    disabled?: boolean;
    payload?: unknown;
    ariaLabel?: string;
    className?: string;
    as?: "span" | "div";
    children: React.ReactNode;
}
export declare function HoverCard({ id, content, side, openDelayMs, closeDelayMs, disabled, payload, ariaLabel, className, as, children }: HoverCardProps): import("react/jsx-runtime").JSX.Element;
