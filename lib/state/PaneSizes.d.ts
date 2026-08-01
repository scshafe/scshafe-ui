import { type PayloadAction } from "@reduxjs/toolkit";
interface PaneSizesState {
    sizes: Record<string, number>;
}
export declare const PaneSizes: import("@reduxjs/toolkit").Slice<PaneSizesState, {
    paneSizeSet(state: {
        sizes: {
            [x: string]: number;
        };
    }, action: PayloadAction<{
        paneId?: string;
        size?: number;
    }>): void;
    paneSizeCleared(state: {
        sizes: {
            [x: string]: number;
        };
    }, action: PayloadAction<{
        paneId?: string;
    }>): void;
}, "PaneSizes", "PaneSizes", import("@reduxjs/toolkit").SliceSelectors<PaneSizesState>>;
export declare const paneSizeSet: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    paneId?: string;
    size?: number;
}, "PaneSizes/paneSizeSet">, paneSizeCleared: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    paneId?: string;
}, "PaneSizes/paneSizeCleared">;
export declare const paneSizesPersistMiddleware: (storeApi: {
    getState: () => any;
}) => (next: (action: any) => any) => (action: any) => any;
export declare function selectPaneSize(paneId: string): (state?: any) => number | null;
export {};
