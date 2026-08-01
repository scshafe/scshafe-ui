import { type PayloadAction } from "@reduxjs/toolkit";
import type { PopoverAnchor } from "../widget/PopoverControllerContext.js";
interface PopoversState {
    openId: string | null;
    anchor: PopoverAnchor | null;
    payload: unknown;
}
export declare const Popovers: import("@reduxjs/toolkit").Slice<PopoversState, {
    popoverOpened(state: {
        openId: string | null;
        anchor: {
            x: number;
            y: number;
        } | null;
        payload: unknown;
    }, action: PayloadAction<{
        id?: string;
        anchor?: PopoverAnchor | null;
        payload?: unknown;
    } | undefined>): void;
    popoverClosed(state: {
        openId: string | null;
        anchor: {
            x: number;
            y: number;
        } | null;
        payload: unknown;
    }): void;
    popoverClosedIfCurrent(state: {
        openId: string | null;
        anchor: {
            x: number;
            y: number;
        } | null;
        payload: unknown;
    }, action: PayloadAction<string>): void;
}, "Popovers", "Popovers", import("@reduxjs/toolkit").SliceSelectors<PopoversState>>;
export declare const popoverOpened: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<{
    id?: string;
    anchor?: PopoverAnchor | null;
    payload?: unknown;
} | undefined, "Popovers/popoverOpened">, popoverClosed: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"Popovers/popoverClosed">, popoverClosedIfCurrent: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "Popovers/popoverClosedIfCurrent">;
export declare function selectPopovers(state?: any): PopoversState;
export declare function selectOpenPopoverId(state?: any): string | null;
export declare function selectPopoverAnchor(state?: any): PopoverAnchor | null;
export declare function selectPopoverPayload(state?: any): unknown;
export {};
