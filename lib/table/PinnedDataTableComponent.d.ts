import React from "react";
export interface PinnedDataTableColumn<Row> {
    id: string;
    header: React.ReactNode;
    ariaLabel?: string;
    className?: string;
    headerClassName?: string;
    cellClassName?: string | ((row: Row, rowIndex: number) => string | undefined);
    pinned?: "left";
    rowHeader?: boolean;
    minWidth?: number | string;
    width?: number | string;
    maxWidth?: number | string;
    wrap?: "nowrap" | "normal";
    lineClamp?: number;
    align?: "left" | "right" | "center";
    render: (row: Row, rowIndex: number) => React.ReactNode;
}
export interface PinnedDataTableProps<Row> {
    ariaLabel: string;
    columns: ReadonlyArray<PinnedDataTableColumn<Row>>;
    rows: ReadonlyArray<Row>;
    rowKey: (row: Row, rowIndex: number) => string;
    className?: string;
    tableClassName?: string;
    getRowClassName?: (row: Row, rowIndex: number) => string | undefined;
    tableId?: string;
    onColumnWidthSet?: (columnId: string, width: number) => void;
    onColumnWidthReset?: (columnId: string) => void;
}
export declare function PinnedDataTable<Row>({ ariaLabel, columns, rows, rowKey, className, tableClassName, getRowClassName, tableId, onColumnWidthSet, onColumnWidthReset, }: PinnedDataTableProps<Row>): React.JSX.Element;
