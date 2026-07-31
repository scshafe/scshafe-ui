/** @param {{ id?: any, field?: any, label?: any, value?: any, options?: any, disabled?: boolean, tooltip?: any, className?: any, onChange?: any, optionDisabled?: any, optionTitle?: any, emptyLabel?: string, preserveUnknownValue?: boolean, [extra: string]: any }} props */
export function SelectField({ id, field, label, value, options, disabled, tooltip, className, onChange, optionDisabled, optionTitle, emptyLabel, preserveUnknownValue, ...rest }: {
    id?: any;
    field?: any;
    label?: any;
    value?: any;
    options?: any;
    disabled?: boolean;
    tooltip?: any;
    className?: any;
    onChange?: any;
    optionDisabled?: any;
    optionTitle?: any;
    emptyLabel?: string;
    preserveUnknownValue?: boolean;
    [extra: string]: any;
}): React.JSX.Element;
export function InputField({ id, label, value, placeholder, type, inputMode, autoComplete, disabled, readOnly, required, tooltip, className, onChange, ...rest }: {
    [x: string]: any;
    id: any;
    label: any;
    value: any;
    placeholder: any;
    type?: string | undefined;
    inputMode: any;
    autoComplete: any;
    disabled?: boolean | undefined;
    readOnly?: boolean | undefined;
    required?: boolean | undefined;
    tooltip: any;
    className: any;
    onChange: any;
}): React.JSX.Element;
export function TextAreaField({ id, label, value, placeholder, rows, disabled, readOnly, tooltip, className, onChange, ...rest }: {
    [x: string]: any;
    id: any;
    label: any;
    value: any;
    placeholder: any;
    rows?: number | undefined;
    disabled?: boolean | undefined;
    readOnly?: boolean | undefined;
    tooltip: any;
    className: any;
    onChange: any;
}): React.JSX.Element;
import React from "react";
