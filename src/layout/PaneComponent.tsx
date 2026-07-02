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
    dataMcComponent,
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
      dataMcComponent,
      data,
    },
    "Pane",
  );
  const className = joinClasses(
    "mc-pane",
    `mc-pane-height--${height}`,
  );
  const bodyClassName = joinClasses(
    "mc-pane-body",
    `mc-pane-body-scroll--${bodyScroll}`,
    spaceClass("mc-pane-body-padding", padding),
  );
  return (
    <Tag ref={ref} className={className} {...attrs}>
      {header !== undefined ? <div className="mc-pane-header">{header}</div> : null}
      <div className={bodyClassName}>{children}</div>
      {footer !== undefined ? <div className="mc-pane-footer">{footer}</div> : null}
    </Tag>
  );
});
