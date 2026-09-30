import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";
import { useIcon } from "../widget/IconContext.js";

const TONE_CLASSES = new Set(["blue", "green", "yellow", "orange", "red", "purple"]);

function normalizeTone(tone) {
  if (!tone) return "blue";
  const value = String(tone).toLowerCase();
  return TONE_CLASSES.has(value) ? value : "blue";
}

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
export function Badge({ value, label = null, tone = "blue", emphasis = null, tooltip = null, componentName = "Badge", icon = null }) {
  // L3: optional leading glyph via the injected icon seam — no provider renders
  // nothing, so providerless markup (and the bucket-test pins) stay byte-identical.
  const renderIcon = useIcon();
  const resolvedTone = normalizeTone(tone);
  const text = String(value ?? "");
  const showLabel = typeof label === "string" && label.length > 0;
  const wrapInStrong = emphasis ?? showLabel;
  const defaultTooltip = {
    component: componentName,
    layer: "primitive",
    description: "Categorical label with tone-driven color; supports value, optional secondary noun, and count semantics.",
    values: { value: text, label: showLabel ? label : null, tone: resolvedTone }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip}>
    <span
      className={`sui-badge sui-badge--${resolvedTone}`}
      data-sui-component={componentName}
      data-sui-tone={resolvedTone}
      aria-label={showLabel ? `${text} ${label}` : undefined}
    >
      {icon ? renderIcon(icon, { size: 11, "aria-hidden": "true" }) : null}
      {wrapInStrong ? <strong>{text}</strong> : text}
      {showLabel ? <span className="sui-badge-label">{label}</span> : null}
    </span>
  </Tooltip>;
}
