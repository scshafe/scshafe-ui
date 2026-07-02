import type { ReactNode } from "react";

export type SpaceToken = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export type ClampToken = "2xs" | "xs" | "sm" | "md" | "lg" | "xl";

export type StatusTone = "blue" | "green" | "yellow" | "orange" | "red" | "purple";

export type LayoutTag =
  | "div"
  | "section"
  | "article"
  | "header"
  | "footer"
  | "main"
  | "nav"
  | "aside"
  | "ul"
  | "ol"
  | "li";

export type DataAttributes = Record<`data-${string}`, string | number | boolean | undefined>;

export interface BaseLayoutProps {
  children: ReactNode;
  as?: LayoutTag;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  dataMcComponent?: string;
  data?: DataAttributes;
}

export type ResolvedBaseAttrs = {
  id: string | undefined;
  role: string | undefined;
  "aria-label": string | undefined;
  "aria-labelledby": string | undefined;
  "aria-describedby": string | undefined;
  "data-mc-component": string;
} & DataAttributes;

export function resolveBaseAttrs(
  props: Omit<BaseLayoutProps, "children" | "as">,
  defaultMcComponent: string,
): ResolvedBaseAttrs {
  return {
    id: props.id,
    role: props.role,
    "aria-label": props["aria-label"],
    "aria-labelledby": props["aria-labelledby"],
    "aria-describedby": props["aria-describedby"],
    "data-mc-component": props.dataMcComponent ?? defaultMcComponent,
    ...(props.data ?? {}),
  };
}

export function spaceClass(prefix: string, token: SpaceToken): string {
  return `${prefix}--${token}`;
}

export function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter((c): c is string => Boolean(c)).join(" ");
}
