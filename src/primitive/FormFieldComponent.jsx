import React from "react";
import { Tooltip } from "../widget/TooltipComponent.js";

/** @param {{ id?: any, field?: any, label?: any, value?: any, options?: any, disabled?: boolean, tooltip?: any, className?: any, onChange?: any, optionDisabled?: any, optionTitle?: any, emptyLabel?: string, preserveUnknownValue?: boolean, [extra: string]: any }} props */
export function SelectField({ id, field, label, value, options = [], disabled = false, tooltip, className, onChange, optionDisabled, optionTitle, emptyLabel = "None", preserveUnknownValue = false, ...rest }) {
  const defaultTooltip = {
    component: "SelectField",
    layer: "primitive",
    description: "Compact labeled select used for option sets in dense toolbars and composers.",
    values: { field, label, value, optionCount: options.length, disabled }
  };
  const hasValue = options.some((option) => option.value === value);
  const valueProps = onChange ? { value: value ?? "" } : { defaultValue: value ?? "" };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip}>
    <label
      className={`project-chat-composer-context project-chat-composer-context-control${className ? ` ${className}` : ""}`}
      data-field={field}
      htmlFor={id}
      data-mc-component="SelectField"
    >
      <span>{label}</span>
      <select
        id={id}
        {...valueProps}
        disabled={disabled || options.length === 0}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        aria-label={label}
        {...rest}
      >
        {value && preserveUnknownValue && !hasValue ? <option value={value}>{value}</option> : null}
        {options.length === 0 ? <option value="">{emptyLabel}</option> : options.map((option) => <option key={option.value} value={option.value} disabled={optionDisabled?.(option) ?? option.disabled ?? false} title={optionTitle?.(option) ?? option.title ?? undefined}>{option.label}</option>)}
      </select>
    </label>
  </Tooltip>;
}

export function InputField({ id, label, value, placeholder, type = "text", inputMode, autoComplete, disabled = false, readOnly = false, required = false, tooltip, className, onChange, ...rest }) {
  const defaultTooltip = {
    component: "InputField",
    layer: "primitive",
    description: "Single-line labeled text input. Use for short string values; pair with Description for hints, TextAreaField for multi-line, MarkdownEditor for prose bodies.",
    values: { label, type, disabled, readOnly, required, valueLength: String(value ?? "").length }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip}>
    <label
      className={`mc-input-field${className ? ` ${className}` : ""}`}
      htmlFor={id}
      data-mc-component="InputField"
    >
      <span className="mc-input-field-label">{label}{required ? <span className="mc-input-field-required" aria-hidden="true"> *</span> : null}</span>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        readOnly={readOnly || !onChange}
        required={required}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        aria-label={label}
        {...rest}
      />
    </label>
  </Tooltip>;
}

export function TextAreaField({ id, label, value, placeholder, rows = 3, disabled = false, readOnly = false, tooltip, className, onChange, ...rest }) {
  const defaultTooltip = {
    component: "TextAreaField",
    layer: "primitive",
    description: "Multi-line text entry surface. It can be read-only for catalog examples or writable in product flows.",
    values: { label, rows, disabled, readOnly, valueLength: String(value ?? "").length }
  };
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip}>
    <label
      className={`text-area-field${className ? ` ${className}` : ""}`}
      htmlFor={id}
      data-mc-component="TextAreaField"
    >
      <span className="sr-only">{label}</span>
      <textarea
        id={id}
        value={value ?? ""}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        readOnly={readOnly || !onChange}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        aria-label={label}
        {...rest}
      />
    </label>
  </Tooltip>;
}
