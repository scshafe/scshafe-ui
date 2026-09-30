import React from "react";
import {
  type BaseLayoutProps,
  type SpaceToken,
  joinClasses,
  resolveBaseAttrs,
  spaceClass,
} from "./layoutShared.js";

export type InlineAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type InlineJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

export interface InlineProps extends BaseLayoutProps {
  gap?: SpaceToken;
  align?: InlineAlign;
  justify?: InlineJustify;
  wrap?: boolean;
}

export const Inline = React.forwardRef<HTMLElement, InlineProps>(function Inline(props, ref) {
  const {
    children,
    as,
    gap = "sm",
    align = "center",
    justify = "start",
    wrap = false,
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
    "Inline",
  );
  const className = joinClasses(
    "sui-inline",
    spaceClass("sui-inline-gap", gap),
    `sui-inline-align--${align}`,
    `sui-inline-justify--${justify}`,
    wrap ? "sui-inline--wrap" : null,
  );
  return (
    <Tag ref={ref} className={className} {...attrs}>
      {children}
    </Tag>
  );
});
