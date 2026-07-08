/**
 * Container for a sequence of list rows (typically ListRow). Composes a
 * Title + Description header, an empty state fallback, and the children
 * wrapped in a single class so call sites stop reinventing the markup.
 *
 * Props:
 *  - title: optional list heading
 *  - description: optional list description
 *  - count: optional count shown in the header
 *  - empty: { title, description } for the EmptyState shown when children is empty
 *  - actions: optional node rendered on the right of the header
 *  - children: ListRow elements (or any rows)
 *  - tooltip: tooltip metadata object or string
 */
export function List({ title, description, count, empty, actions, children, tooltip }: {
    title?: null | undefined;
    description?: null | undefined;
    count?: null | undefined;
    empty?: null | undefined;
    actions?: null | undefined;
    children: any;
    tooltip?: null | undefined;
}): import("react/jsx-runtime").JSX.Element;
