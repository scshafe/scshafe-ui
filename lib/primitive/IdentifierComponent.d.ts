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
export function Identifier({ value, kind, truncate: truncateMode, tooltip }: {
    value: any;
    kind?: string | undefined;
    truncate?: null | undefined;
    tooltip?: null | undefined;
}): React.JSX.Element;
import React from "react";
