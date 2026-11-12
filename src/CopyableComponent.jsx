import React from "react";
import { Tooltip } from "./widget/TooltipComponent.js";

// One visually hidden polite live region, made on first use, announces copy results.
function announce(message) {
  const doc = globalThis.document;
  if (!doc?.body) return;
  let region = doc.querySelector("[data-sui-live-region='copyable']");
  const created = !region;
  if (!region) {
    region = doc.createElement("div");
    region.className = "sui-visually-hidden";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("data-sui-live-region", "copyable");
    doc.body.append(region);
  }
  // A region must exist before its text changes to be announced, and the same text twice in a
  // row is announced again only after a change: clear it, then set it on the next task.
  region.textContent = "";
  setTimeout(() => { region.textContent = message; }, created ? 100 : 30);
}

/**
 * Inline copy-to-clipboard token. Renders a real <button type="button"> so
 * the affordance is keyboard-reachable and discoverable; styling makes it
 * read as an inline text token with a subtle offset background.
 *
 * Usage:
 *   <Copyable value="agent-server" kind="slug">agent-server</Copyable>
 *   <Copyable value="b9b787e1-…" kind="id">b9b787e1…</Copyable>
 *   <Copyable value="Example workspace" kind="name">Example workspace</Copyable>
 *
 * Props:
 *  - value (string): the text written to the clipboard on click.
 *  - kind (string): visual variant — "name" | "slug" | "id" | "value" | "code".
 *      Defaults to "value" (subtle bg, no monospace).
 *  - children: the display content. When omitted, falls back to value.
 *  - className: extra classes forwarded to the button.
 *  - title: tooltip override; defaults to `Click to copy · <value>`.
 *
 * Feedback: once the clipboard write succeeds, the handler sets
 * data-sui-copied="true" on the DOM node for ~700ms; when there is no
 * clipboard (a plain-HTTP origin) or the write is refused, it sets
 * data-sui-copied="false" instead. CSS animates the transient flash, and a
 * polite live region announces the outcome to screen readers. No React
 * state — keeps the affordance compatible with the "render directly from
 * RTK" rule for everything else.
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
    // currentTarget is gone once the event has been handled: keep the node for the async result.
    const element = event.currentTarget;
    const report = (copied) => {
      const state = copied ? "true" : "false";
      if (element) {
        element.dataset.suiCopied = state;
        setTimeout(() => {
          if (element.dataset.suiCopied === state) delete element.dataset.suiCopied;
        }, 700);
      }
      announce(copied ? "Copied" : "Could not copy");
    };
    const clipboard = globalThis.navigator?.clipboard;
    if (!clipboard?.writeText) {
      report(false);
      return;
    }
    clipboard.writeText(text).then(() => report(true), () => report(false));
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
      className={`sui-copyable sui-copyable-${kind}${className ? ` ${className}` : ""}`}
      data-sui-component="Copyable"
      aria-label={ariaLabel ?? `Copy ${kind} ${value}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...rest}
    >{display}</span>
  </Tooltip>;
}
