/**
 * Status primitive. A workflow-state-aware label backed by Badge, with
 * the tone mapped from the state via the shared toneByState table. Use
 * Status when the value is a finite workflow state (run/task/approval/
 * etc.) and Badge directly when the value is free-form categorical.
 *
 * Props:
 *  - state: the workflow state string (e.g. "active", "blocked", "completed")
 *  - tooltip: tooltip metadata object or string
 *  - icon: "auto" (default — resolve the state glyph from iconByState), a
 *    semantic icon name to override, or null to render text-only
 */
/** @param {{ state: any, tooltip?: any, icon?: any }} props */
export function Status({ state, tooltip, icon }: {
    state: any;
    tooltip?: any;
    icon?: any;
}): React.JSX.Element;
import React from "react";
