import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { toneByState } from "../format.js";
import { Badge } from "./BadgeComponent.js";
/**
 * Status primitive. A workflow-state-aware label backed by Badge, with
 * the tone mapped from the state via the shared toneByState table. Use
 * Status when the value is a finite workflow state (run/task/approval/
 * etc.) and Badge directly when the value is free-form categorical.
 *
 * Props:
 *  - state: the workflow state string (e.g. "active", "blocked", "completed")
 *  - tooltip: tooltip metadata object or string
 */
export function Status({ state, tooltip = null }) {
    const label = String(state ?? "");
    const tone = toneByState.get(label) ?? "blue";
    const resolvedTooltip = tooltip ?? {
        component: "Status",
        layer: "primitive",
        description: "Workflow-state badge with tone mapped from the canonical state vocabulary.",
        values: { state: label, tone }
    };
    return _jsx(Badge, { value: label, tone: tone, tooltip: resolvedTooltip, componentName: "Status" });
}
