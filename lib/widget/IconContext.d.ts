import React from "react";
export interface IconRenderProps {
    size?: number;
    strokeWidth?: number;
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
    "aria-label"?: string;
    title?: string;
    [extra: string]: unknown;
}
export type IconRenderer = (name: string, props?: IconRenderProps) => React.ReactNode;
export declare const IconContext: React.Context<IconRenderer>;
export declare function useIcon(): IconRenderer;
