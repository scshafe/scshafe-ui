import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
export function RailWorkspace({ children, className, stackAt = "narrow", dataMcComponent = "RailWorkspace", ariaLabel }) {
    const classes = ["mc-rail-workspace", stackAt === "mobile" ? "mc-rail-workspace--stack-mobile" : null, className]
        .filter(Boolean).join(" ");
    return (_jsx("div", { className: classes, "data-mc-component": dataMcComponent, "aria-label": ariaLabel, children: children }));
}
