import React from "react";
import {
  type BaseLayoutProps,
  type ClampToken,
  type SpaceToken,
  joinClasses,
  resolveBaseAttrs,
  spaceClass,
} from "./layoutShared.js";

export type StackAlign = "start" | "center" | "end" | "stretch";

export interface StackProps extends BaseLayoutProps {
  gap?: SpaceToken;
  align?: StackAlign;
  itemHeight?: ClampToken;
}

export const Stack = React.forwardRef<HTMLElement, StackProps>(function Stack(props, ref) {
  const {
    children,
    as,
    gap = "md",
    align = "stretch",
    itemHeight,
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
    "Stack",
  );
  const className = joinClasses(
    "mc-stack",
    spaceClass("mc-stack-gap", gap),
    `mc-stack-align--${align}`,
    itemHeight ? `mc-stack-item-height--${itemHeight}` : null,
  );
  return (
    <Tag ref={ref} className={className} {...attrs}>
      {children}
    </Tag>
  );
});
