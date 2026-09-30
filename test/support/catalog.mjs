// The component catalog the namespace, accessibility and keyboard-focus tests
// share: every public component, rendered through the package's public
// specifiers with realistic props. `focus` names the element(s) a keyboard
// user must be able to Tab to (a CSS selector inside the rendered component);
// entries without it render nothing interactive.
import React from "react";
import * as ui from "@scshafe/ui";
import * as state from "@scshafe/ui/state";
import * as identity from "@scshafe/ui/identity";
import { DefaultIconProvider } from "@scshafe/ui/icons";

const h = React.createElement;
const noop = () => {};

function withStore(preloadedState, element, slices = [state.Toasts, state.Popovers, state.ConfirmDialog, state.DataTablePreferences, state.Layout, state.PaneSizes]) {
  const store = state.createSuiStore({ slices, preloadedState });
  return h(state.SuiProviders, { store }, element);
}

function withOpenPopover(id, element) {
  const controller = { openId: id, anchor: { x: 10, y: 10 }, open: noop, close: noop, closeIfCurrent: noop };
  return h(ui.PopoverControllerContext.Provider, { value: controller }, element);
}

const tableColumns = [
  { id: "name", header: "Name", width: 200, rowHeader: true, pinned: "left", render: (row) => row.name },
  { id: "size", header: "Size", align: "right", render: (row) => String(row.size) }
];
const tableRows = [{ id: "a", name: "alpha.txt", size: 12 }, { id: "b", name: "beta.txt", size: 40 }];

