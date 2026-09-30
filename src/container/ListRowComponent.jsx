import React from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Status } from "../primitive/StatusComponent.js";
import { Tooltip } from "../widget/TooltipComponent.js";
import { relativeTimeLabel, timestamp as timestampLabel } from "../format.js";

export function ListRow({ title, subtitle, titleLevel = 5, status, timestamp: timestampValue, chips = [], media, actions, children, className = "task-row", componentName = "ListRow", as = "div", tooltip, ...rest }) {
  const Tag = as;
  const defaultTooltip = {
    component: componentName,
    layer: "container",
    description: "Dense repeated row with optional media slot, Title + Description heading, status chips, action slot, and detail body.",
    values: { title, subtitle: subtitle ?? "none", titleLevel, chipCount: chips.length, hasMedia: Boolean(media), hasActions: Boolean(actions), className }
  };
  const hasAside = chips.length > 0 || Boolean(actions) || Boolean(status) || Boolean(timestampValue);
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <Tag
      className={className}
      data-sui-component={componentName}
      {...rest}
    >
      <div className="card-top">
        {media ? <div className="list-row-media">{media}</div> : null}
        <div className="list-row-content">
          <Title level={titleLevel}>{title}</Title>
          {subtitle ? <Description>{subtitle}</Description> : null}
        </div>
        {hasAside ? <div className="list-row-aside">
          {timestampValue ? <small className="sui-card-timestamp" title={timestampLabel(timestampValue)}>{relativeTimeLabel(timestampValue)}</small> : null}
          {status ? <span className="sui-card-status"><Status state={status} /></span> : null}
          {chips.length ? <div className="chips">{chips.map((chip) => <Status key={chip.value ?? chip} state={chip.value ?? chip} tooltip={chip.tooltip} icon={null} />)}</div> : null}
          {actions ? <div className="list-row-actions">{actions}</div> : null}
        </div> : null}
      </div>
      {children}
    </Tag>
  </Tooltip>;
}
