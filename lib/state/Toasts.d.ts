import { type Dispatch, type PayloadAction } from "@reduxjs/toolkit";
export type ToastKind = "success" | "error" | "info";
export interface ToastItem {
    id: string;
    kind: ToastKind;
    message: string;
}
interface ToastsState {
    items: ToastItem[];
}
export declare const Toasts: import("@reduxjs/toolkit").Slice<ToastsState, {
    toastShown(state: {
        items: {
            id: string;
            kind: ToastKind;
            message: string;
        }[];
    }, action: PayloadAction<{
        id?: string;
        kind?: string;
        message?: string;
    } | undefined>): void;
    toastDismissed(state: {
        items: {
            id: string;
            kind: ToastKind;
            message: string;
        }[];
    }, action: PayloadAction<{
        id?: string;
    } | undefined>): void;
}, "Toasts", "Toasts", import("@reduxjs/toolkit").SliceSelectors<ToastsState>>;
export declare const toastShown: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<{
    id?: string;
    kind?: string;
    message?: string;
} | undefined, "Toasts/toastShown">, toastDismissed: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<{
    id?: string;
} | undefined, "Toasts/toastDismissed">;
export interface ShowToastInput {
    kind?: ToastKind;
    message?: string;
    durationMs?: number | null;
}
export declare function showToastThunk(input?: ShowToastInput): (dispatch: Dispatch) => string | null;
export declare function selectToasts(state?: any): ToastItem[];
export {};
