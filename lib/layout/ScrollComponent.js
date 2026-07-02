import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { joinClasses, resolveBaseAttrs, } from "./layoutShared.js";
export const Scroll = React.forwardRef(function Scroll(props, ref) {
    const { children, as, axis = "y", height = "fill", width = "fill", dataMcComponent, id, role, data, ...aria } = props;
    const Tag = (as ?? "div");
    const attrs = resolveBaseAttrs({
        id,
        role,
        "aria-label": aria["aria-label"],
        "aria-labelledby": aria["aria-labelledby"],
        "aria-describedby": aria["aria-describedby"],
        dataMcComponent,
        data,
    }, "Scroll");
    const className = joinClasses("mc-scroll", `mc-scroll-axis--${axis}`, `mc-scroll-height--${height}`, `mc-scroll-width--${width}`);
    return (_jsx(Tag, { ref: ref, className: className, ...attrs, children: children }));
});
