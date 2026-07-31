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
export function Status({ state, tooltip }: {
    state: any;
    tooltip?: null | undefined;
}): React.JSX.Element;
import React from "react";
