import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef } from "react";
// Native `<dialog>` wrapper for slide-in editor panels and centered modals.
// The "open" state lives in RTK (per-editor slice for edit forms, ConfirmDialog
// slice for confirms); this component just owns the imperative showModal /
// close on the underlying DOM element. When closed, the entire dialog (and
// its subtree) unmounts — tearing down hidden DOM per the project rule.
export function Sheet({ open, onClose, side = "right", ariaLabel, dataMcComponent = "Sheet", children }) {
    const dialogRef = useRef(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog)
            return;
        if (!dialog.open) {
            dialog.showModal();
        }
    }, []);
    if (!open)
        return null;
    return (_jsx("dialog", { ref: dialogRef, className: `mc-sheet mc-sheet--${side}`, "data-mc-component": dataMcComponent, "aria-label": ariaLabel, onClose: onClose, onCancel: (event) => {
            event.preventDefault();
            onClose();
        }, children: children }));
}
export function SheetHeader({ title, description }) {
    return (_jsxs("header", { className: "mc-sheet__header", children: [_jsx("h2", { className: "mc-sheet__title", children: title }), description ? _jsx("p", { className: "mc-sheet__description", children: description }) : null] }));
}
export function SheetBody({ children }) {
    return _jsx("div", { className: "mc-sheet__body", children: children });
}
export function SheetFooter({ children }) {
    return _jsx("footer", { className: "mc-sheet__footer", children: children });
}
