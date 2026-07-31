import React from "react";
export interface KbdProps {
    children?: React.ReactNode;
    keys?: ReadonlyArray<string>;
    ariaLabel?: string;
}
export declare function Kbd({ children, keys, ariaLabel }: KbdProps): React.JSX.Element;
