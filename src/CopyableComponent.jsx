import React from "react";
import { Tooltip } from "./widget/TooltipComponent.js";

/**
 * Inline copy-to-clipboard token. Renders a real <button type="button"> so
 * the affordance is keyboard-reachable and discoverable; styling makes it
 * read as an inline text token with a subtle offset background.
 *
 * Usage:
 *   <Copyable value="agent-server" kind="slug">agent-server</Copyable>
 *   <Copyable value="b9b787e1-…" kind="id">b9b787e1…</Copyable>
 *   <Copyable value="Mission Control demo" kind="name">Mission Control demo</Copyable>
 *
 * Props:
 *  - value (string): the text written to the clipboard on click.
 *  - kind (string): visual variant — "name" | "slug" | "id" | "value" | "code".
 *      Defaults to "value" (subtle bg, no monospace).
 *  - children: the display content. When omitted, falls back to value.
 *  - className: extra classes forwarded to the button.
 *  - title: tooltip override; defaults to `Click to copy · <value>`.
 *
 * Feedback: on click, the click handler sets data-copied="true" on the DOM
 * node for ~700ms and removes it after the timeout. CSS animates the
 * transient confirmation flash. No React state — keeps the affordance
 * compatible with the "render directly from RTK" rule for everything else.
 */
/** @param {{ value: any, kind?: string, className?: any, children?: any, title?: any, tooltip?: any, ariaLabel?: any, nested?: boolean }} props */
export function Copyable({
  value,
  kind = "value",
  className,
  children,
  title,
  tooltip,
  ariaLabel,
  // Render as a span (default) so this is safe to nest inside a parent
  // <button> row without producing invalid HTML. The span is still
  // clickable + keyboard-reachable via role=button + tabIndex=0.
  // Pass nested if you know it sits inside another interactive element
  // and want the inner copy affordance out of the tab order.
  nested = false,
  ...rest
}) {
  const display = children ?? value;
  const defaultTooltip = {
    component: "Copyable",
    layer: "primitive",
    description: "Inline copy affordance with transient DOM-only feedback.",
    values: { kind, value }
  };
  const onClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const text = typeof value === "string" ? value : String(value ?? "");
    if (!text) return;
    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard?.writeText) void clipboard.writeText(text);
    const element = event.currentTarget;
    if (element) {
      element.dataset.copied = "true";
      setTimeout(() => {
        if (element.dataset.copied === "true") delete element.dataset.copied;
      }, 700);
    }
  };
  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onClick(event);
    }
  };
  return <Tooltip tooltip={tooltip ?? title} fallback={defaultTooltip}>
    <span
      role="button"
      tabIndex={nested ? -1 : 0}
      className={`copyable copyable-${kind}${className ? ` ${className}` : ""}`}
      data-mc-component="Copyable"
      aria-label={ariaLabel ?? `Copy ${kind} ${value}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...rest}
    >{display}</span>
  </Tooltip>;
}
