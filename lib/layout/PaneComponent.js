import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, {} from "react";
import { joinClasses, resolveBaseAttrs, spaceClass, } from "./layoutShared.js";
export const Pane = React.forwardRef(function Pane(props, ref) {
    const { children, as, header, footer, bodyScroll = "auto", height = "fill", padding = "md", dataMcComponent, id, role, data, ...aria } = props;
    const Tag = (as ?? "section");
    const attrs = resolveBaseAttrs({
        id,
        role,
        "aria-label": aria["aria-label"],
        "aria-labelledby": aria["aria-labelledby"],
        "aria-describedby": aria["aria-describedby"],
        dataMcComponent,
        data,
    }, "Pane");
    const className = joinClasses("mc-pane", `mc-pane-height--${height}`);
    const bodyClassName = joinClasses("mc-pane-body", `mc-pane-body-scroll--${bodyScroll}`, spaceClass("mc-pane-body-padding", padding));
    return (_jsxs(Tag, { ref: ref, className: className, ...attrs, children: [header !== undefined ? _jsx("div", { className: "mc-pane-header", children: header }) : null, _jsx("div", { className: bodyClassName, children: children }), footer !== undefined ? _jsx("div", { className: "mc-pane-footer", children: footer }) : null] }));
});
