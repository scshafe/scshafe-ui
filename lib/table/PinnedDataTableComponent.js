import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
function joinClasses(...parts) {
    return parts.filter(Boolean).join(" ");
}
function cellClassName(column, row, rowIndex) {
    if (typeof column.cellClassName === "function")
        return column.cellClassName(row, rowIndex);
    return column.cellClassName;
}
function cssSize(value) {
    if (typeof value === "number" && Number.isFinite(value))
        return `${value}px`;
    if (typeof value === "string" && value.trim())
        return value;
    return undefined;
}
function cssNameToken(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "column";
}
function liveWidthVariableName(tableId, columnId) {
    return `--mc-data-table-${cssNameToken(tableId)}-${cssNameToken(columnId)}-width`;
}
function columnStyle(column, tableId) {
    const minWidth = cssSize(column.minWidth);
    const width = cssSize(column.width);
    const maxWidth = cssSize(column.maxWidth);
    const lineClamp = typeof column.lineClamp === "number" && Number.isFinite(column.lineClamp) && column.lineClamp > 0
        ? String(Math.round(column.lineClamp))
        : undefined;
    const liveWidth = tableId ? `var(${liveWidthVariableName(tableId, column.id)}, var(--mc-data-table-width, var(--mc-data-table-max-width, auto)))` : undefined;
    if (!minWidth && !width && !maxWidth && !lineClamp && !liveWidth)
        return undefined;
    return {
        "--mc-data-table-min-width": minWidth,
        "--mc-data-table-width": width,
        "--mc-data-table-max-width": maxWidth,
        "--mc-data-table-line-clamp": lineClamp,
        "--mc-data-table-live-width": liveWidth
    };
}
function numberFromData(value) {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : null;
}
function findClosestElement(element, selector) {
    return element?.closest?.(selector);
}
function resizeStartWidth(handleEl, headerCell) {
    const measuredWidth = headerCell?.getBoundingClientRect?.().width;
    if (typeof measuredWidth === "number" && Number.isFinite(measuredWidth) && measuredWidth > 0)
        return measuredWidth;
    return numberFromData(handleEl.dataset.startWidth) ?? 120;
}
const MIN_RESIZABLE_COLUMN_WIDTH = 72;
const MAX_RESIZABLE_COLUMN_WIDTH = 960;
export function PinnedDataTable({ ariaLabel, columns, rows, rowKey, className, tableClassName, getRowClassName, tableId, onColumnWidthSet, onColumnWidthReset, }) {
    const resizingEnabled = Boolean(tableId && onColumnWidthSet && onColumnWidthReset);
    const resizeHandleFor = (column) => {
        if (!resizingEnabled || !tableId || !onColumnWidthSet || !onColumnWidthReset)
            return null;
        const label = typeof column.header === "string" ? column.header : column.ariaLabel ?? column.id;
        const handlePointerDown = (event) => {
            if (event.button !== undefined && event.button !== 0)
                return;
            event.preventDefault();
            const handleEl = event.currentTarget;
            const headerCell = findClosestElement(handleEl, "th");
            const startWidth = resizeStartWidth(handleEl, headerCell);
            handleEl.setPointerCapture?.(event.pointerId);
            handleEl.dataset.resizing = "true";
            handleEl.dataset.startX = String(event.clientX);
            handleEl.dataset.startWidth = String(startWidth);
            handleEl.dataset.lastWidth = String(startWidth);
        };
        const handlePointerMove = (event) => {
            const handleEl = event.currentTarget;
            if (handleEl.dataset.resizing !== "true")
                return;
            if (handleEl.hasPointerCapture && !handleEl.hasPointerCapture(event.pointerId))
                return;
            const startX = numberFromData(handleEl.dataset.startX);
            const startWidth = numberFromData(handleEl.dataset.startWidth);
            if (startX === null || startWidth === null)
                return;
            const nextWidth = Math.max(MIN_RESIZABLE_COLUMN_WIDTH, Math.min(MAX_RESIZABLE_COLUMN_WIDTH, startWidth + event.clientX - startX));
            const tableElement = findClosestElement(handleEl, "table");
            tableElement?.style.setProperty(liveWidthVariableName(tableId, column.id), `${nextWidth}px`);
            handleEl.dataset.lastWidth = String(nextWidth);
        };
        const cleanupResize = (handleEl, pointerId) => {
            if (handleEl.hasPointerCapture?.(pointerId))
                handleEl.releasePointerCapture?.(pointerId);
            delete handleEl.dataset.resizing;
            delete handleEl.dataset.startX;
            delete handleEl.dataset.startWidth;
            delete handleEl.dataset.lastWidth;
        };
        const handlePointerUp = (event) => {
            const handleEl = event.currentTarget;
            const nextWidth = numberFromData(handleEl.dataset.lastWidth);
            cleanupResize(handleEl, event.pointerId);
            if (nextWidth !== null)
                onColumnWidthSet(column.id, nextWidth);
        };
        const handlePointerCancel = (event) => {
            const handleEl = event.currentTarget;
            findClosestElement(handleEl, "table")?.style.removeProperty(liveWidthVariableName(tableId, column.id));
            cleanupResize(handleEl, event.pointerId);
        };
        const handleDoubleClick = (event) => {
            const handleEl = event.currentTarget;
            findClosestElement(handleEl, "table")?.style.removeProperty(liveWidthVariableName(tableId, column.id));
            onColumnWidthReset(column.id);
        };
        return (_jsx("span", { className: "mc-data-table-resize-handle", role: "separator", "aria-orientation": "vertical", "aria-label": `Resize ${label}`, title: "Resize column", "data-column-resize-handle": column.id, onPointerDown: handlePointerDown, onPointerMove: handlePointerMove, onPointerUp: handlePointerUp, onPointerCancel: handlePointerCancel, onDoubleClick: handleDoubleClick }));
    };
    return (_jsx("div", { className: joinClasses("mc-data-table-scroll", className), "data-mc-component": "PinnedDataTable", role: "region", "aria-label": ariaLabel, tabIndex: 0, children: _jsxs("table", { className: joinClasses("mc-data-table", tableClassName), "data-table-id": tableId, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { scope: "col", className: joinClasses(column.className, column.headerClassName), "data-column-id": column.id, "data-pinned-column": column.pinned, "data-cell-wrap": column.wrap, "data-line-clamp": column.lineClamp ? "true" : undefined, "data-align": column.align, "aria-label": column.ariaLabel, style: columnStyle(column, tableId), children: _jsxs("span", { className: "mc-data-table-header-cell", children: [_jsx("span", { className: "mc-data-table-cell-content", children: column.header }), resizeHandleFor(column)] }) }, column.id))) }) }), _jsx("tbody", { children: rows.map((row, rowIndex) => {
                        const rowClassName = getRowClassName?.(row, rowIndex);
                        return (_jsx("tr", { className: rowClassName, children: columns.map((column) => {
                                const Cell = column.rowHeader ? "th" : "td";
                                return (_jsx(Cell, { scope: column.rowHeader ? "row" : undefined, className: joinClasses(column.className, cellClassName(column, row, rowIndex)), "data-column-id": column.id, "data-pinned-column": column.pinned, "data-cell-wrap": column.wrap, "data-line-clamp": column.lineClamp ? "true" : undefined, "data-align": column.align, style: columnStyle(column, tableId), children: _jsx("span", { className: "mc-data-table-cell-content", children: column.render(row, rowIndex) }) }, column.id));
                            }) }, rowKey(row, rowIndex)));
                    }) })] }) }));
}
