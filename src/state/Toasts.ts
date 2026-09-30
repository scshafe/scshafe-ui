import { createSlice, type Dispatch, type PayloadAction } from "@reduxjs/toolkit";

// ============================================================================
// Toasts — non-blocking success / error / info messages.
//
// Success/info default to 4s auto-dismiss; errors are persistent until the
// user clicks them away. Auto-dismiss is set up in `showToastThunk` via
// `setTimeout` — a one-off, not a polling loop. The tray component moves with
// this slice in S3; until then hosts render their own tray over selectToasts.
// ============================================================================

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastsState {
  items: ToastItem[];
}

const initialState: ToastsState = { items: [] };

const DEFAULT_DURATION_MS = 4000;

let toastCounter = 0;
function nextToastId(): string {
  return `t_${Date.now().toString(36)}_${(++toastCounter).toString(36)}`;
}

export const Toasts = createSlice({
  name: "Toasts",
  initialState,
  reducers: {
    toastShown(state, action: PayloadAction<{ id?: string; kind?: string; message?: string } | undefined>) {
      const id = typeof action.payload?.id === "string" ? action.payload.id : nextToastId();
      const kind: ToastKind = action.payload?.kind === "error" || action.payload?.kind === "info"
        ? action.payload.kind
        : "success";
      const message = typeof action.payload?.message === "string" ? action.payload.message : "";
      if (!message) return;
      state.items.push({ id, kind, message });
    },
    toastDismissed(state, action: PayloadAction<{ id?: string } | undefined>) {
      const id = action.payload?.id;
      if (!id) return;
      const index = state.items.findIndex((item) => item.id === id);
      if (index >= 0) state.items.splice(index, 1);
    }
  }
});

export const { toastShown, toastDismissed } = Toasts.actions;

export interface ShowToastInput {
  kind?: ToastKind;
  message?: string;
  durationMs?: number | null;
}

export function showToastThunk(input: ShowToastInput = {}) {
  const kind = input.kind ?? "success";
  const message = input.message;
  const durationMs = input.durationMs;
  return (dispatch: Dispatch): string | null => {
    if (typeof message !== "string" || !message) return null;
    const id = nextToastId();
    dispatch(toastShown({ id, kind, message }));
    const resolvedDuration = typeof durationMs === "number"
      ? durationMs
      : (kind === "error" ? null : DEFAULT_DURATION_MS);
    if (resolvedDuration !== null && resolvedDuration > 0 && typeof globalThis.setTimeout === "function") {
      globalThis.setTimeout(() => dispatch(toastDismissed({ id })), resolvedDuration);
    }
    return id;
  };
}

export function selectToasts(state: any = {}): ToastItem[] {
  return state.Toasts?.items ?? [];
}
