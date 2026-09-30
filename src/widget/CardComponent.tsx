import React, { type ReactNode } from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Status } from "../primitive/StatusComponent.js";
import { RecordMeta } from "./RecordMetaComponent.js";
import { relativeTimeLabel, timestamp as timestampLabel } from "../format.js";
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
  /** L3 doctrine: THE glanceable state — an iconized Status in a fixed header slot, visually distinct from taxonomy chips. */
  status?: string;
  chips?: ReadonlyArray<CardChip>;
  /** Visible chip cap (default 2); the rest collapse into a "+N" chip whose title lists them. */
  maxChips?: number;
  /** ISO timestamp — rendered relative + muted in the header, absolute on hover. */
  timestamp?: string;
  /** Demoted provenance footer (ids, hashes — full, copyable, out of the title's line). Entries per RecordMeta. */
  meta?: ReadonlyArray<{ label: string; value: string } | null>;
  actions?: ReactNode;
  maxHeight?: ClampToken;
  tone?: StatusTone;
  children: ReactNode;
  as?: CardTag;
  dataSuiComponent?: string;
  data?: DataAttributes;
}

function detectOverflowRef(node: HTMLElement | null) {
  if (!node) return;
  const measure = () => {
    node.dataset.suiOverflowing = String(node.scrollHeight > node.clientHeight);
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
    status,
    chips = [],
    maxChips = 2,
    timestamp: timestampValue,
    meta,
    actions = null,
    maxHeight,
    tone,
    children,
    as = "article",
    dataSuiComponent = "Card",
    data,
  } = props;
  const Tag = as as React.ElementType;
  const hasHeader = Boolean(title) || Boolean(subtitle) || chips.length > 0 || Boolean(actions) || Boolean(status) || Boolean(timestampValue);
  const visibleChips = chips.slice(0, Math.max(0, maxChips));
  const overflowChips = chips.slice(Math.max(0, maxChips));
  const popoverId = `${id}-detail`;
  const cardClassName = [
    "sui-card",
    maxHeight ? `sui-card-clamp--${maxHeight}` : null,
    tone ? `sui-card-tone--${tone}` : null,
  ].filter(Boolean).join(" ");
  return (
    <>
      <Tag
        id={id}
        className={cardClassName}
        data-sui-component={dataSuiComponent}
        {...(data ?? {})}
      >
        {hasHeader ? (
          <header className="sui-card-header">
            {status ? <span className="sui-card-status"><Status state={status} /></span> : null}
            {(title || subtitle) ? (
              <div className="sui-card-header-title">
                {title ? <Title level={titleLevel}>{title}</Title> : null}
                {subtitle ? <Description>{subtitle}</Description> : null}
              </div>
            ) : null}
            {(visibleChips.length > 0 || overflowChips.length > 0 || actions || timestampValue) ? (
              <div className="sui-card-header-actions">
                {visibleChips.map((chip) => (
                  <Status key={chip.label} state={chip.status ?? chip.label} icon={null} />
                ))}
                {overflowChips.length > 0 ? (
                  <span className="sui-card-chip-overflow chip blue" title={overflowChips.map((chip) => chip.label).join(", ")}>+{overflowChips.length}</span>
                ) : null}
                {timestampValue ? <small className="sui-card-timestamp" title={timestampLabel(timestampValue)}>{relativeTimeLabel(timestampValue)}</small> : null}
                {actions}
              </div>
            ) : null}
          </header>
        ) : null}
        <div
          ref={maxHeight ? detectOverflowRef : null}
          className={maxHeight ? "sui-card-body sui-card-body--clamped" : "sui-card-body"}
        >
          {children}
        </div>
        {meta?.some(Boolean) ? (
          <div className="sui-card-meta">
            <RecordMeta entries={meta as any} />
          </div>
        ) : null}
        {maxHeight ? (
          <footer className="sui-card-footer">
            <button
              type="button"
              className="sui-card-show-full"
              popoverTarget={popoverId}
              aria-label={title ? `Show full ${title}` : "Show full details"}
            >
              Show full
            </button>
          </footer>
        ) : null}
      </Tag>
      {maxHeight ? (
        <div id={popoverId} className="sui-card-detail-popover" popover="auto">
          <header className="sui-card-detail-popover-header">
            {title ? <Title level={titleLevel}>{title}</Title> : <span>Details</span>}
            <button
              type="button"
              className="sui-card-detail-close"
              popoverTarget={popoverId}
              popoverTargetAction="hide"
              aria-label="Hide details"
            >
              ×
            </button>
          </header>
          <div className="sui-card-detail-popover-body">{children}</div>
        </div>
      ) : null}
    </>
  );
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  dataSuiComponent?: string;
}

export function MetricCard(props: MetricCardProps) {
  const { label, value, detail, dataSuiComponent = "MetricCard" } = props;
  return (
    <article className="metric" data-sui-component={dataSuiComponent}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}
