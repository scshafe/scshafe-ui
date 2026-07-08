/** @param {{ label?: any, children?: any, icon?: any, variant?: string, size?: any, tooltip?: any, className?: any, disabled?: boolean, type?: string, [extra: string]: any }} props */
export function Button({ label, children, icon, variant, size, tooltip, className, disabled, type, ...rest }: {
    label?: any;
    children?: any;
    icon?: any;
    variant?: string;
    size?: any;
    tooltip?: any;
    className?: any;
    disabled?: boolean;
    type?: string;
    [extra: string]: any;
}): import("react/jsx-runtime").JSX.Element;
/** @param {{ label?: any, icon?: any, variant?: string, size?: any, tooltip?: any, className?: any, disabled?: boolean, type?: string, children?: any, [extra: string]: any }} props */
export function IconButton({ label, icon, variant, size, tooltip, className, disabled, type, children, ...rest }: {
    label?: any;
    icon?: any;
    variant?: string;
    size?: any;
    tooltip?: any;
    className?: any;
    disabled?: boolean;
    type?: string;
    children?: any;
    [extra: string]: any;
}): import("react/jsx-runtime").JSX.Element;
