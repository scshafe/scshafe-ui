import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";

export interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "checked" | "defaultChecked" | "children"> {
  id: string;
  /** The visible label; it names the checkbox through `<label for>`. */
  label: React.ReactNode;
  /** With `onChange`, the controlled state; without it, the initial state (uncontrolled). */
  checked?: boolean;
  /** Called with the new state. Without it the checkbox is uncontrolled, as a plain form field. */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Help text under the label, tied to the checkbox with aria-describedby. */
  description?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  tooltip?: unknown;
}

/** A labelled checkbox: the input, its label beside it, and optional help text under the label. */
export function CheckboxField({ id, label, checked, onChange, description, required = false, disabled = false, className, tooltip, "aria-describedby": describedBy, ...rest }: CheckboxFieldProps) {
  const defaultTooltip = {
    component: "CheckboxField",
    layer: "primitive",
    description: "Labelled checkbox for one on/off value, with optional help text.",
    values: { checked: Boolean(checked), disabled, required }
  };
  const descriptionId = description !== undefined && description !== null && description !== false ? `${id}-description` : undefined;
  const stateProps = onChange ? { checked: Boolean(checked) } : { defaultChecked: Boolean(checked) };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <div className={`sui-checkbox-field${className ? ` ${className}` : ""}`} data-sui-component="CheckboxField">
      <input
        {...rest}
        id={id}
        type="checkbox"
        className="sui-checkbox-field-input"
        {...stateProps}
        disabled={disabled}
        required={required}
        aria-describedby={[describedBy, descriptionId].filter(Boolean).join(" ") || undefined}
        onChange={onChange ? (event) => onChange(event.target.checked, event) : undefined}
      />
      <label className="sui-checkbox-field-label" htmlFor={id}>
        {label}{required ? <span className="sui-checkbox-field-required" aria-hidden="true"> *</span> : null}
      </label>
      {descriptionId ? <span className="sui-checkbox-field-description" id={descriptionId}>{description}</span> : null}
    </div>
  </Tooltip>;
}
