import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { Provider } from "react-redux";
import { IconContext } from "../widget/IconContext.js";
import { RtkPopoverProvider } from "./RtkPopoverProvider.js";
export function McProviders({ store, children, icons, devUxEnabled = false }) {
    const inner = _jsx(RtkPopoverProvider, { devUxEnabled: devUxEnabled, children: children });
    return (_jsx(Provider, { store: store, children: icons ? _jsx(IconContext.Provider, { value: icons, children: inner }) : inner }));
}
