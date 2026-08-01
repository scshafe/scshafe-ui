/**
 * Generic colored label primitive. The single source of truth for
 * categorical pills across the app — Chip, CountPill, and NumberPill all
 * collapse into Badge with variant props.
 *
 * Props:
 *  - value: primary display text or number (required for default + count variants)
 *  - label: optional secondary noun rendered after the value (count variant)
 *  - tone: blue | green | yellow | orange | red | purple (default blue)
 *  - emphasis: true to wrap the value in <strong> (default true for count, false otherwise)
 *  - tooltip: tooltip metadata object or string
 */
/** @param {{ value: any, label?: any, tone?: any, emphasis?: any, tooltip?: any, componentName?: string, icon?: any }} props */
export function Badge({ value, label, tone, emphasis, tooltip, componentName, icon }: {
    value: any;
    label?: any;
    tone?: any;
    emphasis?: any;
    tooltip?: any;
    componentName?: string;
    icon?: any;
}): React.JSX.Element;
import React from "react";
