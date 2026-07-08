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
 *  - empty: { title, description } for the EmptyState shown when children is empty
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
      className="mc-list"
      data-mc-component="List"
    >
      {title || actions ? (
        <header className="mc-list-header">
          <div className="mc-list-heading">
            {title ? <Title level={4}>{count !== null ? `${title} (${count})` : title}</Title> : null}
            {description ? <Description>{description}</Description> : null}
          </div>
          {actions ? <div className="mc-list-actions">{actions}</div> : null}
        </header>
      ) : null}
      {hasItems ? (
        <div className="mc-list-items">{children}</div>
      ) : empty ? (
        <EmptyState title={empty.title ?? "Empty"} description={empty.description ?? "Nothing to show yet."} />
      ) : null}
    </section>
  </Tooltip>;
}
