import React from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Tooltip } from "../widget/TooltipComponent.js";

/** @param {{ children: any, className?: string, componentName?: string, as?: string, tooltip?: any, [extra: string]: any }} props */
export function Panel({ children, className = "panel", componentName = "Panel", as = "section", tooltip, ...rest }) {
  const Tag = as;
  const defaultTooltip = {
    component: componentName,
    layer: "container",
    description: "Bounded content region with standard panel spacing and surface treatment.",
    values: { as, className }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <Tag
      className={className}
      data-sui-component={componentName}
      {...rest}
    >{children}</Tag>
  </Tooltip>;
}

/** @param {{ title: any, description?: any, aside?: any, children?: any, className?: string, headingLevel?: number, componentName?: string, tooltip?: any, [extra: string]: any }} props */
export function PanelHeader({ title, description, aside, children, className = "panel-header", headingLevel = 2, componentName = "PanelHeader", tooltip, ...rest }) {
  const defaultTooltip = {
    component: componentName,
    layer: "container",
    description: "Compact panel heading row with optional description, aside, and child actions.",
    values: { title, description: description ?? "none", aside: aside ?? "none" }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <div
      className={className}
      data-sui-component={componentName}
      {...rest}
    >
      <div>
        <Title level={headingLevel}>{title}</Title>
        {description ? <Description>{description}</Description> : null}
      </div>
      {children ?? (aside ? <span>{aside}</span> : null)}
    </div>
  </Tooltip>;
}
