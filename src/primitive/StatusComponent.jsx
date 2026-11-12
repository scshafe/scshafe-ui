import React from "react";
import { toneByState } from "../format.js";
import { iconNameForState } from "../icons/iconByState.js";
import { Badge } from "./BadgeComponent.js";

/**
 * Status primitive. A workflow-state-aware label backed by Badge, with
 * the tone mapped from the state via the shared toneByState table. Use
 * Status when the value is a finite workflow state (run/task/approval/
 * etc.) and Badge directly when the value is free-form categorical.
 *
 * Props:
 *  - state: the workflow state string (e.g. "active", "blocked", "completed")
 *  - tooltip: tooltip text or metadata object; none by default (the component
 *    metadata shows only in developer mode, as Badge's fallback)
 *  - icon: "auto" (default — resolve the state glyph from iconByState), a
 *    semantic icon name to override, or null to render text-only
 */
/** @param {{ state: any, tooltip?: any, icon?: any }} props */
export function Status({ state, tooltip = null, icon = "auto" }) {
  const label = String(state ?? "");
  const tone = toneByState.get(label) ?? "blue";
  // L3: the state glyph resolves from iconByState (a registry-free pure map, so the
  // root bundle stays iconoir-clean) and renders through Badge's icon seam — pass
  // icon={null} to opt out, or a semantic name to override.
  const resolvedIcon = icon === "auto" ? iconNameForState(label) : icon;
  // Badge supplies the component metadata as its developer-mode fallback; passing metadata as
  // the tooltip would show it to everyone.
  return <Badge value={label} tone={tone} tooltip={tooltip} componentName="Status" icon={resolvedIcon} />;
}
