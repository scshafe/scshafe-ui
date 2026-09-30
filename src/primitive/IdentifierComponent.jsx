import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";

const KINDS = new Set(["uuid", "slug", "hash", "id"]);

function truncate(value, mode) {
  if (!value || typeof value !== "string") return "";
  if (mode === "head") return value.length > 16 ? `${value.slice(0, 16)}…` : value;
  if (mode === "tail") return value.length > 16 ? `…${value.slice(-12)}` : value;
  if (mode === "middle") return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
  return value;
}

/**
 * Atomic primitive for displaying a stable identifier (UUID, slug, hash,
 * arbitrary ID). Renders monospace text with kind-aware semantics; the
 * Copyable composite wraps Identifier to add the copy affordance.
 *
 * Props:
 *  - value: the identifier string
 *  - kind: uuid | slug | hash | id (default "id")
 *  - truncate: null | "head" | "tail" | "middle" (default null = full)
 *  - tooltip: tooltip metadata object or string
 */
export function Identifier({ value, kind = "id", truncate: truncateMode = null, tooltip = null }) {
  const resolvedKind = KINDS.has(kind) ? kind : "id";
  const displayed = truncateMode ? truncate(value ?? "", truncateMode) : String(value ?? "");
  const effectiveTooltip = tooltip ?? (truncateMode ? value : null);
  const defaultTooltip = {
    component: "Identifier",
    layer: "primitive",
    description: "Monospace identifier display; kind annotates the value's role (uuid / slug / hash / id) for the dev-UX overlay.",
    values: { value, kind: resolvedKind, truncate: truncateMode ?? "full" }
  };
  return <Tooltip tooltip={effectiveTooltip} fallback={defaultTooltip}>
    <code
      className={`sui-identifier sui-identifier-${resolvedKind}`}
      data-sui-component="Identifier"
      data-sui-kind={resolvedKind}
    >{displayed}</code>
  </Tooltip>;
}
