import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectToasts, toastDismissed } from "../Toasts.js";

interface ToastItem {
  id: string;
  kind: "success" | "error" | "info";
  message: string;
}

// Each toast is its own live region: role="status" (polite) or, for errors,
// role="alert" (assertive); the tray is a labelled region.
export function ToastTray() {
  const items = useSelector(selectToasts) as ToastItem[];
  const dispatch = useDispatch();
  if (!items.length) return null;
  return (
    <section className="sui-toast-tray" aria-label="Notifications" data-sui-component="ToastTray">
      {items.map((toast) => (
        <div
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
        </div>
      ))}
    </section>
  );
}
