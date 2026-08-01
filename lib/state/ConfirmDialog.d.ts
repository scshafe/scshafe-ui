import { type Dispatch, type PayloadAction } from "@reduxjs/toolkit";
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
export declare const ConfirmDialog: import("@reduxjs/toolkit").Slice<ConfirmDialogState, {
    confirmAsked(state: {
        open: boolean;
        prompt: {
            title: string;
            message: string;
            confirmLabel: string;
            cancelLabel: string;
            kind: "danger" | "default";
        } | null;
    }, action: PayloadAction<ConfirmPrompt | null>): void;
    confirmCleared(state: {
        open: boolean;
        prompt: {
            title: string;
            message: string;
            confirmLabel: string;
            cancelLabel: string;
            kind: "danger" | "default";
        } | null;
    }): void;
}, "ConfirmDialog", "ConfirmDialog", import("@reduxjs/toolkit").SliceSelectors<ConfirmDialogState>>;
export declare const confirmAsked: import("@reduxjs/toolkit").ActionCreatorWithPayload<ConfirmPrompt | null, "ConfirmDialog/confirmAsked">, confirmCleared: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ConfirmDialog/confirmCleared">;
export interface ConfirmPromptInput {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    kind?: "danger" | "default";
}
export declare function confirmActionThunk(prompt?: ConfirmPromptInput): (dispatch: Dispatch) => Promise<boolean>;
export declare function resolveConfirmThunk(confirmed: boolean): (dispatch: Dispatch) => void;
export declare function selectConfirmDialog(state?: any): ConfirmDialogState;
export declare function _isResolverPending(): boolean;
export {};
