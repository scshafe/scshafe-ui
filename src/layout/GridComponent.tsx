import React from "react";
import {
  type BaseLayoutProps,
  type ClampToken,
  type SpaceToken,
  joinClasses,
  resolveBaseAttrs,
  spaceClass,
} from "./layoutShared.js";

export type GridColumns =
  | { kind: "equal"; count: number }
  | { kind: "autoFit"; minSize: string };

export type GridAlign = "start" | "center" | "end" | "stretch";
export type GridJustify = "start" | "center" | "end" | "stretch";

export interface GridProps extends BaseLayoutProps {
  columns: GridColumns;
  gap?: SpaceToken;
  rowGap?: SpaceToken;
  columnGap?: SpaceToken;
  rowHeight?: ClampToken;
  align?: GridAlign;
  justify?: GridJustify;
}

function gridTemplateColumns(columns: GridColumns): string {
  if (columns.kind === "equal") {
    if (!Number.isFinite(columns.count) || columns.count < 1) {
      throw new Error(`Grid columns.count must be a positive integer (got ${columns.count})`);
    }
    return `repeat(${Math.trunc(columns.count)}, minmax(0, 1fr))`;
  }
  return `repeat(auto-fit, minmax(${columns.minSize}, 1fr))`;
}

export const Grid = React.forwardRef<HTMLElement, GridProps>(function Grid(props, ref) {
  const {
    children,
    as,
    columns,
    gap = "md",
    rowGap,
    columnGap,
    rowHeight,
    align = "stretch",
    justify = "stretch",
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
    "Grid",
  );
  const className = joinClasses(
    "sui-grid",
    rowGap ? spaceClass("sui-grid-row-gap", rowGap) : spaceClass("sui-grid-gap", gap),
    columnGap ? spaceClass("sui-grid-col-gap", columnGap) : spaceClass("sui-grid-gap", gap),
    `sui-grid-align--${align}`,
    `sui-grid-justify--${justify}`,
    rowHeight ? `sui-grid-row-height--${rowHeight}` : null,
  );
  return (
    <Tag
      ref={ref}
      className={className}
      style={{ gridTemplateColumns: gridTemplateColumns(columns) }}
      {...attrs}
    >
      {children}
    </Tag>
  );
});
