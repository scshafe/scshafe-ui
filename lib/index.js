// mc-ui — Mission Control's generic frontend component package.
//
// First layer (P0-B5): the LAYOUT PRIMITIVES. Framework-light React components over CSS
// tokens (`--mc-space-*`), import-closed (react + this package only, zero domain coupling).
// Later layers (the extraction arc) add primitives/widgets once their couplings drop — see
// DESIGN-FRONTEND-COMPONENT-PACKAGE.md. Ship the styles with `import "mc-ui/layout.css"`.
export * from "./layout/layoutShared.js";
export * from "./layout/StackComponent.js";
export * from "./layout/InlineComponent.js";
export * from "./layout/GridComponent.js";
export * from "./layout/PaneComponent.js";
export * from "./layout/ScrollComponent.js";
// Second layer (C2): Bucket A — the import-closed generic components (react + npm only, zero
// domain coupling). Kbd/Sheet/PinnedDataTable are react-only; MarkdownEditor adds @tiptap +
// tiptap-markdown (package deps). Ship the styles with `import "mc-ui/components.css"`.
export * from "./primitive/KbdComponent.js";
export * from "./primitive/MarkdownEditorComponent.js";
export * from "./widget/SheetComponent.js";
export * from "./table/PinnedDataTableComponent.js";
// Third layer (C3): the Tooltip render family + Bucket B. C0/C1 decoupled Tooltip/HoverCard/
// Popover (via the injected PopoverController context) and the icon seam (IconContext); those
// context/render modules move here so the package is SELF-CONTAINED (a package cannot reverse-
// import the app). MC re-provides the live state through RtkPopoverProvider / McIconProvider,
// which now import the contexts back FROM this package (app -> package, fine). Bucket B (the
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
export { MOBILE_CLAMP_MAX_WIDTH, clampPopoverStyle, popoverStyleForViewport, rawPopoverStyle } from "./widget/popoverPosition.js";
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
// now); Editor composes Button + Title + Description; EditableName composes HoverButton. MC feeds
// the live icon/popover state through McIconProvider / RtkPopoverProvider exactly as before —
// byte-identical.
export * from "./primitive/ButtonComponent.js";
export * from "./primitive/HoverButtonComponent.js";
export * from "./widget/TabComponent.js";
export * from "./widget/EditorComponent.js";
export * from "./widget/EditableNameComponent.js";
