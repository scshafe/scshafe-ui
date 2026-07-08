import React from "react";
export type PopoverAnchor = {
    x: number;
    y: number;
};
export interface PopoverController {
    openId: string | null;
    anchor: PopoverAnchor | null;
    open(id: string, anchor: PopoverAnchor | null, payload?: unknown): void;
    close(): void;
    closeIfCurrent(id: string): void;
}
export declare const PopoverControllerContext: React.Context<PopoverController>;
export declare const DevUxContext: React.Context<boolean>;
export declare function usePopoverController(): PopoverController;
export declare function useDevUxEnabled(): boolean;
