import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectToasts, toastDismissed } from "../Toasts.js";

interface ToastItem {
  id: string;
  kind: "success" | "error" | "info";
  message: string;
}

export function ToastTray() {
  const items = useSelector(selectToasts) as ToastItem[];
  const dispatch = useDispatch();
  if (!items.length) return null;
  return (
    <ol className="sui-toast-tray" aria-live="polite" data-sui-component="ToastTray">
      {items.map((toast) => (
        <li
          key={toast.id}
          className={`sui-toast sui-toast--${toast.kind}`}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          <span className="sui-toast-message">{toast.message}</span>
          <button
            type="button"
            className="sui-toast-dismiss"
            aria-label="Dismiss"
            onClick={() => dispatch(toastDismissed({ id: toast.id }))}
          >
            ×
          </button>
        </li>
      ))}
    </ol>
  );
}
