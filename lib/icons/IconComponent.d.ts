import React from "react";
export interface IconProps {
    name: string;
    size?: number | string;
    strokeWidth?: number;
    className?: string;
    "aria-label"?: string;
    title?: string;
    [extra: string]: unknown;
}
export declare function Icon({ name, size, strokeWidth, className, "aria-label": ariaLabel, title, ...rest }: IconProps): React.JSX.Element;
