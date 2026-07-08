export function componentTooltip(metadata, { devUxEnabled = false } = {}) {
    const { component, layer, description, values } = metadata ?? {};
    const parts = [];
    if (devUxEnabled && (component || layer))
        parts.push("Dev UX: generic component metadata");
    if (component)
        parts.push(`Component: ${component}`);
    if (layer)
        parts.push(`Layer: ${layer}`);
    if (description)
        parts.push(`Purpose: ${description}`);
    const valueEntries = Array.isArray(values)
        ? values
        : Object.entries(values ?? {}).map(([label, value]) => ({ label, value }));
    const renderedValues = valueEntries
        .filter((entry) => entry && entry.value !== undefined && entry.value !== null && entry.value !== "")
        .map((entry) => `${entry.label}: ${String(entry.value)}`);
    if (renderedValues.length)
        parts.push(`Values: ${renderedValues.join("; ")}`);
    return parts.join(" | ");
}
// Combines a user-provided tooltip with optional dev-ux metadata fallback.
// In normal mode: returns the user tooltip text (or "" if absent). In
// dev-ux mode: returns user text plus the fallback metadata joined with
// " | ". Tooltip wrapper uses an empty result to skip rendering.
export function tooltipText(tooltip, { devUxEnabled = false, fallback = null } = {}) {
    const userText = typeof tooltip === "string" ? tooltip : componentTooltip(tooltip, { devUxEnabled });
    if (!devUxEnabled)
        return userText;
    const fallbackText = fallback && fallback !== tooltip
        ? (typeof fallback === "string" ? fallback : componentTooltip(fallback, { devUxEnabled }))
        : null;
    return [userText, fallbackText].filter(Boolean).join(" | ");
}
