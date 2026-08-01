import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useDispatch } from "react-redux";
import { useIcon } from "../../widget/IconContext.js";
import { popoverOpened } from "../Popovers.js";
import { dataTableColumnHiddenToggled, dataTableColumnMoved, dataTableColumnWidthReset, dataTableColumnWidthSet, dataTablePreferencesReset, mergeDataTableColumnsWithPreferences } from "../DataTablePreferences.js";
import { IconButton } from "../../primitive/ButtonComponent.js";
import { Popover } from "../../widget/PopoverComponent.js";
function headerLabel(column) {
    if (typeof column.header === "string" || typeof column.header === "number")
        return String(column.header);
    return column.ariaLabel ?? column.id;
}
function widthPlaceholder(column) {
    if (typeof column.width === "number")
        return String(column.width);
    if (typeof column.width === "string")
        return column.width;
    return undefined;
}
export function DataTableColumnMenu({ tableId, columns, preferences = null, label = "Configure columns" }) {
    const dispatch = useDispatch();
    const renderIcon = useIcon();
    const popoverId = `data-table-columns:${tableId}`;
    const configuredColumns = mergeDataTableColumnsWithPreferences(columns, preferences, { includeHidden: true });
    const configuredColumnIds = configuredColumns.map((column) => column.id);
    const hiddenColumnIds = new Set(preferences?.hiddenColumnIds ?? []);
    const widthsByColumnId = preferences?.widthsByColumnId ?? {};
    const openMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect?.() ?? { left: 0, right: 0, bottom: 0 };
        dispatch(popoverOpened({ id: popoverId, anchor: { x: rect.right, y: rect.bottom } }));
    };
    return (_jsxs("span", { className: "data-table-column-menu", "data-mc-component": "DataTableColumnMenu", "data-table-column-menu": tableId, "data-mc-popover-anchor": "", children: [_jsx(IconButton, { label: label, icon: "action.settings", variant: "secondary", onClick: openMenu }), _jsx(Popover, { id: popoverId, side: "bottom", ariaLabel: label, children: _jsxs("div", { className: "data-table-column-menu-panel", children: [_jsxs("div", { className: "data-table-column-menu-header", children: [_jsx("strong", { children: "Columns" }), _jsx("button", { type: "button", className: "mc-button mc-button-secondary mc-button-mini", "data-table-preferences-reset": tableId, onClick: () => dispatch(dataTablePreferencesReset({ tableId })), children: "Reset all" })] }), _jsx("div", { className: "data-table-column-menu-list", role: "list", children: configuredColumns.map((column, index) => {
                                const columnLabel = headerLabel(column);
                                const hidden = hiddenColumnIds.has(column.id);
                                const widthValue = widthsByColumnId[column.id] ?? "";
                                return (_jsxs("div", { className: "data-table-column-menu-row", role: "listitem", "data-table-column-menu-row": column.id, children: [_jsxs("label", { className: "data-table-column-visibility", children: [_jsx("input", { type: "checkbox", checked: !hidden, onChange: () => dispatch(dataTableColumnHiddenToggled({ tableId, columnId: column.id })) }), _jsx("span", { children: columnLabel })] }), _jsx("button", { type: "button", className: "data-table-column-order-button", "aria-label": `Move ${columnLabel} up`, disabled: index === 0, onClick: () => dispatch(dataTableColumnMoved({ tableId, columnId: column.id, direction: "up", columnIds: configuredColumnIds })), children: renderIcon("action.collapse", { size: 12, "aria-hidden": "true" }) }), _jsx("button", { type: "button", className: "data-table-column-order-button", "aria-label": `Move ${columnLabel} down`, disabled: index === configuredColumns.length - 1, onClick: () => dispatch(dataTableColumnMoved({ tableId, columnId: column.id, direction: "down", columnIds: configuredColumnIds })), children: renderIcon("action.expand", { size: 12, "aria-hidden": "true" }) }), _jsx("input", { className: "data-table-column-width-input", type: "number", min: 48, max: 1200, step: 10, value: widthValue, placeholder: widthPlaceholder(column), "aria-label": `${columnLabel} width`, onChange: (event) => {
                                                const parsed = Number.parseFloat(event.currentTarget.value);
                                                if (Number.isFinite(parsed)) {
                                                    dispatch(dataTableColumnWidthSet({ tableId, columnId: column.id, width: parsed }));
                                                }
                                                else {
                                                    dispatch(dataTableColumnWidthReset({ tableId, columnId: column.id }));
                                                }
                                            } }), _jsx("button", { type: "button", className: "data-table-column-order-button", "aria-label": `Reset ${columnLabel} width`, onClick: () => dispatch(dataTableColumnWidthReset({ tableId, columnId: column.id })), children: renderIcon("action.refresh", { size: 12, "aria-hidden": "true" }) })] }, column.id));
                            }) })] }) })] }));
}
