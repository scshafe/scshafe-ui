import React from "react";
export interface RailWorkspaceProps {
    children: React.ReactNode;
    className?: string;
    /** "narrow" (default): column at ≤560px. "mobile": column at ≤880px. */
    stackAt?: "narrow" | "mobile";
    dataMcComponent?: string;
    ariaLabel?: string;
}
export declare function RailWorkspace({ children, className, stackAt, dataMcComponent, ariaLabel }: RailWorkspaceProps): React.JSX.Element;
