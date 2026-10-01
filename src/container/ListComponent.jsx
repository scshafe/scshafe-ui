import React from "react";
import { EmptyState } from "../widget/EmptyStateComponent.js";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Tooltip } from "../widget/TooltipComponent.js";

/**
 * Container for a sequence of list rows (typically ListRow). Composes a
 * Title + Description header, an empty state fallback, and the children
 * wrapped in a single class so call sites stop reinventing the markup.
 *
 * Props:
 *  - title: optional list heading
 *  - description: optional list description
 *  - count: optional count shown in the header
 *  - empty: { message } for the EmptyState shown when children is empty (the
 *    same shape as @scshafe/ui/ssr's list). The older { title, description }
 *    shape still renders, as "title: description".
 *  - actions: optional node rendered on the right of the header
 *  - children: ListRow elements (or any rows)
 *  - tooltip: tooltip metadata object or string
 */
export function List({ title = null, description = null, count = null, empty = null, actions = null, children, tooltip = null }) {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const hasItems = childArray.length > 0;
  const defaultTooltip = {
    component: "List",
    layer: "container",
    description: "Container for a sequence of ListRow items with header + empty-state support.",
    values: { title: title ?? "none", count: count ?? childArray.length, hasItems }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <section
      className="sui-list"
      data-sui-component="List"
    >
      {title || actions ? (
        <header className="sui-list-header">
          <div className="sui-list-heading">
            {title ? <Title level={4}>{count !== null ? `${title} (${count})` : title}</Title> : null}
            {description ? <Description>{description}</Description> : null}
          </div>
          {actions ? <div className="sui-list-actions">{actions}</div> : null}
        </header>
      ) : null}
      {hasItems ? (
        <div className="sui-list-items">{children}</div>
      ) : empty ? (
        <EmptyState message={emptyMessage(empty)} />
      ) : null}
    </section>
  </Tooltip>;
}

/** The EmptyState message for `empty`: `message`, else the legacy title/description pair. */
function emptyMessage(empty) {
  if (empty.message !== undefined && empty.message !== null) return empty.message;
  const parts = [empty.title, empty.description].filter((part) => part !== undefined && part !== null && part !== "");
  return parts.length > 0 ? parts.join(": ") : "Nothing to show yet.";
}
