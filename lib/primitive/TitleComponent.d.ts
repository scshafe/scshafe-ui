/**
 * Atomic title primitive. Renders the appropriate semantic heading tag
 * (h1-h6) with consistent typography. Cards, Panels, and Readers
 * compose Title + Description; this keeps the title styling consistent
 * across them.
 *
 * Props:
 *  - children: title text
 *  - level: 1-6, default 3 (h3 — typical card / section heading)
 *  - tooltip: tooltip metadata object or string
 */
export function Title({ children, level, tooltip }: {
    children: any;
    level?: number | undefined;
    tooltip?: null | undefined;
}): import("react/jsx-runtime").JSX.Element;
