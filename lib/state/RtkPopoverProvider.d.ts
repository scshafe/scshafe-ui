import React from "react";
export interface RtkPopoverProviderProps {
    children: React.ReactNode;
    devUxEnabled?: boolean;
}
export declare function RtkPopoverProvider({ children, devUxEnabled }: RtkPopoverProviderProps): React.JSX.Element;
