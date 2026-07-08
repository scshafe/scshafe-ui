/**
 * Read-only detail surface. Assembles Title + optional Description +
 * arbitrary content (typically MarkdownContent or a list of facts) into
 * a consistent reader card. Use Reader for entity detail views (plan
 * detail, project overview block, thought detail) and Editor for the
 * matching mutation form.
 *
 * Props:
 *  - title: heading text (rendered as a Title primitive)
 *  - titleLevel: 1-6 for the heading tag (default 3)
 *  - description: optional helper text under the title
 *  - actions: optional node rendered on the right side of the header
 *  - children: the body content (MarkdownContent, lists, tables, …)
 *  - tooltip: tooltip metadata object or string
 */
export function Reader({ title, titleLevel, description, actions, children, tooltip }: {
    title?: null | undefined;
    titleLevel?: number | undefined;
    description?: null | undefined;
    actions?: null | undefined;
    children: any;
    tooltip?: null | undefined;
}): import("react/jsx-runtime").JSX.Element;
