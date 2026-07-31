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
export function Copyable({ value, kind, className, children, title, tooltip, ariaLabel, nested, ...rest }: {
    value: any;
    kind?: string;
    className?: any;
    children?: any;
    title?: any;
    tooltip?: any;
    ariaLabel?: any;
    nested?: boolean;
}): React.JSX.Element;
import React from "react";
