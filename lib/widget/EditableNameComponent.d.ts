import React from "react";
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
export declare function EditableName({ value, isEditing, draft, canSave, isSaving, errorMessage, ariaLabel, className, onClick, onEditStart, onDraftChange, onSubmit, onCancel, }: EditableNameProps): React.JSX.Element;
