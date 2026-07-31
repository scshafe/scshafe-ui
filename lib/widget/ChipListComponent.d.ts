import React from "react";
export interface ChipListItem {
    label: string;
    tooltip?: string;
    status?: string;
}
export interface ChipListProps {
    items: ReadonlyArray<ChipListItem>;
    dataMcComponent?: string;
}
export declare function ChipList(props: ChipListProps): React.JSX.Element;
