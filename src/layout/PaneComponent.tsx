import React, { type ReactNode } from "react";
import {
  type BaseLayoutProps,
  type SpaceToken,
  joinClasses,
  resolveBaseAttrs,
  spaceClass,
} from "./layoutShared.js";

export type PaneBodyScroll = "auto" | "always" | "never";
export type PaneHeight = "fill" | "auto";

export interface PaneProps extends BaseLayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
  bodyScroll?: PaneBodyScroll;
  height?: PaneHeight;
  padding?: SpaceToken;
}

export const Pane = React.forwardRef<HTMLElement, PaneProps>(function Pane(props, ref) {
  const {
    children,
    as,
    header,
    footer,
    bodyScroll = "auto",
    height = "fill",
    padding = "md",
    dataSuiComponent,
    id,
    role,
    data,
    ...aria
  } = props;
  const Tag = (as ?? "section") as React.ElementType;
  const attrs = resolveBaseAttrs(
    {
      id,
      role,
      "aria-label": aria["aria-label"],
      "aria-labelledby": aria["aria-labelledby"],
      "aria-describedby": aria["aria-describedby"],
      dataSuiComponent,
      data,
    },
    "Pane",
  );
  const className = joinClasses(
    "sui-pane",
    `sui-pane-height--${height}`,
  );
  const bodyClassName = joinClasses(
    "sui-pane-body",
    `sui-pane-body-scroll--${bodyScroll}`,
    spaceClass("sui-pane-body-padding", padding),
  );
  return (
    <Tag ref={ref} className={className} {...attrs}>
      {header !== undefined ? <div className="sui-pane-header">{header}</div> : null}
      <div className={bodyClassName}>{children}</div>
      {footer !== undefined ? <div className="sui-pane-footer">{footer}</div> : null}
    </Tag>
  );
});
