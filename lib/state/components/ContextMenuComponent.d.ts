import React from "react";
export interface ContextMenuItem {
    label: string;
    action: () => void;
    icon?: string;
    danger?: boolean;
    disabled?: boolean;
    kbd?: string;
}
export interface ContextMenuProps {
    id: string;
    items?: ReadonlyArray<ContextMenuItem>;
    panel?: React.ReactNode;
    payload?: unknown;
    ariaLabel?: string;
    className?: string;
    children: React.ReactNode;
}
export declare function ContextMenu({ id, items, panel, payload, ariaLabel, className, children }: ContextMenuProps): React.JSX.Element;
export declare function copyToClipboard(text: string): void;
