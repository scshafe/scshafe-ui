import React from "react";
import {
  type BaseLayoutProps,
  joinClasses,
  resolveBaseAttrs,
} from "./layoutShared.js";

export type ScrollAxis = "y" | "x" | "both";
export type ScrollDimension = "fill" | "auto";

export interface ScrollProps extends BaseLayoutProps {
  axis?: ScrollAxis;
  height?: ScrollDimension;
  width?: ScrollDimension;
}

export const Scroll = React.forwardRef<HTMLElement, ScrollProps>(function Scroll(props, ref) {
  const {
    children,
    as,
    axis = "y",
    height = "fill",
    width = "fill",
    dataSuiComponent,
    id,
    role,
    data,
    ...aria
  } = props;
  const Tag = (as ?? "div") as React.ElementType;
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
    "Scroll",
  );
  const className = joinClasses(
    "sui-scroll",
    `sui-scroll-axis--${axis}`,
    `sui-scroll-height--${height}`,
    `sui-scroll-width--${width}`,
  );
  return (
    <Tag ref={ref} className={className} {...attrs}>
      {children}
    </Tag>
  );
});
