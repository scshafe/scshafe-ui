import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { joinClasses, resolveBaseAttrs, spaceClass, } from "./layoutShared.js";
export const Stack = React.forwardRef(function Stack(props, ref) {
    const { children, as, gap = "md", align = "stretch", itemHeight, dataMcComponent, id, role, data, ...aria } = props;
    const Tag = (as ?? "div");
    const attrs = resolveBaseAttrs({
        id,
        role,
        "aria-label": aria["aria-label"],
        "aria-labelledby": aria["aria-labelledby"],
        "aria-describedby": aria["aria-describedby"],
        dataMcComponent,
        data,
    }, "Stack");
    const className = joinClasses("mc-stack", spaceClass("mc-stack-gap", gap), `mc-stack-align--${align}`, itemHeight ? `mc-stack-item-height--${itemHeight}` : null);
    return (_jsx(Tag, { ref: ref, className: className, ...attrs, children: children }));
});
