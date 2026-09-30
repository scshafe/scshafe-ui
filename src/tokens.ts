// The @scshafe/ui token registry: every theme custom property the package's
// stylesheets read, with its default. `tokens.css` declares exactly these
// defaults at :root, and `layout.css` / `components.css` each declare the
// subset they use (so either stylesheet still works on its own).
// test/tokens.test.mjs keeps the three stylesheets and this list in step.
//
// Theme by re-declaring any of these at :root (or on a subtree) after the
// package stylesheets. Values here are the package's dark defaults.

export type SuiTokenCategory =
  | "color"
  | "surface"
  | "border"
  | "shadow"
  | "radius"
  | "font"
  | "space"
  | "clamp";

export interface SuiToken {
  /** The custom property, e.g. `--sui-text`. */
  readonly name: `--sui-${string}`;
  /** The default value declared at :root (may reference another token). */
  readonly default: string;
  readonly category: SuiTokenCategory;
  /** The package stylesheet that declares the default beside tokens.css. */
  readonly stylesheet: "layout.css" | "components.css";
  readonly description: string;
}

const token = (
  name: `--sui-${string}`,
  defaultValue: string,
  category: SuiTokenCategory,
  stylesheet: SuiToken["stylesheet"],
  description: string
): SuiToken => Object.freeze({ name, default: defaultValue, category, stylesheet, description });

export const SUI_TOKENS: readonly SuiToken[] = Object.freeze([
  // Text colours
  token("--sui-text", "#eff6ff", "color", "components.css", "Body text colour."),
  token("--sui-text-strong", "#f8fbff", "color", "components.css", "Emphasised text (titles, strong)."),
  token("--sui-muted", "#9fb0c8", "color", "components.css", "Secondary text, labels and hints."),
  // Accent family
  token("--sui-blue", "#6cb6ff", "color", "components.css", "Base blue; the default accent."),
  token("--sui-accent", "var(--sui-blue)", "color", "components.css", "Accent for links, focus and primary actions."),
  token("--sui-accent-hover", "#8cc8ff", "color", "components.css", "Accent on hover."),
  token("--sui-accent-subtle", "rgba(108, 182, 255, 0.11)", "color", "components.css", "Accent-tinted background."),
  // Success family
  token("--sui-green", "#52d273", "color", "components.css", "Base green; the default success colour."),
  token("--sui-ok", "var(--sui-green)", "color", "components.css", "Success / healthy state."),
  token("--sui-ok-subtle", "rgba(82, 210, 115, 0.08)", "color", "components.css", "Success-tinted background."),
  // Surfaces
  token("--sui-bg", "#08111f", "surface", "components.css", "Page background."),
  token("--sui-panel", "#111d2f", "surface", "components.css", "Panel background."),
  token("--sui-card", "rgba(17, 29, 47, 0.82)", "surface", "components.css", "Card and message-bubble background."),
  token("--sui-bg-elevated", "rgba(18, 31, 50, 0.72)", "surface", "components.css", "Raised surface (rails, menus)."),
  token("--sui-bg-hover", "rgba(108, 182, 255, 0.06)", "surface", "components.css", "Row / item hover background."),
  token("--sui-surface-2", "var(--sui-bg-elevated)", "surface", "components.css", "Secondary surface; defaults to the elevated surface."),
  token("--sui-popover", "rgba(8, 17, 31, 0.96)", "surface", "components.css", "Popover, tooltip and hover-card background."),
  // Hairlines
  token("--sui-line", "rgba(183, 203, 231, 0.18)", "border", "components.css", "Default hairline and divider."),
  token("--sui-border", "var(--sui-line)", "border", "components.css", "Component border; defaults to the hairline."),
  token("--sui-border-strong", "rgba(183, 203, 231, 0.28)", "border", "components.css", "Stronger border for floating layers."),
  token("--sui-border-hover", "rgba(108, 182, 255, 0.36)", "border", "components.css", "Border on hover / focus-within."),
  // Floating layers
  token("--sui-shadow", "0 10px 34px rgba(0,0,0,0.22)", "shadow", "components.css", "Panel shadow."),
  token("--sui-shadow-lg", "0 16px 40px rgba(0,0,0,0.34)", "shadow", "components.css", "Popover and dialog shadow."),
  // Corners
  token("--sui-radius-sm", "6px", "radius", "components.css", "Small corner radius (chips, inputs)."),
  token("--sui-radius-md", "8px", "radius", "components.css", "Medium corner radius."),
  token("--sui-radius", "var(--sui-radius-md)", "radius", "components.css", "Default corner radius."),
  token("--sui-radius-lg", "10px", "radius", "components.css", "Large corner radius (cards, bubbles)."),
  // Type
  token("--sui-mono", "ui-monospace, SFMono-Regular, Menlo, monospace", "font", "components.css", "Monospace face for ids, code and keys."),
  token("--sui-chat-text-size", "13px", "font", "components.css", "MessageBubble body text size."),
  // Card body clamps (Card maxHeight)
  token("--sui-clamp-2xs", "80px", "clamp", "components.css", "Card body clamp, 2xs."),
  token("--sui-clamp-xs", "120px", "clamp", "components.css", "Card body clamp, xs."),
  token("--sui-clamp-sm", "160px", "clamp", "components.css", "Card body clamp, sm."),
  token("--sui-clamp-md", "200px", "clamp", "components.css", "Card body clamp, md."),
  token("--sui-clamp-lg", "280px", "clamp", "components.css", "Card body clamp, lg."),
  token("--sui-clamp-xl", "360px", "clamp", "components.css", "Card body clamp, xl."),
  // Layout spacing (Stack / Inline / Grid gap and padding props)
  token("--sui-space-none", "0px", "space", "layout.css", "Spacing step none."),
  token("--sui-space-xs", "4px", "space", "layout.css", "Spacing step xs."),
  token("--sui-space-sm", "8px", "space", "layout.css", "Spacing step sm."),
  token("--sui-space-md", "12px", "space", "layout.css", "Spacing step md."),
  token("--sui-space-lg", "16px", "space", "layout.css", "Spacing step lg."),
  token("--sui-space-xl", "24px", "space", "layout.css", "Spacing step xl."),
  token("--sui-space-2xl", "32px", "space", "layout.css", "Spacing step 2xl.")
]);

export type SuiTokenName = (typeof SUI_TOKENS)[number]["name"];

/** Every registered token name, in registry order. */
export const SUI_TOKEN_NAMES: readonly string[] = Object.freeze(SUI_TOKENS.map((entry) => entry.name));

/**
 * Component-scoped custom properties. PinnedDataTable sets these inline per
 * column (plus `--sui-data-table-<table>-<column>-width` for live drag widths);
 * they are not theme tokens and have no :root default.
 */
export const SUI_COMPONENT_VARIABLES: readonly string[] = Object.freeze([
  "--sui-data-table-min-width",
  "--sui-data-table-width",
  "--sui-data-table-max-width",
  "--sui-data-table-line-clamp",
  "--sui-data-table-live-width"
]);
