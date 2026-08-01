import { type PayloadAction } from "@reduxjs/toolkit";
export type DataTableColumnMoveDirection = "left" | "right" | "up" | "down";
export interface DataTablePreference {
    hiddenColumnIds: string[];
    columnOrder: string[];
    widthsByColumnId: Record<string, number>;
}
export interface DataTablePreferencesState {
    byTableId: Record<string, DataTablePreference>;
}
export interface DataTableColumnLike {
    id: string;
    width?: number | string;
}
export interface MergeDataTableColumnPreferencesOptions {
    includeHidden?: boolean;
}
export declare const DataTablePreferences: import("@reduxjs/toolkit").Slice<DataTablePreferencesState, {
    dataTableColumnHiddenToggled(state: {
        byTableId: {
            [x: string]: {
                hiddenColumnIds: string[];
                columnOrder: string[];
                widthsByColumnId: {
                    [x: string]: number;
                };
            };
        };
    }, action: PayloadAction<{
        tableId?: string;
        columnId?: string;
    }>): void;
    dataTableColumnMoved(state: {
        byTableId: {
            [x: string]: {
                hiddenColumnIds: string[];
                columnOrder: string[];
                widthsByColumnId: {
                    [x: string]: number;
                };
            };
        };
    }, action: PayloadAction<{
        tableId?: string;
        columnId?: string;
        direction?: DataTableColumnMoveDirection;
        columnIds?: unknown;
    }>): void;
    dataTableColumnWidthSet(state: {
        byTableId: {
            [x: string]: {
                hiddenColumnIds: string[];
                columnOrder: string[];
                widthsByColumnId: {
                    [x: string]: number;
                };
            };
        };
    }, action: PayloadAction<{
        tableId?: string;
        columnId?: string;
        width?: number;
    }>): void;
    dataTableColumnWidthReset(state: {
        byTableId: {
            [x: string]: {
                hiddenColumnIds: string[];
                columnOrder: string[];
                widthsByColumnId: {
                    [x: string]: number;
                };
            };
        };
    }, action: PayloadAction<{
        tableId?: string;
        columnId?: string;
    }>): void;
    dataTablePreferencesReset(state: {
        byTableId: {
            [x: string]: {
                hiddenColumnIds: string[];
                columnOrder: string[];
                widthsByColumnId: {
                    [x: string]: number;
                };
            };
        };
    }, action: PayloadAction<{
        tableId?: string;
    }>): void;
}, "DataTablePreferences", "DataTablePreferences", import("@reduxjs/toolkit").SliceSelectors<DataTablePreferencesState>>;
export declare const dataTableColumnHiddenToggled: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    tableId?: string;
    columnId?: string;
}, "DataTablePreferences/dataTableColumnHiddenToggled">, dataTableColumnMoved: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    tableId?: string;
    columnId?: string;
    direction?: DataTableColumnMoveDirection;
    columnIds?: unknown;
}, "DataTablePreferences/dataTableColumnMoved">, dataTableColumnWidthSet: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    tableId?: string;
    columnId?: string;
    width?: number;
}, "DataTablePreferences/dataTableColumnWidthSet">, dataTableColumnWidthReset: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    tableId?: string;
    columnId?: string;
}, "DataTablePreferences/dataTableColumnWidthReset">, dataTablePreferencesReset: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    tableId?: string;
}, "DataTablePreferences/dataTablePreferencesReset">;
export declare function selectDataTablePreferencesState(state?: any): DataTablePreferencesState;
export declare function selectDataTablePreferencesForTable(state: any | undefined, tableId: string): DataTablePreference | null;
export declare function mergeDataTableColumnsWithPreferences<Column extends DataTableColumnLike>(defaultColumns: ReadonlyArray<Column>, preferences?: DataTablePreference | null, options?: MergeDataTableColumnPreferencesOptions): Column[];
