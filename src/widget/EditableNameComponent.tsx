import React from "react";
import { useIcon } from "./IconContext.js";
import { HoverButton } from "../primitive/HoverButtonComponent.js";

export interface EditableNameProps {
  value: string;
  isEditing: boolean;
  draft: string;
  canSave: boolean;
  isSaving: boolean;
  errorMessage?: string | null;
  ariaLabel?: string;
  className?: string;
  onClick?: () => void;
  onEditStart: () => void;
  onDraftChange: (next: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Name field with two states:
 *  • view: text button with a hover-revealed edit pencil. Clicking the
 *    name fires `onClick` (e.g. row select). Clicking the pencil fires
 *    `onEditStart`.
 *  • editing: input with submit + cancel controls.
 *
 * Caller owns state via `isEditing`, `draft`, callbacks. Pure
 * presentational — no useState, no timers, no auto-arming.
 */
export function EditableName({
  value,
  isEditing,
  draft,
  canSave,
  isSaving,
  errorMessage,
  ariaLabel,
  className,
  onClick,
  onEditStart,
  onDraftChange,
  onSubmit,
  onCancel,
}: EditableNameProps) {
  // C1: icon-name strings resolve through the INJECTED renderer. Called unconditionally per the rules of hooks,
  // even though the glyphs only appear in the editing branch below.
  const renderIcon = useIcon();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || isSaving) return;
    onSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <form
        className={`sui-editable-name sui-editable-name--editing ${className ?? ""}`}
        onSubmit={handleSubmit}
        data-sui-component="EditableName"
      >
        <input
          type="text"
          className="sui-editable-name-input"
          value={draft}
          aria-label={ariaLabel ?? "Edit name"}
          autoFocus
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
        />
        <button
          type="submit"
          className="sui-editable-name-submit"
          disabled={!canSave || isSaving}
          aria-label="Save name"
          title="Save"
        >
          {renderIcon("action.confirm", { size: 12, "aria-hidden": "true" })}
        </button>
        <button
          type="button"
          className="sui-editable-name-cancel"
          disabled={isSaving}
          onClick={onCancel}
          aria-label="Cancel edit"
          title="Cancel"
        >
          {renderIcon("action.close", { size: 12, "aria-hidden": "true" })}
        </button>
        {errorMessage ? <small className="sui-editable-name-error" role="alert">{errorMessage}</small> : null}
      </form>
    );
  }

  return (
    <span
      className={`sui-editable-name sui-hover-host ${className ?? ""}`}
      data-sui-component="EditableName"
    >
      <button
        type="button"
        className="sui-editable-name-text"
        aria-label={ariaLabel ? `${ariaLabel}: ${value}` : value}
        onClick={onClick}
      >
        {value}
      </button>
      <HoverButton
        icon="action.edit"
        label={`Edit ${value}`}
        title="Edit name"
        onClick={onEditStart}
        dataSuiComponent="EditableNameEdit"
      />
    </span>
  );
}
