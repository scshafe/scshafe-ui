import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { joinClasses, resolveBaseAttrs, spaceClass, } from "./layoutShared.js";
function gridTemplateColumns(columns) {
    if (columns.kind === "equal") {
        if (!Number.isFinite(columns.count) || columns.count < 1) {
            throw new Error(`Grid columns.count must be a positive integer (got ${columns.count})`);
        }
        return `repeat(${Math.trunc(columns.count)}, minmax(0, 1fr))`;
    }
    return `repeat(auto-fit, minmax(${columns.minSize}, 1fr))`;
}
export const Grid = React.forwardRef(function Grid(props, ref) {
    const { children, as, columns, gap = "md", rowGap, columnGap, rowHeight, align = "stretch", justify = "stretch", dataMcComponent, id, role, data, ...aria } = props;
    const Tag = (as ?? "div");
    const attrs = resolveBaseAttrs({
        id,
        role,
        "aria-label": aria["aria-label"],
        "aria-labelledby": aria["aria-labelledby"],
        "aria-describedby": aria["aria-describedby"],
        dataMcComponent,
        data,
    }, "Grid");
    const className = joinClasses("mc-grid", rowGap ? spaceClass("mc-grid-row-gap", rowGap) : spaceClass("mc-grid-gap", gap), columnGap ? spaceClass("mc-grid-col-gap", columnGap) : spaceClass("mc-grid-gap", gap), `mc-grid-align--${align}`, `mc-grid-justify--${justify}`, rowHeight ? `mc-grid-row-height--${rowHeight}` : null);
    return (_jsx(Tag, { ref: ref, className: className, style: { gridTemplateColumns: gridTemplateColumns(columns) }, ...attrs, children: children }));
});
