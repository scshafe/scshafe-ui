import React from "react";
export interface MarkdownEditorHandle {
    clear: () => void;
    setContent: (markdown: string) => void;
    getMarkdown: () => string;
    focus: () => void;
}
export interface MarkdownEditorProps {
    id?: string;
    initialValue?: string;
    placeholder?: string;
    disabled?: boolean;
    ariaLabel?: string;
    onChange?: (markdown: string) => void;
    onSubmit?: () => void;
    ref?: React.Ref<MarkdownEditorHandle>;
}
export declare function MarkdownEditor({ id, initialValue, placeholder, disabled, ariaLabel, onChange, onSubmit, ref, }: MarkdownEditorProps): import("react/jsx-runtime").JSX.Element;
