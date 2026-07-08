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
export function Editor({ title, titleLevel, description, children, onSubmit, submitLabel, submitVariant, submitDisabled, secondaryAction, error, tooltip }: {
    title?: null | undefined;
    titleLevel?: number | undefined;
    description?: null | undefined;
    children: any;
    onSubmit?: null | undefined;
    submitLabel?: string | undefined;
    submitVariant?: string | undefined;
    submitDisabled?: boolean | undefined;
    secondaryAction?: null | undefined;
    error?: null | undefined;
    tooltip?: null | undefined;
}): import("react/jsx-runtime").JSX.Element;
