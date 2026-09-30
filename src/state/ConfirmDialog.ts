import { createSlice, type Dispatch, type PayloadAction } from "@reduxjs/toolkit";

// ============================================================================
// ConfirmDialog — single in-flight confirm prompt for destructive actions.
//
// Replaces `globalThis.confirm?.(...)` with a styled in-app dialog. The slice
// stores only the prompt shape; the awaiting Promise resolver is held in a
// closure-scoped variable (not in RTK) because functions aren't serializable.
// Only ONE confirm can be in flight — a second confirm auto-cancels the first.
// The dialog component moves with this slice in S3.
// ============================================================================

export interface ConfirmPrompt {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  kind: "danger" | "default";
}

interface ConfirmDialogState {
  open: boolean;
  prompt: ConfirmPrompt | null;
}

const initialState: ConfirmDialogState = {
  open: false,
  prompt: null
};

let pendingResolver: ((confirmed: boolean) => void) | null = null;

export const ConfirmDialog = createSlice({
  name: "ConfirmDialog",
  initialState,
  reducers: {
    confirmAsked(state, action: PayloadAction<ConfirmPrompt | null>) {
      state.open = true;
      state.prompt = action.payload ?? null;
    },
    confirmCleared(state) {
      state.open = false;
      state.prompt = null;
    }
  }
});

export const { confirmAsked, confirmCleared } = ConfirmDialog.actions;

export interface ConfirmPromptInput {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  kind?: "danger" | "default";
}

export function confirmActionThunk(prompt: ConfirmPromptInput = {}) {
  return (dispatch: Dispatch): Promise<boolean> => {
    if (pendingResolver) {
      const stale = pendingResolver;
      pendingResolver = null;
      stale(false);
    }
    const normalized: ConfirmPrompt = {
      title: typeof prompt.title === "string" ? prompt.title : "",
      message: typeof prompt.message === "string" ? prompt.message : "",
      confirmLabel: typeof prompt.confirmLabel === "string" && prompt.confirmLabel ? prompt.confirmLabel : "Confirm",
      cancelLabel: typeof prompt.cancelLabel === "string" && prompt.cancelLabel ? prompt.cancelLabel : "Cancel",
      kind: prompt.kind === "danger" ? "danger" : "default"
    };
    dispatch(confirmAsked(normalized));
    return new Promise((resolve) => {
      pendingResolver = resolve;
    });
  };
}

export function resolveConfirmThunk(confirmed: boolean) {
  return (dispatch: Dispatch): void => {
    const resolver = pendingResolver;
    pendingResolver = null;
    dispatch(confirmCleared());
    if (resolver) resolver(Boolean(confirmed));
  };
}

export function selectConfirmDialog(state: any = {}): ConfirmDialogState {
  return state.ConfirmDialog ?? initialState;
}

// Testing helper — lets tests assert that no resolver is leaked.
export function _isResolverPending(): boolean {
  return pendingResolver !== null;
}
