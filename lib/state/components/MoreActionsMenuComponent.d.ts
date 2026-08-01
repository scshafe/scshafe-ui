import React from "react";
import { type ContextMenuItem } from "./ContextMenuComponent.js";
export interface MoreActionsMenuProps {
    id: string;
    items: ReadonlyArray<ContextMenuItem>;
    label?: string;
    icon?: string;
    ariaLabel?: string;
    disabled?: boolean;
}
export declare function MoreActionsMenu({ id, items, label, icon, ariaLabel, disabled }: MoreActionsMenuProps): React.JSX.Element;
