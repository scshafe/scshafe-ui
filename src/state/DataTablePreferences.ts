import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// ============================================================================
// DataTablePreferences — per-table column preferences (hidden columns, order,
// drag-set widths), keyed by `tableId`. Moved from MC's
// web/src/state/DataTablePreferencesManager.ts (behavior unchanged; slice name
// normalized for the library). This is the state half of PinnedDataTable's
// host-owned width callbacks: wire `onColumnWidthSet`/`onColumnWidthReset` to
// dataTableColumnWidthSet/-Reset and merge columns with
// `mergeDataTableColumnsWithPreferences` before rendering.
// ============================================================================

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

const initialState: DataTablePreferencesState = {
  byTableId: {}
};

function normalizeId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of values) {
    const id = normalizeId(value);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function tablePreferencesForWrite(state: DataTablePreferencesState, tableId: string): DataTablePreference {
  state.byTableId[tableId] ??= { hiddenColumnIds: [], columnOrder: [], widthsByColumnId: {} };
  return state.byTableId[tableId];
}

function pruneTablePreferences(state: DataTablePreferencesState, tableId: string): void {
  const preferences = state.byTableId[tableId];
  if (!preferences) return;
  const hasHidden = preferences.hiddenColumnIds.length > 0;
  const hasOrder = preferences.columnOrder.length > 0;
  const hasWidths = Object.keys(preferences.widthsByColumnId).length > 0;
  if (!hasHidden && !hasOrder && !hasWidths) delete state.byTableId[tableId];
}

function normalizeWidth(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(48, Math.min(1200, Math.round(value)));
}

function moveColumn(columnOrder: string[], columnId: string, direction: DataTableColumnMoveDirection): string[] {
  const index = columnOrder.indexOf(columnId);
  if (index === -1) return columnOrder;
  const delta = direction === "left" || direction === "up" ? -1 : 1;
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= columnOrder.length) return columnOrder;
  const nextOrder = [...columnOrder];
  const [item] = nextOrder.splice(index, 1);
  if (!item) return columnOrder;
  nextOrder.splice(nextIndex, 0, item);
  return nextOrder;
}

export const DataTablePreferences = createSlice({
  name: "DataTablePreferences",
  initialState,
  reducers: {
    dataTableColumnHiddenToggled(state, action: PayloadAction<{ tableId?: string; columnId?: string }>) {
      const tableId = normalizeId(action.payload?.tableId);
      const columnId = normalizeId(action.payload?.columnId);
      if (!tableId || !columnId) return;
      const preferences = tablePreferencesForWrite(state, tableId);
      if (preferences.hiddenColumnIds.includes(columnId)) {
        preferences.hiddenColumnIds = preferences.hiddenColumnIds.filter((id) => id !== columnId);
      } else {
        preferences.hiddenColumnIds.push(columnId);
      }
      pruneTablePreferences(state, tableId);
    },
    dataTableColumnMoved(state, action: PayloadAction<{ tableId?: string; columnId?: string; direction?: DataTableColumnMoveDirection; columnIds?: unknown }>) {
      const tableId = normalizeId(action.payload?.tableId);
      const columnId = normalizeId(action.payload?.columnId);
      const direction = action.payload?.direction;
      if (!tableId || !columnId || !direction) return;
      const baseOrder = normalizeIdList(action.payload?.columnIds);
      const preferences = tablePreferencesForWrite(state, tableId);
      const order = baseOrder.length > 0 ? baseOrder : preferences.columnOrder;
      preferences.columnOrder = moveColumn(order, columnId, direction);
      pruneTablePreferences(state, tableId);
    },
    dataTableColumnWidthSet(state, action: PayloadAction<{ tableId?: string; columnId?: string; width?: number }>) {
      const tableId = normalizeId(action.payload?.tableId);
      const columnId = normalizeId(action.payload?.columnId);
      const width = normalizeWidth(action.payload?.width);
      if (!tableId || !columnId || width === null) return;
      tablePreferencesForWrite(state, tableId).widthsByColumnId[columnId] = width;
    },
    dataTableColumnWidthReset(state, action: PayloadAction<{ tableId?: string; columnId?: string }>) {
      const tableId = normalizeId(action.payload?.tableId);
      const columnId = normalizeId(action.payload?.columnId);
      if (!tableId || !columnId) return;
      const preferences = state.byTableId[tableId];
      if (!preferences) return;
      delete preferences.widthsByColumnId[columnId];
      pruneTablePreferences(state, tableId);
    },
    dataTablePreferencesReset(state, action: PayloadAction<{ tableId?: string }>) {
      const tableId = normalizeId(action.payload?.tableId);
      if (!tableId) return;
      delete state.byTableId[tableId];
    }
  }
});

export const {
  dataTableColumnHiddenToggled,
  dataTableColumnMoved,
  dataTableColumnWidthSet,
  dataTableColumnWidthReset,
  dataTablePreferencesReset
} = DataTablePreferences.actions;

export function selectDataTablePreferencesState(state: any = {}): DataTablePreferencesState {
  return state?.DataTablePreferences ?? initialState;
}

export function selectDataTablePreferencesForTable(state: any = {}, tableId: string): DataTablePreference | null {
  return selectDataTablePreferencesState(state).byTableId[tableId] ?? null;
}

export function mergeDataTableColumnsWithPreferences<Column extends DataTableColumnLike>(
  defaultColumns: ReadonlyArray<Column>,
  preferences?: DataTablePreference | null,
  options: MergeDataTableColumnPreferencesOptions = {}
): Column[] {
  const columnsById = new Map(defaultColumns.map((column) => [column.id, column]));
  const knownIds = new Set(columnsById.keys());
  const hiddenIds = new Set((preferences?.hiddenColumnIds ?? []).filter((id) => knownIds.has(id)));
  const orderedIds = normalizeIdList(preferences?.columnOrder).filter((id) => knownIds.has(id));
  const orderedIdSet = new Set(orderedIds);
  const finalIds = [
    ...orderedIds,
    ...defaultColumns.map((column) => column.id).filter((id) => !orderedIdSet.has(id))
  ];
  return finalIds.flatMap((id) => {
    if (!options.includeHidden && hiddenIds.has(id)) return [];
    const column = columnsById.get(id);
    if (!column) return [];
    const width = preferences?.widthsByColumnId?.[id];
    return typeof width === "number" && Number.isFinite(width)
      ? [{ ...column, width } as Column]
      : [column];
  });
}
