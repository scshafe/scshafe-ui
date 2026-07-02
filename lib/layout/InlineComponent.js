import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { joinClasses, resolveBaseAttrs, spaceClass, } from "./layoutShared.js";
export const Inline = React.forwardRef(function Inline(props, ref) {
    const { children, as, gap = "sm", align = "center", justify = "start", wrap = false, dataMcComponent, id, role, data, ...aria } = props;
    const Tag = (as ?? "div");
    const attrs = resolveBaseAttrs({
        id,
        role,
        "aria-label": aria["aria-label"],
        "aria-labelledby": aria["aria-labelledby"],
        "aria-describedby": aria["aria-describedby"],
        dataMcComponent,
        data,
    }, "Inline");
    const className = joinClasses("mc-inline", spaceClass("mc-inline-gap", gap), `mc-inline-align--${align}`, `mc-inline-justify--${justify}`, wrap ? "mc-inline--wrap" : null);
    return (_jsx(Tag, { ref: ref, className: className, ...attrs, children: children }));
});
