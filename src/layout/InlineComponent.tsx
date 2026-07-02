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
    dataMcComponent,
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
      dataMcComponent,
      data,
    },
    "Inline",
  );
  const className = joinClasses(
    "mc-inline",
    spaceClass("mc-inline-gap", gap),
    `mc-inline-align--${align}`,
    `mc-inline-justify--${justify}`,
    wrap ? "mc-inline--wrap" : null,
  );
  return (
    <Tag ref={ref} className={className} {...attrs}>
      {children}
    </Tag>
  );
});
