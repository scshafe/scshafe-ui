import React from "react";
import { Title } from "../primitive/TitleComponent.js";
import { Description } from "../primitive/DescriptionComponent.js";
import { Button } from "../primitive/ButtonComponent.js";
import { Tooltip } from "./TooltipComponent.js";

/**
 * Mutation form composite. Assembles a Title + optional Description, a
 * body slot for Label+Field rows, and a footer with primary/secondary
 * buttons. Use Editor for write surfaces (project create, plan edit,
 * agent server create); use Reader for the read-only counterpart.
 *
 * Props:
 *  - title: heading text
 *  - titleLevel: 1-6 (default 3)
 *  - description: optional helper text
 *  - children: form rows (typically Label + field control pairs)
 *  - onSubmit: called when the form is submitted; receives the form Event
 *  - submitLabel: text for the primary submit button (default "Save")
 *  - submitVariant: Button variant for the submit button (default "primary")
 *  - submitDisabled: when true, the submit button is disabled
 *  - secondaryAction: optional { label, onClick, variant } for a second button
 *  - error: optional error message displayed above the footer
 *  - tooltip: tooltip metadata object or string
 */
export function Editor({
  title = null,
  titleLevel = 3,
  description = null,
  children,
  onSubmit = null,
  submitLabel = "Save",
  submitVariant = "primary",
  submitDisabled = false,
  secondaryAction = null,
  error = null,
  tooltip = null
}) {
  const defaultTooltip = {
    component: "Editor",
    layer: "widget",
    description: "Mutation form composite: Title + Description header, Label+Field rows in the body, Button footer.",
    values: { title: title ?? "none", titleLevel, submitDisabled, hasSecondary: Boolean(secondaryAction), hasError: Boolean(error) }
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!onSubmit || submitDisabled) return;
    onSubmit(event);
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <form
      className="mc-editor"
      onSubmit={handleSubmit}
      data-mc-component="Editor"
    >
      {title || description ? (
        <header className="mc-editor-header">
          {title ? <Title level={titleLevel}>{title}</Title> : null}
          {description ? <Description>{description}</Description> : null}
        </header>
      ) : null}
      <div className="mc-editor-body">{children}</div>
      {error ? <p className="mc-editor-error" role="alert">{error}</p> : null}
      <footer className="mc-editor-footer">
        {secondaryAction ? (
          <Button
            variant={secondaryAction.variant ?? "ghost"}
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled ?? false}
            type="button"
          >{secondaryAction.label}</Button>
        ) : null}
        <Button
          variant={submitVariant}
          type="submit"
          disabled={submitDisabled}
        >{submitLabel}</Button>
      </footer>
    </form>
  </Tooltip>;
}
