import React from "react";
import { type DataTablePreference } from "../DataTablePreferences.js";
import type { PinnedDataTableColumn } from "../../table/PinnedDataTableComponent.js";
export interface DataTableColumnMenuProps<Row> {
    tableId: string;
    columns: ReadonlyArray<PinnedDataTableColumn<Row>>;
    preferences?: DataTablePreference | null;
    label?: string;
}
export declare function DataTableColumnMenu<Row>({ tableId, columns, preferences, label }: DataTableColumnMenuProps<Row>): React.JSX.Element;
