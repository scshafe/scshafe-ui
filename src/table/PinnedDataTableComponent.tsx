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

function joinClasses(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}

function cellClassName<Row>(column: PinnedDataTableColumn<Row>, row: Row, rowIndex: number): string | undefined {
  if (typeof column.cellClassName === "function") return column.cellClassName(row, rowIndex);
  return column.cellClassName;
}

type DataTableCellStyle = React.CSSProperties & Record<`--${string}`, string | undefined>;

function cssSize(value: number | string | undefined): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}px`;
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

function cssNameToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "column";
}

function liveWidthVariableName(tableId: string, columnId: string): string {
  return `--sui-data-table-${cssNameToken(tableId)}-${cssNameToken(columnId)}-width`;
}

function columnStyle<Row>(column: PinnedDataTableColumn<Row>, tableId?: string): DataTableCellStyle | undefined {
  const minWidth = cssSize(column.minWidth);
  const width = cssSize(column.width);
  const maxWidth = cssSize(column.maxWidth);
  const lineClamp = typeof column.lineClamp === "number" && Number.isFinite(column.lineClamp) && column.lineClamp > 0
    ? String(Math.round(column.lineClamp))
    : undefined;
  const liveWidth = tableId ? `var(${liveWidthVariableName(tableId, column.id)}, var(--sui-data-table-width, var(--sui-data-table-max-width, auto)))` : undefined;
  if (!minWidth && !width && !maxWidth && !lineClamp && !liveWidth) return undefined;
  return {
    "--sui-data-table-min-width": minWidth,
    "--sui-data-table-width": width,
    "--sui-data-table-max-width": maxWidth,
    "--sui-data-table-line-clamp": lineClamp,
    "--sui-data-table-live-width": liveWidth
  };
}

function numberFromData(value: string | undefined): number | null {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function findClosestElement(element: HTMLElement | null, selector: string): HTMLElement | null {
  return element?.closest?.(selector) as HTMLElement | null;
}

function resizeStartWidth(handleEl: HTMLElement, headerCell: HTMLElement | null): number {
  const measuredWidth = headerCell?.getBoundingClientRect?.().width;
  if (typeof measuredWidth === "number" && Number.isFinite(measuredWidth) && measuredWidth > 0) return measuredWidth;
  return numberFromData(handleEl.dataset.suiStartWidth) ?? 120;
}

const MIN_RESIZABLE_COLUMN_WIDTH = 72;
const MAX_RESIZABLE_COLUMN_WIDTH = 960;
const KEYBOARD_RESIZE_STEP = 8;
const KEYBOARD_RESIZE_LARGE_STEP = 32;

function clampResizableColumnWidth(value: number): number {
  return Math.max(MIN_RESIZABLE_COLUMN_WIDTH, Math.min(MAX_RESIZABLE_COLUMN_WIDTH, Math.round(value)));
}

function accessibleResizeWidth<Row>(column: PinnedDataTableColumn<Row>): number {
  const width = typeof column.width === "number"
    ? column.width
    : typeof column.width === "string" && /^\d+(?:\.\d+)?px$/.test(column.width.trim())
      ? Number.parseFloat(column.width)
      : 120;
  return clampResizableColumnWidth(width);
}

function announceResizeWidth(handleEl: HTMLElement, width: number): void {
  const roundedWidth = Math.round(width);
  handleEl.setAttribute("aria-valuenow", String(roundedWidth));
  handleEl.setAttribute("aria-valuetext", `${roundedWidth} pixels wide`);
}

export function PinnedDataTable<Row>({
  ariaLabel,
  columns,
  rows,
  rowKey,
  className,
  tableClassName,
  getRowClassName,
  tableId,
  onColumnWidthSet,
  onColumnWidthReset,
}: PinnedDataTableProps<Row>) {
  const resizingEnabled = Boolean(tableId && onColumnWidthSet && onColumnWidthReset);
  const resizeHandleFor = (column: PinnedDataTableColumn<Row>) => {
    if (!resizingEnabled || !tableId || !onColumnWidthSet || !onColumnWidthReset) return null;
    const label = typeof column.header === "string" ? column.header : column.ariaLabel ?? column.id;
    const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      const handleEl = event.currentTarget;
      const headerCell = findClosestElement(handleEl, "th");
      const startWidth = resizeStartWidth(handleEl, headerCell);
      handleEl.setPointerCapture?.(event.pointerId);
      handleEl.dataset.suiResizing = "true";
      handleEl.dataset.suiStartX = String(event.clientX);
      handleEl.dataset.suiStartWidth = String(startWidth);
      handleEl.dataset.suiLastWidth = String(startWidth);
      announceResizeWidth(handleEl, clampResizableColumnWidth(startWidth));
    };
    const handlePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
      const handleEl = event.currentTarget;
      if (handleEl.dataset.suiResizing !== "true") return;
      if (handleEl.hasPointerCapture && !handleEl.hasPointerCapture(event.pointerId)) return;
      const startX = numberFromData(handleEl.dataset.suiStartX);
      const startWidth = numberFromData(handleEl.dataset.suiStartWidth);
      if (startX === null || startWidth === null) return;
      const nextWidth = Math.max(MIN_RESIZABLE_COLUMN_WIDTH, Math.min(MAX_RESIZABLE_COLUMN_WIDTH, startWidth + event.clientX - startX));
      const tableElement = findClosestElement(handleEl, "table");
      tableElement?.style.setProperty(liveWidthVariableName(tableId, column.id), `${nextWidth}px`);
      handleEl.dataset.suiLastWidth = String(nextWidth);
      announceResizeWidth(handleEl, nextWidth);
    };
    const cleanupResize = (handleEl: HTMLElement, pointerId: number) => {
      if (handleEl.hasPointerCapture?.(pointerId)) handleEl.releasePointerCapture?.(pointerId);
      delete handleEl.dataset.suiResizing;
      delete handleEl.dataset.suiStartX;
      delete handleEl.dataset.suiStartWidth;
      delete handleEl.dataset.suiLastWidth;
    };
    const handlePointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
      const handleEl = event.currentTarget;
      const nextWidth = numberFromData(handleEl.dataset.suiLastWidth);
      cleanupResize(handleEl, event.pointerId);
      if (nextWidth !== null) onColumnWidthSet(column.id, nextWidth);
    };
    const handlePointerCancel = (event: React.PointerEvent<HTMLSpanElement>) => {
      const handleEl = event.currentTarget;
      findClosestElement(handleEl, "table")?.style.removeProperty(liveWidthVariableName(tableId, column.id));
      cleanupResize(handleEl, event.pointerId);
    };
    const handleDoubleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
      const handleEl = event.currentTarget;
      findClosestElement(handleEl, "table")?.style.removeProperty(liveWidthVariableName(tableId, column.id));
      onColumnWidthReset(column.id);
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
      const direction = event.key === "ArrowLeft"
        ? -1
        : event.key === "ArrowRight"
          ? 1
          : 0;
      if (direction === 0 && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const handleEl = event.currentTarget;
      const headerCell = findClosestElement(handleEl, "th");
      const currentWidth = numberFromData(handleEl.getAttribute("aria-valuenow") ?? undefined)
        ?? resizeStartWidth(handleEl, headerCell);
      const step = event.shiftKey ? KEYBOARD_RESIZE_LARGE_STEP : KEYBOARD_RESIZE_STEP;
      const nextWidth = event.key === "Home"
        ? MIN_RESIZABLE_COLUMN_WIDTH
        : event.key === "End"
          ? MAX_RESIZABLE_COLUMN_WIDTH
          : clampResizableColumnWidth(currentWidth + direction * step);
      findClosestElement(handleEl, "table")?.style.setProperty(
        liveWidthVariableName(tableId, column.id),
        `${nextWidth}px`
      );
      announceResizeWidth(handleEl, nextWidth);
      onColumnWidthSet(column.id, nextWidth);
    };
    return (
      <span
        className="sui-data-table-resize-handle"
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={`Resize ${label}`}
        aria-valuemin={MIN_RESIZABLE_COLUMN_WIDTH}
        aria-valuemax={MAX_RESIZABLE_COLUMN_WIDTH}
        aria-valuenow={accessibleResizeWidth(column)}
        aria-valuetext={`${accessibleResizeWidth(column)} pixels wide`}
        title="Drag or use Left and Right Arrow keys to resize. Shift changes the width faster."
        data-sui-column-resize-handle={column.id}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      />
    );
  };
  return (
    <div className={joinClasses("sui-data-table-scroll", className)} data-sui-component="PinnedDataTable" role="region" aria-label={ariaLabel} tabIndex={0}>
      <table className={joinClasses("sui-data-table", tableClassName)} data-sui-table-id={tableId}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={joinClasses(column.className, column.headerClassName)}
                data-sui-column-id={column.id}
                data-sui-pinned-column={column.pinned}
                data-sui-cell-wrap={column.wrap}
                data-sui-line-clamp={column.lineClamp ? "true" : undefined}
                data-sui-align={column.align}
                aria-label={column.ariaLabel}
                style={columnStyle(column, tableId)}
              >
                <span className="sui-data-table-header-cell">
                  <span className="sui-data-table-cell-content">{column.header}</span>
                  {resizeHandleFor(column)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowClassName = getRowClassName?.(row, rowIndex);
            return (
              <tr key={rowKey(row, rowIndex)} className={rowClassName}>
                {columns.map((column) => {
                  const Cell = column.rowHeader ? "th" : "td";
                  return (
                    <Cell
                      key={column.id}
                      scope={column.rowHeader ? "row" : undefined}
                      className={joinClasses(column.className, cellClassName(column, row, rowIndex))}
                      data-sui-column-id={column.id}
                      data-sui-pinned-column={column.pinned}
                      data-sui-cell-wrap={column.wrap}
                      data-sui-line-clamp={column.lineClamp ? "true" : undefined}
                      data-sui-align={column.align}
                      style={columnStyle(column, tableId)}
                    >
                      <span className="sui-data-table-cell-content">{column.render(row, rowIndex)}</span>
                    </Cell>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
