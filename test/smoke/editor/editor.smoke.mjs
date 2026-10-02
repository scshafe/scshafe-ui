// Packed-install smoke, editor phase (scripts/release.config.mjs): with the
// tiptap peers added, @scshafe/ui/editor imports and renders, and the editor
// is not part of the root export.
import React from "react";
import { renderToString } from "react-dom/server";
import { MarkdownEditor } from "@scshafe/ui/editor";
import * as root from "@scshafe/ui";

if (typeof MarkdownEditor !== "function") throw new Error("editor export missing");
if ("MarkdownEditor" in root) throw new Error("MarkdownEditor is still in the root export");
const html = renderToString(React.createElement(MarkdownEditor, { ariaLabel: "Message", initialValue: "**hi**" }));
if (!html.includes('data-sui-component="MarkdownEditor"')) throw new Error("editor markup lacks its marker: " + html);
console.log("Editor smoke passed (@scshafe/ui/editor with its tiptap peers).");
