import { jsx as _jsx } from "react/jsx-runtime";
import React, { useImperativeHandle } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
export function MarkdownEditor({ id, initialValue, placeholder, disabled, ariaLabel, onChange, onSubmit, ref, }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // tighten markdown surface — drop features we don't want in chat composer
                horizontalRule: false,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
            }),
            Placeholder.configure({
                placeholder: placeholder ?? "",
            }),
            Markdown.configure({
                html: false,
                tightLists: true,
                bulletListMarker: "-",
                linkify: true,
                breaks: true,
            }),
        ],
        content: initialValue ?? "",
        editable: !disabled,
        onUpdate: ({ editor }) => {
            if (!onChange)
                return;
            const storage = editor.storage.markdown;
            const md = storage?.getMarkdown() ?? "";
            onChange(md);
        },
        editorProps: {
            attributes: {
                ...(id ? { id } : {}),
                class: "mc-markdown-editor-content",
                ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
            },
            handleKeyDown: (_view, event) => {
                if (onSubmit && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    onSubmit();
                    return true;
                }
                return false;
            },
        },
    });
    useImperativeHandle(ref, () => ({
        clear: () => {
            editor?.commands.clearContent();
        },
        setContent: (md) => {
            editor?.commands.setContent(md);
        },
        getMarkdown: () => {
            const storage = editor?.storage?.markdown;
            return storage?.getMarkdown() ?? "";
        },
        focus: () => {
            editor?.commands.focus();
        },
    }), [editor]);
    return (_jsx("section", { className: "mc-markdown-editor", "data-mc-component": "MarkdownEditor", children: _jsx(EditorContent, { editor: editor }) }));
}
