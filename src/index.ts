// @scshafe/ui — the SCSHAFE standard frontend component library.
//
// First layer (P0-B5): the LAYOUT PRIMITIVES. Framework-light React components over CSS
// tokens (`--sui-space-*`), import-closed (react + this package only, zero domain coupling).
// Later layers add primitives/widgets with the same rule. Ship the styles with
// `import "@scshafe/ui/layout.css"`; the token registry is `@scshafe/ui/tokens`.

export * from "./layout/layoutShared.js";
export * from "./layout/StackComponent.js";
export * from "./layout/InlineComponent.js";
export * from "./layout/GridComponent.js";
export * from "./layout/PaneComponent.js";
export * from "./layout/ScrollComponent.js";

// Second layer (C2): Bucket A — the import-closed generic components (react + npm only, zero
// domain coupling). Kbd/Sheet/PinnedDataTable are react-only; MarkdownEditor adds @tiptap +
// tiptap-markdown (package deps). Ship the styles with `import "@scshafe/ui/components.css"`.
export * from "./primitive/KbdComponent.js";
export * from "./primitive/MarkdownEditorComponent.js";
export * from "./widget/SheetComponent.js";
export * from "./table/PinnedDataTableComponent.js";

// Third layer (C3): the Tooltip render family + Bucket B. C0/C1 decoupled Tooltip/HoverCard/
// Popover (via the injected PopoverController context) and the icon seam (IconContext); those
// context/render modules live here so the package is SELF-CONTAINED (a package cannot reverse-
// import the app). A host provides live state through RtkPopoverProvider / an IconContext
// provider, importing the contexts FROM this package (app -> package). Bucket B (the
// Tooltip-decoupled leaves + composites) resolves Tooltip from WITHIN the package.
//
// Tooltip family — context/seams + render components + the tooltip-text helper + clamp math.
export * from "./widget/PopoverControllerContext.js";
export * from "./widget/LocalPopoverProvider.js";
export * from "./widget/IconContext.js";
export * from "./widget/PopoverComponent.js";
export * from "./widget/HoverCardComponent.js";
export * from "./widget/TooltipComponent.js";
export * from "./tooltip.js";
// popoverPosition also defines a `PopoverAnchor` type (identical to PopoverControllerContext's);
// re-export its values + unique types explicitly to avoid an ambiguous star-export collision.
export {
  MOBILE_CLAMP_MAX_WIDTH,
  clampPopoverStyle,
  popoverStyleForViewport,
  rawPopoverStyle
} from "./widget/popoverPosition.js";
export type { PopoverSide, PopoverViewport } from "./widget/popoverPosition.js";
// Bucket B — leaf primitives (Badge/Description/InputField-SelectField-TextAreaField/Identifier/
// Label/Title/Copyable/MarkdownContent) + composites (EmptyState/List/Panel-PanelHeader/Reader),
// each import-closed = react + the moved Tooltip family only.
export * from "./primitive/BadgeComponent.js";
export * from "./primitive/DescriptionComponent.js";
export * from "./primitive/FormFieldComponent.js";
export * from "./primitive/IdentifierComponent.js";
export * from "./primitive/LabelComponent.js";
export * from "./primitive/TitleComponent.js";
export * from "./CopyableComponent.js";
export * from "./MarkdownContentComponent.js";
export * from "./widget/EmptyStateComponent.js";
export * from "./container/ListComponent.js";
export * from "./container/PanelComponent.js";
export * from "./widget/ReaderComponent.js";

// Fourth layer (C4): Bucket C — the Icon + Tooltip-consuming primitives, the LAST in-tree move
// (ends the extraction arc). Each is import-closed to react + the now-package-internal Tooltip
// family (Tooltip / useIcon) + Title / Description + sibling movers (Button / HoverButton).
// Button/IconButton + Tab wrap Tooltip and resolve the icon renderer via useIcon (both internal
// now); Editor composes Button + Title + Description; EditableName composes HoverButton. The
// host feeds live icon/popover state through its IconContext provider / RtkPopoverProvider.
export * from "./primitive/ButtonComponent.js";
export * from "./primitive/HoverButtonComponent.js";
export * from "./widget/TabComponent.js";
export * from "./widget/EditorComponent.js";
export * from "./widget/EditableNameComponent.js";

// Fifth layer (P1): the consumers-standalone additions. InfiniteScrollSentinel /
// useInfiniteScroll bring host-owned-state pagination (the package observes, the host
// fetches); "./format.js" carries the generic formatting helpers (also importable as the `@scshafe/ui/format` subpath) so format-dependent
// components can extract without reverse-importing an app.
export * from "./widget/InfiniteScrollSentinelComponent.js";
export * from "./format.js";

// Sixth layer (D): Bucket D — the formerly format-blocked composites, unblocked by
// "./format.js". Status (Badge + the default toneByState vocabulary), Card/MetricCard,
// ChipList, ListRow, MessageBubble, RecordMeta. Import-closed to react + package
// siblings; their styles ship in components.css like every layer before them.
export * from "./primitive/StatusComponent.js";
export * from "./primitive/StatCountComponent.js";
export * from "./widget/CardComponent.js";
export * from "./widget/ChipListComponent.js";
export * from "./container/ListRowComponent.js";
export * from "./widget/MessageBubbleComponent.js";
export * from "./widget/RecordMetaComponent.js";

// Seventh layer (L1): the workspace frame contract. FocusTabs (the model-driven
// icon-first strip) and TabPanelHeader (the standardized panel
// header with the single iconized-refresh convention); the frame CLASSES
// (.sui-app-frame / .sui-app-shell[--contained] / .sui-workspace / .sui-focus-area /
// .sui-workspace-panel / .sui-fill) ship in layout.css.
export * from "./widget/FocusTabsComponent.js";
export * from "./widget/TabPanelHeaderComponent.js";
