import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Badge } from "./BadgeComponent.js";
import { Status } from "./StatusComponent.js";
export function StatCount({ state, count, tooltip }) {
    return (_jsxs("span", { className: "mc-stat-count", "data-mc-component": "StatCount", children: [_jsx(Status, { state: state, tooltip: tooltip }), _jsx(Badge, { value: count, componentName: "StatCountValue" })] }));
}
