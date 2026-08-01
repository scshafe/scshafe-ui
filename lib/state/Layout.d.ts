import { type PayloadAction } from "@reduxjs/toolkit";
interface LayoutState {
    isMobile: boolean;
    collapsedListsBySurface: Record<string, boolean>;
}
export declare const Layout: import("@reduxjs/toolkit").Slice<LayoutState, {
    viewportChanged(state: {
        isMobile: boolean;
        collapsedListsBySurface: {
            [x: string]: boolean;
        };
    }, action: PayloadAction<boolean | {
        isMobile?: boolean;
    }>): void;
    surfaceListCollapseToggled(state: {
        isMobile: boolean;
        collapsedListsBySurface: {
            [x: string]: boolean;
        };
    }, action: PayloadAction<string | {
        surfaceId?: string;
    }>): void;
    surfaceListCollapseSet(state: {
        isMobile: boolean;
        collapsedListsBySurface: {
            [x: string]: boolean;
        };
    }, action: PayloadAction<{
        surfaceId?: string;
        collapsed?: boolean;
    }>): void;
}, "Layout", "Layout", import("@reduxjs/toolkit").SliceSelectors<LayoutState>>;
export declare const viewportChanged: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean | {
    isMobile?: boolean;
}, "Layout/viewportChanged">, surfaceListCollapseToggled: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | {
    surfaceId?: string;
}, "Layout/surfaceListCollapseToggled">, surfaceListCollapseSet: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    surfaceId?: string;
    collapsed?: boolean;
}, "Layout/surfaceListCollapseSet">;
export declare function selectIsMobile(state?: any): boolean;
export declare function selectSurfaceListCollapsed(surfaceId: string): (state?: any) => boolean;
export declare function attachViewportSync(store: {
    dispatch: (action: any) => unknown;
}, { maxWidth }?: {
    maxWidth?: number;
}): () => void;
export {};
