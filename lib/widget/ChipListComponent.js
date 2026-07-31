import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { Inline } from "../layout/InlineComponent.js";
import {} from "../layout/layoutShared.js";
import { toneByState } from "../format.js";
function chipTone(status) {
    if (!status)
        return undefined;
    const tone = toneByState.get(status);
    return typeof tone === "string" ? tone : undefined;
}
export function ChipList(props) {
    const { items, dataMcComponent = "ChipList" } = props;
    return (_jsx(Inline, { wrap: true, gap: "xs", dataMcComponent: dataMcComponent, children: items.map((item) => {
            const tone = chipTone(item.status);
            return (_jsx("code", { className: "mc-chip", "data-mc-chip-tone": tone, title: item.tooltip, children: item.label }, item.label));
        }) }));
}
