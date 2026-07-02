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
    "Grid",
  );
  const className = joinClasses(
    "mc-grid",
    rowGap ? spaceClass("mc-grid-row-gap", rowGap) : spaceClass("mc-grid-gap", gap),
    columnGap ? spaceClass("mc-grid-col-gap", columnGap) : spaceClass("mc-grid-gap", gap),
    `mc-grid-align--${align}`,
    `mc-grid-justify--${justify}`,
    rowHeight ? `mc-grid-row-height--${rowHeight}` : null,
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
