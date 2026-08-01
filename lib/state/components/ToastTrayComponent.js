import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectToasts, toastDismissed } from "../Toasts.js";
export function ToastTray() {
    const items = useSelector(selectToasts);
    const dispatch = useDispatch();
    if (!items.length)
        return null;
    return (_jsx("ol", { className: "mc-toast-tray", "aria-live": "polite", "data-mc-component": "ToastTray", children: items.map((toast) => (_jsxs("li", { className: `mc-toast mc-toast--${toast.kind}`, role: toast.kind === "error" ? "alert" : "status", children: [_jsx("span", { className: "mc-toast-message", children: toast.message }), _jsx("button", { type: "button", className: "mc-toast-dismiss", "aria-label": "Dismiss", onClick: () => dispatch(toastDismissed({ id: toast.id })), children: "\u00D7" })] }, toast.id))) }));
}
