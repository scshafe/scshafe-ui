import React, { type ReactNode } from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Status } from "../primitive/StatusComponent.js";
import { type ClampToken, type DataAttributes, type StatusTone } from "../layout/layoutShared.js";

export interface CardChip {
  label: string;
  status?: string;
  tooltip?: string;
}

export type CardTag = "article" | "section" | "div";
export type CardHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface CardProps {
  id: string;
  title?: string;
  subtitle?: string;
  titleLevel?: CardHeadingLevel;
  chips?: ReadonlyArray<CardChip>;
  actions?: ReactNode;
  maxHeight?: ClampToken;
  tone?: StatusTone;
  children: ReactNode;
  as?: CardTag;
  dataMcComponent?: string;
  data?: DataAttributes;
}

function detectOverflowRef(node: HTMLElement | null) {
  if (!node) return;
  const measure = () => {
    node.dataset.mcOverflowing = String(node.scrollHeight > node.clientHeight);
  };
  measure();
  if (typeof ResizeObserver === "undefined") return;
  const observer = new ResizeObserver(measure);
  observer.observe(node);
  return () => observer.disconnect();
}

export function Card(props: CardProps) {
  const {
    id,
    title,
    subtitle,
    titleLevel = 4,
    chips = [],
    actions = null,
    maxHeight,
    tone,
    children,
    as = "article",
    dataMcComponent = "Card",
    data,
  } = props;
  const Tag = as as React.ElementType;
  const hasHeader = Boolean(title) || Boolean(subtitle) || chips.length > 0 || Boolean(actions);
  const popoverId = `${id}-detail`;
  const cardClassName = [
    "mc-card",
    maxHeight ? `mc-card-clamp--${maxHeight}` : null,
    tone ? `mc-card-tone--${tone}` : null,
  ].filter(Boolean).join(" ");
  return (
    <>
      <Tag
        id={id}
        className={cardClassName}
        data-mc-component={dataMcComponent}
        {...(data ?? {})}
      >
        {hasHeader ? (
          <header className="mc-card-header">
            {(title || subtitle) ? (
              <div className="mc-card-header-title">
                {title ? <Title level={titleLevel}>{title}</Title> : null}
                {subtitle ? <Description>{subtitle}</Description> : null}
              </div>
            ) : null}
            {(chips.length > 0 || actions) ? (
              <div className="mc-card-header-actions">
                {chips.map((chip) => (
                  <Status key={chip.label} state={chip.status ?? chip.label} />
                ))}
                {actions}
              </div>
            ) : null}
          </header>
        ) : null}
        <div
          ref={maxHeight ? detectOverflowRef : null}
          className={maxHeight ? "mc-card-body mc-card-body--clamped" : "mc-card-body"}
        >
          {children}
        </div>
        {maxHeight ? (
          <footer className="mc-card-footer">
            <button
              type="button"
              className="mc-card-show-full"
              popoverTarget={popoverId}
              aria-label={title ? `Show full ${title}` : "Show full details"}
            >
              Show full
            </button>
          </footer>
        ) : null}
      </Tag>
      {maxHeight ? (
        <div id={popoverId} className="mc-card-detail-popover" popover="auto">
          <header className="mc-card-detail-popover-header">
            {title ? <Title level={titleLevel}>{title}</Title> : <span>Details</span>}
            <button
              type="button"
              className="mc-card-detail-close"
              popoverTarget={popoverId}
              popoverTargetAction="hide"
              aria-label="Hide details"
            >
              ×
            </button>
          </header>
          <div className="mc-card-detail-popover-body">{children}</div>
        </div>
      ) : null}
    </>
  );
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  dataMcComponent?: string;
}

export function MetricCard(props: MetricCardProps) {
  const { label, value, detail, dataMcComponent = "MetricCard" } = props;
  return (
    <article className="metric" data-mc-component={dataMcComponent}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}
