// @scshafe/ui/editor — the tiptap markdown editor, in its own subpath so the
// root export and every other subpath never load tiptap. The tiptap packages
// are OPTIONAL peer dependencies: install them next to @scshafe/ui only when
// the app imports this subpath (README "Editor").
export * from "./MarkdownEditorComponent.js";
