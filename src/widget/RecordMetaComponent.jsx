import React from "react";
import { timestamp } from "../format.js";
import { Tooltip } from "./TooltipComponent.js";

export function reactMetaEntry(label, value) {
  if (value === undefined || value === null || value === "") return null;
  return { label, value: typeof value === "object" ? JSON.stringify(value) : String(value) };
}

export function reactTimeMetaEntry(label, value) {
  if (value === undefined || value === null || value === "") return null;
  return { label, value: timestamp(value) };
}

/** @param {{ entries?: any, tooltip?: any }} props */
export function RecordMeta({ entries, tooltip }) {
  const filtered = (entries ?? []).filter(Boolean);
  const defaultTooltip = {
    component: "RecordMeta",
    layer: "widget",
    description: "Metadata pill list for provenance and record details.",
    values: { entries: filtered.length }
  };
  if (filtered.length === 0) return null;
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <div
      className="card-meta"
      data-mc-component="RecordMeta"
      aria-label="Record provenance"
    >
      {filtered.map((entry, index) => <span key={`${entry.label}:${index}`} className="meta-pill"><span>{entry.label}</span>{entry.value}</span>)}
    </div>
  </Tooltip>;
}
