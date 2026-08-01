import React from "react";
export interface StatCountProps {
    state: string;
    count: number | string;
    tooltip?: unknown;
}
export declare function StatCount({ state, count, tooltip }: StatCountProps): React.JSX.Element;
