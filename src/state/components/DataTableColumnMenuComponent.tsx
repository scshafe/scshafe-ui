import React from "react";
import { useDispatch } from "react-redux";
import { useIcon } from "../../widget/IconContext.js";
import { popoverOpened } from "../Popovers.js";
import {
  dataTableColumnHiddenToggled,
  dataTableColumnMoved,
  dataTableColumnWidthReset,
  dataTableColumnWidthSet,
  dataTablePreferencesReset,
  mergeDataTableColumnsWithPreferences,
  type DataTablePreference
} from "../DataTablePreferences.js";
import { IconButton } from "../../primitive/ButtonComponent.js";
import { Popover } from "../../widget/PopoverComponent.js";
import type { PinnedDataTableColumn } from "../../table/PinnedDataTableComponent.js";

export interface DataTableColumnMenuProps<Row> {
  tableId: string;
  columns: ReadonlyArray<PinnedDataTableColumn<Row>>;
  preferences?: DataTablePreference | null;
  label?: string;
}

function headerLabel<Row>(column: PinnedDataTableColumn<Row>): string {
  if (typeof column.header === "string" || typeof column.header === "number") return String(column.header);
  return column.ariaLabel ?? column.id;
}

function widthPlaceholder<Row>(column: PinnedDataTableColumn<Row>): string | undefined {
  if (typeof column.width === "number") return String(column.width);
  if (typeof column.width === "string") return column.width;
  return undefined;
}

interface ColumnWidthInputProps {
  width: number | "";
  placeholder?: string;
  label: string;
  onCommit: (width: number | null) => void;
}

// The typed width is a draft until Enter or leaving the field: committing each keystroke would
// clamp "1" (on the way to "180") to the 48px minimum. An empty field resets to the default.
function ColumnWidthInput({ width, placeholder, label, onCommit }: ColumnWidthInputProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const parsed = Number.parseFloat(draft);
    setDraft(null);
    if (draft.trim() === "") onCommit(null);
    else if (Number.isFinite(parsed)) onCommit(parsed);
  };
  return (
    <input
      className="sui-data-table-column-width-input"
      type="number"
      min={48}
      max={1200}
      step={10}
      value={draft ?? width}
      placeholder={placeholder}
      aria-label={label}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
}

export function DataTableColumnMenu<Row>({
  tableId,
  columns,
  preferences = null,
  label = "Configure columns"
}: DataTableColumnMenuProps<Row>) {
  const dispatch = useDispatch();
  const renderIcon = useIcon();
  const popoverId = `data-table-columns:${tableId}`;
  const configuredColumns = mergeDataTableColumnsWithPreferences(columns, preferences, { includeHidden: true });
  const configuredColumnIds = configuredColumns.map((column) => column.id);
  const hiddenColumnIds = new Set(preferences?.hiddenColumnIds ?? []);
  const widthsByColumnId = preferences?.widthsByColumnId ?? {};
  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect?.() ?? { left: 0, right: 0, bottom: 0 };
    dispatch(popoverOpened({ id: popoverId, anchor: { x: rect.right, y: rect.bottom } }));
  };
  return (
    <span className="sui-data-table-column-menu" data-sui-component="DataTableColumnMenu" data-sui-table-column-menu={tableId} data-sui-popover-anchor="">
      <IconButton
        label={label}
        icon="action.settings"
        variant="secondary"
        onClick={openMenu}
      />
      <Popover id={popoverId} side="bottom" ariaLabel={label}>
        <div className="sui-data-table-column-menu-panel">
          <div className="sui-data-table-column-menu-header">
            <strong>Columns</strong>
            <button
              type="button"
              className="sui-button sui-button-secondary sui-button-mini"
              data-sui-table-preferences-reset={tableId}
              onClick={() => dispatch(dataTablePreferencesReset({ tableId }))}
            >
              Reset all
            </button>
          </div>
          <div className="sui-data-table-column-menu-list" role="list">
            {configuredColumns.map((column, index) => {
              const columnLabel = headerLabel(column);
              const hidden = hiddenColumnIds.has(column.id);
              const widthValue = widthsByColumnId[column.id] ?? "";
              return (
                <div className="sui-data-table-column-menu-row" role="listitem" key={column.id} data-sui-table-column-menu-row={column.id}>
                  <label className="sui-data-table-column-visibility">
                    <input
                      type="checkbox"
                      checked={!hidden}
                      onChange={() => dispatch(dataTableColumnHiddenToggled({ tableId, columnId: column.id }))}
                    />
                    <span>{columnLabel}</span>
                  </label>
                  <button
                    type="button"
                    className="sui-data-table-column-order-button"
                    aria-label={`Move ${columnLabel} up`}
                    disabled={index === 0}
                    onClick={() => dispatch(dataTableColumnMoved({ tableId, columnId: column.id, direction: "up", columnIds: configuredColumnIds }))}
                  >
                    {renderIcon("action.collapse", { size: 12, "aria-hidden": "true" })}
                  </button>
                  <button
                    type="button"
                    className="sui-data-table-column-order-button"
                    aria-label={`Move ${columnLabel} down`}
                    disabled={index === configuredColumns.length - 1}
                    onClick={() => dispatch(dataTableColumnMoved({ tableId, columnId: column.id, direction: "down", columnIds: configuredColumnIds }))}
                  >
                    {renderIcon("action.expand", { size: 12, "aria-hidden": "true" })}
                  </button>
                  <ColumnWidthInput
                    width={widthValue}
                    placeholder={widthPlaceholder(column)}
                    label={`${columnLabel} width`}
                    onCommit={(width) => dispatch(width === null
                      ? dataTableColumnWidthReset({ tableId, columnId: column.id })
                      : dataTableColumnWidthSet({ tableId, columnId: column.id, width }))}
                  />
                  <button
                    type="button"
                    className="sui-data-table-column-order-button"
                    aria-label={`Reset ${columnLabel} width`}
                    onClick={() => dispatch(dataTableColumnWidthReset({ tableId, columnId: column.id }))}
                  >
                    {renderIcon("action.refresh", { size: 12, "aria-hidden": "true" })}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Popover>
    </span>
  );
}