export const CATALOG = [
  // Layout primitives
  { name: "Stack", render: () => h(ui.Stack, { gap: "md" }, h("p", null, "one"), h("p", null, "two")) },
  { name: "Inline", render: () => h(ui.Inline, { gap: "sm", wrap: true }, h("span", null, "a"), h("span", null, "b")) },
  { name: "Grid", render: () => h(ui.Grid, { gap: "md", columns: { kind: "equal", count: 2 } }, h("div", null, "a"), h("div", null, "b")) },
  { name: "Pane", render: () => h(ui.Pane, { header: h("h2", null, "Pane"), footer: h("p", null, "footer") }, h("p", null, "body")) },
  { name: "Scroll", render: () => h(ui.Scroll, { axis: "y" }, h("p", null, "scrolling content")) },
  // Primitives
  { name: "Kbd", render: () => h(ui.Kbd, { keys: ["Ctrl", "K"] }) },
  { name: "Badge", render: () => h(ui.Badge, { value: 3, label: "open", tone: "green" }) },
  { name: "Status", render: () => h(ui.Status, { state: "running" }) },
  { name: "StatCount", render: () => h(ui.StatCount, { state: "failed", count: 2 }) },
  { name: "Description", render: () => h(ui.Description, null, "Helper text for a field.") },
  { name: "Identifier", render: () => h(ui.Identifier, { value: "b9b787e1-5c1f-4f59-9a7e-2d1c0a6b1f00", kind: "uuid" }) },
  { name: "Label", render: () => h(ui.Stack, null, h(ui.Label, { htmlFor: "catalog-label-input", required: true }, "Name"), h("input", { id: "catalog-label-input" })) },
  { name: "Title", render: () => h(ui.Title, { level: 2 }, "Section title") },
  { name: "InputField", focus: "input", render: () => h(ui.InputField, { id: "catalog-name", label: "Name", value: "Ada", onChange: noop, required: true }) },
  { name: "SelectField", focus: "select", render: () => h(ui.SelectField, { id: "catalog-kind", label: "Kind", value: "a", options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }], onChange: noop }) },
  { name: "TextAreaField", focus: "textarea", render: () => h(ui.TextAreaField, { id: "catalog-note", label: "Note", value: "", onChange: noop }) },
  { name: "Button", focus: "button", render: () => h(ui.Button, { label: "Save", icon: "action.confirm", variant: "primary", tooltip: "Save the draft" }) },
  { name: "IconButton", focus: "button", render: () => h(ui.IconButton, { label: "Refresh", icon: "action.refresh" }) },
  { name: "HoverButton", focus: "button", render: () => h("div", { className: "sui-hover-host" }, h("span", null, "Row"), h(ui.HoverButton, { icon: "action.edit", label: "Rename row" })) },
  { name: "Copyable", focus: "[data-sui-component=Copyable]", render: () => h(ui.Copyable, { value: "agent-server", kind: "slug" }, "agent-server") },
  { name: "MarkdownContent", render: () => h(ui.MarkdownContent, { value: "# Heading\n\nSome **bold** text and `code`.\n\n- one\n- two\n\n```\nblock\n```" }) },
  // Composites
  { name: "EmptyState", render: () => h(ui.EmptyState, { message: "Nothing here yet.", icon: "tab.runs" }) },
  { name: "List", render: () => h(ui.List, { title: "Runs", count: 1, description: "Recent runs." }, h(ui.ListRow, { title: "Nightly build", subtitle: "main", status: "running" })) },
  { name: "ListRow", render: () => h(ui.ListRow, { title: "Nightly build", subtitle: "main", status: "running", chips: ["retry_scheduled"], timestamp: "2026-09-29T10:00:00Z" }) },
  { name: "Panel", render: () => h(ui.Panel, null, h(ui.PanelHeader, { title: "Panel", aside: "3 items" }), h("p", null, "Panel body.")) },
  { name: "Reader", render: () => h(ui.Reader, { title: "Plan", description: "Read-only detail." }, h("p", null, "Body.")) },
  { name: "Editor", focus: "button[type=submit]", render: () => h(ui.Editor, { title: "Edit plan", submitLabel: "Save", secondaryAction: { label: "Cancel", onClick: noop }, error: "Name is required." }, h(ui.InputField, { id: "catalog-editor-name", label: "Plan name", value: "", onChange: noop })) },
  { name: "Tab", focus: "button", render: () => h(ui.Tab, { id: "plans", label: "Plans", icon: "tab.plans", active: true, badge: 4, onSelect: noop }) },
  { name: "FocusTabs", focus: "button", render: () => h(ui.FocusTabs, { model: { role: "tablist", ariaLabel: "Workspace focus", items: [
    { key: "a", id: "overview", icon: "tab.overview", tooltip: "Overview", ariaSelected: true, countBadges: [{ label: "open", value: 3 }] },
    { key: "b", id: "runs", icon: "tab.runs", tooltip: "Runs", ariaSelected: false, dividerBefore: true }
  ] }, onSelect: noop }) },
  { name: "TabPanelHeader", focus: "button", render: () => h(ui.TabPanelHeader, { title: "Plans", aside: "12 open", statusLabel: "refreshed 2m ago", refresh: { onClick: noop, label: "Refresh plans" } }) },
  { name: "EditableName", focus: "button", render: () => h(ui.EditableName, { value: "Nightly", isEditing: false, draft: "Nightly", canSave: true, isSaving: false, onEditStart: noop, onDraftChange: noop, onSubmit: noop, onCancel: noop }) },
  { name: "EditableNameEditing", focus: "input", render: () => h(ui.EditableName, { value: "Nightly", isEditing: true, draft: "Nightly 2", canSave: true, isSaving: false, errorMessage: "Name taken.", onEditStart: noop, onDraftChange: noop, onSubmit: noop, onCancel: noop }) },
  { name: "Card", focus: "button.sui-card-show-full", render: () => h(ui.Card, { id: "catalog-card", title: "Deploy", subtitle: "production", status: "running", chips: [{ label: "infra" }, { label: "urgent" }, { label: "ops" }], timestamp: "2026-09-29T10:00:00Z", meta: [{ label: "id", value: "c-1" }], maxHeight: "sm", tone: "green" }, h("p", null, "Card body.")) },
  { name: "MetricCard", render: () => h(ui.MetricCard, { label: "Open", value: 12, detail: "since Monday" }) },
  { name: "ChipList", render: () => h(ui.ChipList, { items: [{ label: "infra", status: "running" }, { label: "ops" }] }) },
  { name: "RecordMeta", render: () => h(ui.RecordMeta, { entries: [{ label: "id", value: "r-1" }, { label: "by", value: "ada" }] }) },
  { name: "MessageBubble", render: () => h(ui.MessageBubble, { message: { role: "assistant", title: "Assistant", timeLabel: "10:02", status: "completed", isFinal: true, parts: [{ id: "p1", label: "Answer", markdown: true, content: "Done — see **notes**." }] } }) },
  { name: "InfiniteScrollSentinel", render: () => h(ui.InfiniteScrollSentinel, { onLoadMore: noop, disabled: true }, "Showing 20 of 40") },
  { name: "PinnedDataTable", focus: "[role=separator]", render: () => h(ui.PinnedDataTable, { ariaLabel: "Files", tableId: "files", columns: tableColumns, rows: tableRows, rowKey: (row) => row.id, onColumnWidthSet: noop, onColumnWidthReset: noop }) },
  { name: "Sheet", focus: "button", render: () => h(ui.Sheet, { open: true, onClose: noop, side: "center", ariaLabel: "Settings" }, h(ui.SheetHeader, { title: "Settings", description: "Change settings." }), h(ui.SheetBody, null, h("p", null, "Body")), h(ui.SheetFooter, null, h(ui.Button, { label: "Close" }))) },
  { name: "Popover", render: () => withOpenPopover("catalog-popover", h(ui.Popover, { id: "catalog-popover", ariaLabel: "Details" }, h("p", null, "Popover content"))) },
  { name: "HoverCard", render: () => withOpenPopover("catalog-hover", h(ui.HoverCard, { id: "catalog-hover", content: h("strong", null, "More"), ariaLabel: "More" }, h("span", null, "hover me"))) },
  // State layer
  { name: "ToastTray", focus: "button", render: () => withStore({ Toasts: { items: [{ id: "t1", kind: "error", message: "Save failed" }, { id: "t2", kind: "success", message: "Saved" }, { id: "t3", kind: "info", message: "Syncing" }] } }, h(state.ToastTray)) },
  { name: "ConfirmDialog", focus: "button", render: () => withStore({ ConfirmDialog: { open: true, prompt: { title: "Delete plan?", message: "This cannot be undone.", confirmLabel: "Delete", cancelLabel: "Cancel", kind: "danger" } } }, h(state.ConfirmDialogComponent)) },
  { name: "ContextMenu", focus: "[role=menuitem]", render: () => withStore({ Popovers: { openId: "catalog-cm", anchor: { x: 4, y: 4 }, payload: null } }, h(state.ContextMenu, { id: "catalog-cm", ariaLabel: "Row actions", items: [{ label: "Copy id", action: noop, icon: "action.copy", kbd: "C" }, { label: "Delete", action: noop, danger: true }] }, h("span", null, "row"))) },
  { name: "MoreActionsMenu", focus: "button", render: () => withStore({ Popovers: { openId: "catalog-more", anchor: { x: 4, y: 4 }, payload: null } }, h("div", { className: "sui-hover-host" }, h(state.MoreActionsMenu, { id: "catalog-more", items: [{ label: "Rename", action: noop }] }))) },
  { name: "DataTableColumnMenu", focus: "button", render: () => withStore({ Popovers: { openId: "data-table-columns:files", anchor: { x: 4, y: 4 }, payload: null } }, h(state.DataTableColumnMenu, { tableId: "files", columns: tableColumns })) },
  { name: "CollapsibleListRail", focus: "button", render: () => withStore(undefined, h(state.CollapsibleListRail, { surfaceId: "plans", title: "Plans", actions: h(ui.IconButton, { label: "Add plan", icon: "action.add", size: "mini" }) }, h("p", null, "rows"))) },
  { name: "RailToggle", focus: "button", render: () => withStore(undefined, h(state.RailToggle, { surfaceId: "plans", title: "Plans" })) },
  { name: "FocusSelectionList", focus: "button", render: () => withStore(undefined, h(state.FocusSelectionList, { surfaceId: "chats", title: "Chats", count: 2, refresh: { onClick: noop, label: "Refresh chats" }, add: { onClick: noop, label: "New chat" } }, h("p", null, "rows"))) },
  { name: "RailWorkspace", render: () => h(state.RailWorkspace, { ariaLabel: "Plans workspace" }, h("p", null, "detail")) },
  // Identity
  { name: "UserMenu", focus: "a", render: () => h(identity.UserMenu, { identity: { status: "identified", user: "subject-1", email: "person@example.test" }, location: { hostname: "inbox.example.ts.net", origin: "https://inbox.example.ts.net" } }) }
];

/** Wrap an entry for rendering: the default icon layer, so icons render. */
export function renderEntry(entry) {
  return h(DefaultIconProvider, null, entry.render());
}
