import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { resolveConfirmThunk, selectConfirmDialog } from "../ConfirmDialog.js";
import { Kbd } from "../../primitive/KbdComponent.js";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "../../widget/SheetComponent.js";
// Exported as ConfirmDialogComponent — the ConfirmDialog SLICE owns the bare name in
// the mc-ui/state barrel; hosts alias on re-export (data-mc-component stays "ConfirmDialog").
export function ConfirmDialogComponent() {
    const { open, prompt } = useSelector(selectConfirmDialog);
    const dispatch = useDispatch(); // thunk-capable store assumed (createMcStore default middleware)
    if (!open || !prompt)
        return null;
    const handleConfirm = () => dispatch(resolveConfirmThunk(true));
    const handleCancel = () => dispatch(resolveConfirmThunk(false));
    const confirmClass = prompt.kind === "danger" ? "mc-button mc-button-danger" : "mc-button mc-button-primary";
    return (_jsxs(Sheet, { open: true, onClose: handleCancel, side: "center", dataMcComponent: "ConfirmDialog", ariaLabel: prompt.title || prompt.message, children: [_jsx(SheetHeader, { title: prompt.title || "Confirm", description: prompt.message }), _jsx(SheetBody, { children: null }), _jsxs(SheetFooter, { children: [_jsx("button", { type: "button", className: confirmClass, onClick: handleConfirm, autoFocus: true, children: prompt.confirmLabel }), _jsxs("button", { type: "button", className: "mc-button mc-button-ghost", onClick: handleCancel, children: [prompt.cancelLabel, " ", _jsx(Kbd, { children: "Esc" })] })] })] }));
}
