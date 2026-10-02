// Packed-install TypeScript smoke, editor phase: the editor's props and its
// imperative handle typecheck against the shipped .d.ts files.
import { createElement, createRef } from "react";
import { MarkdownEditor, type MarkdownEditorHandle, type MarkdownEditorProps } from "@scshafe/ui/editor";

const props: MarkdownEditorProps = { ariaLabel: "Message", onChange: (markdown: string) => void markdown };
export function Composer() {
  const ref = createRef<MarkdownEditorHandle>();
  return createElement(MarkdownEditor, { ...props, ref });
}
