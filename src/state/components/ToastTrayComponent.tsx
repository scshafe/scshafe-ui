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
    <ol className="mc-toast-tray" aria-live="polite" data-mc-component="ToastTray">
      {items.map((toast) => (
        <li
          key={toast.id}
          className={`mc-toast mc-toast--${toast.kind}`}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          <span className="mc-toast-message">{toast.message}</span>
          <button
            type="button"
            className="mc-toast-dismiss"
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
