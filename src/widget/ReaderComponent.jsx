import React from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Tooltip } from "./TooltipComponent.js";

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
export function Reader({ title = null, titleLevel = 3, description = null, actions = null, children, tooltip = null }) {
  const defaultTooltip = {
    component: "Reader",
    layer: "widget",
    description: "Read-only detail composite assembled from Title + Description + body content.",
    values: { title: title ?? "none", titleLevel, hasDescription: Boolean(description), hasActions: Boolean(actions) }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <section
      className="sui-reader"
      data-sui-component="Reader"
    >
      {title || actions ? (
        <header className="sui-reader-header">
          <div className="sui-reader-heading">
            {title ? <Title level={titleLevel}>{title}</Title> : null}
            {description ? <Description>{description}</Description> : null}
          </div>
          {actions ? <div className="sui-reader-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="sui-reader-body">{children}</div>
    </section>
  </Tooltip>;
}
