/**
 * Atomic form label. Renders a <label> element with consistent typography
 * and an optional required marker. Pairs with Description below it and a
 * field control beside it.
 *
 * Props:
 *  - htmlFor: id of the form control this label is for
 *  - children: label text
 *  - required: when true, append a visual required marker
 *  - tooltip: tooltip metadata object or string
 */
export function Label({ htmlFor, children, required, tooltip }: {
    htmlFor?: null | undefined;
    children: any;
    required?: boolean | undefined;
    tooltip?: null | undefined;
}): React.JSX.Element;
import React from "react";
