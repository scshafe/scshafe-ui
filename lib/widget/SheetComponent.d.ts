import React from "react";
interface SheetProps {
    open: boolean;
    onClose: () => void;
    side?: "right" | "center";
    ariaLabel?: string;
    dataMcComponent?: string;
    children: React.ReactNode;
}
export declare function Sheet({ open, onClose, side, ariaLabel, dataMcComponent, children }: SheetProps): import("react/jsx-runtime").JSX.Element | null;
interface SheetHeaderProps {
    title: string;
    description?: string;
}
export declare function SheetHeader({ title, description }: SheetHeaderProps): import("react/jsx-runtime").JSX.Element;
export declare function SheetBody({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function SheetFooter({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
