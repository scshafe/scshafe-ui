import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function Editor({ title = null, titleLevel = 3, description = null, children, onSubmit = null, submitLabel = "Save", submitVariant = "primary", submitDisabled = false, secondaryAction = null, error = null, tooltip = null }) {
    const defaultTooltip = {
        component: "Editor",
        layer: "widget",
        description: "Mutation form composite: Title + Description header, Label+Field rows in the body, Button footer.",
        values: { title: title ?? "none", titleLevel, submitDisabled, hasSecondary: Boolean(secondaryAction), hasError: Boolean(error) }
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!onSubmit || submitDisabled)
            return;
        onSubmit(event);
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsxs("form", { className: "mc-editor", onSubmit: handleSubmit, "data-mc-component": "Editor", children: [title || description ? (_jsxs("header", { className: "mc-editor-header", children: [title ? _jsx(Title, { level: titleLevel, children: title }) : null, description ? _jsx(Description, { children: description }) : null] })) : null, _jsx("div", { className: "mc-editor-body", children: children }), error ? _jsx("p", { className: "mc-editor-error", role: "alert", children: error }) : null, _jsxs("footer", { className: "mc-editor-footer", children: [secondaryAction ? (_jsx(Button, { variant: secondaryAction.variant ?? "ghost", onClick: secondaryAction.onClick, disabled: secondaryAction.disabled ?? false, type: "button", children: secondaryAction.label })) : null, _jsx(Button, { variant: submitVariant, type: "submit", disabled: submitDisabled, children: submitLabel })] })] }) });
}
