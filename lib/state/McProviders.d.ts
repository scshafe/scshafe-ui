import React from "react";
import { type IconRenderer } from "../widget/IconContext.js";
export interface McProvidersProps {
    store: any;
    children: React.ReactNode;
    icons?: IconRenderer;
    devUxEnabled?: boolean;
}
export declare function McProviders({ store, children, icons, devUxEnabled }: McProvidersProps): React.JSX.Element;
