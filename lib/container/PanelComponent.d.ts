/** @param {{ children: any, className?: string, componentName?: string, as?: string, tooltip?: any, [extra: string]: any }} props */
export function Panel({ children, className, componentName, as, tooltip, ...rest }: {
    children: any;
    className?: string;
    componentName?: string;
    as?: string;
    tooltip?: any;
    [extra: string]: any;
}): React.JSX.Element;
/** @param {{ title: any, description?: any, aside?: any, children?: any, className?: string, headingLevel?: number, componentName?: string, tooltip?: any, [extra: string]: any }} props */
export function PanelHeader({ title, description, aside, children, className, headingLevel, componentName, tooltip, ...rest }: {
    title: any;
    description?: any;
    aside?: any;
    children?: any;
    className?: string;
    headingLevel?: number;
    componentName?: string;
    tooltip?: any;
    [extra: string]: any;
}): React.JSX.Element;
import React from "react";
