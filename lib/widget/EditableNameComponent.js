import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useIcon } from "./IconContext.js";
import { HoverButton } from "../primitive/HoverButtonComponent.js";
/**
 * Name field with two states:
 *  • view: text button with a hover-revealed edit pencil. Clicking the
 *    name fires `onClick` (e.g. row select). Clicking the pencil fires
 *    `onEditStart`.
 *  • editing: input with submit + cancel controls.
 *
 * Caller owns state via `isEditing`, `draft`, callbacks. Pure
 * presentational — no useState, no timers, no auto-arming.
 */
export function EditableName({ value, isEditing, draft, canSave, isSaving, errorMessage, ariaLabel, className, onClick, onEditStart, onDraftChange, onSubmit, onCancel, }) {
    // C1: icon-name strings resolve through the INJECTED renderer (byte-identical
    // for MC via McIconProvider). Called unconditionally per the rules of hooks,
    // even though the glyphs only appear in the editing branch below.
    const renderIcon = useIcon();
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!canSave || isSaving)
            return;
        onSubmit();
    };
    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
        }
    };
    if (isEditing) {
        return (_jsxs("form", { className: `mc-editable-name mc-editable-name--editing ${className ?? ""}`, onSubmit: handleSubmit, "data-mc-component": "EditableName", children: [_jsx("input", { type: "text", className: "mc-editable-name-input", value: draft, "aria-label": ariaLabel ?? "Edit name", autoFocus: true, onChange: (event) => onDraftChange(event.target.value), onKeyDown: handleKeyDown, disabled: isSaving }), _jsx("button", { type: "submit", className: "mc-editable-name-submit", disabled: !canSave || isSaving, "aria-label": "Save name", title: "Save", children: renderIcon("action.confirm", { size: 12, "aria-hidden": "true" }) }), _jsx("button", { type: "button", className: "mc-editable-name-cancel", disabled: isSaving, onClick: onCancel, "aria-label": "Cancel edit", title: "Cancel", children: renderIcon("action.close", { size: 12, "aria-hidden": "true" }) }), errorMessage ? _jsx("small", { className: "mc-editable-name-error", role: "alert", children: errorMessage }) : null] }));
    }
    return (_jsxs("span", { className: `mc-editable-name mc-hover-host ${className ?? ""}`, "data-mc-component": "EditableName", children: [_jsx("button", { type: "button", className: "mc-editable-name-text", "aria-label": ariaLabel ? `${ariaLabel}: ${value}` : value, onClick: onClick, children: value }), _jsx(HoverButton, { icon: "action.edit", label: `Edit ${value}`, title: "Edit name", onClick: onEditStart, dataMcComponent: "EditableNameEdit" })] }));
}
