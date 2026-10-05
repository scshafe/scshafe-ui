// The @scshafe/ui token registry: every theme custom property the package's
// stylesheets read, with its value in the light and the dark theme.
// `tokens.css` declares exactly these values, and `layout.css` /
// `components.css` each declare the subset they use (so either stylesheet
// still works on its own). test/tokens.test.mjs keeps the three stylesheets
// and this list in step; test/contrast.test.mjs checks the colour pairs.
//
// Themes. Tokens with `themed: true` take their `light` or `dark` value:
//   - by default from the user's `prefers-color-scheme`;
//   - explicitly with `data-sui-theme="light"` or `data-sui-theme="dark"` on
//     the root element (or on any subtree).
// The rest (spacing, radii, type, clamps, motion) are the same in both themes.
//
// Theme by re-declaring tokens after the package stylesheets: at `:root` for
// both themes, or per theme with the same selectors the package uses (see
// README "Theming and tokens").

export type SuiTokenCategory =
  | "color"
  | "surface"
  | "border"
  | "shadow"
  | "radius"
  | "font"
  | "space"
  | "clamp"
  | "motion"
  | "material";

/**
 * What a colour token is for, which decides the contrast it must reach
 * (test/contrast.test.mjs, docs/ACCESSIBILITY.md):
 * - `text`: text colour; 4.5:1 against every surface and overlay.
 * - `surface`: an opaque or translucent background text sits on.
 * - `overlay`: a translucent tint laid over a surface (hover, selection, code).
 * - `indicator`: a boundary or focus ring that identifies a control; 3:1
 *   against every surface.
 * - `decorative`: hairlines, tone bases, shadows and scrims; no contrast
 *   requirement (they never carry information alone).
 */
export type SuiTokenRole = "text" | "surface" | "overlay" | "indicator" | "decorative";

export type SuiThemeName = "light" | "dark";

/** The attribute that pins a theme: `data-sui-theme="light" | "dark"`. */
export const SUI_THEME_ATTRIBUTE = "data-sui-theme";

/**
 * The attribute that asks for solid surfaces instead of glass:
 * `data-sui-transparency="reduce"` on the root element (or any subtree). It does
 * what `prefers-reduced-transparency: reduce` and `prefers-contrast: more` do,
 * for hosts that offer the choice themselves.
 */
export const SUI_TRANSPARENCY_ATTRIBUTE = "data-sui-transparency";

/** The themes the package ships, in declaration order. */
export const SUI_THEMES: readonly SuiThemeName[] = Object.freeze(["light", "dark"] as SuiThemeName[]);

export interface SuiToken {
  /** The custom property, e.g. `--sui-text`. */
  readonly name: `--sui-${string}`;
  /** Value in the light theme (may reference another token). */
  readonly light: string;
  /** Value in the dark theme (may reference another token). */
  readonly dark: string;
  /** True when the token is declared per theme; false when both values are equal and declared once at :root. */
  readonly themed: boolean;
  readonly category: SuiTokenCategory;
  /** Contrast role for colour tokens (see SuiTokenRole). */
  readonly role?: SuiTokenRole;
  /** The package stylesheet that declares the token beside tokens.css. */
  readonly stylesheet: "layout.css" | "components.css";
  readonly description: string;
}

type Stylesheet = SuiToken["stylesheet"];

const fixed = (
  name: `--sui-${string}`,
  value: string,
  category: SuiTokenCategory,
  stylesheet: Stylesheet,
  description: string
): SuiToken => Object.freeze({ name, light: value, dark: value, themed: false, category, stylesheet, description });

const themed = (
  name: `--sui-${string}`,
  values: { light: string; dark: string },
  category: SuiTokenCategory,
  role: SuiTokenRole,
  description: string
): SuiToken => Object.freeze({ name, light: values.light, dark: values.dark, themed: true, category, role, stylesheet: "components.css" as const, description });

const TONES = [
  ["yellow", { light: "#9a6700", dark: "#f5c542" }, { light: "#7d4e00", dark: "#ffe8a3" }],
  ["orange", { light: "#bc4c00", dark: "#ff9f43" }, { light: "#953800", dark: "#ffd2a4" }],
  ["red", { light: "#cf222e", dark: "#ff6b6b" }, { light: "#a40e26", dark: "#ffc4c4" }],
  ["purple", { light: "#8250df", dark: "#b18cff" }, { light: "#6639ba", dark: "#dfd2ff" }]
] as const;

export const SUI_TOKENS: readonly SuiToken[] = Object.freeze([
  // Text colours
  themed("--sui-text", { light: "#1b2533", dark: "#eff6ff" }, "color", "text", "Body text colour."),
  themed("--sui-text-strong", { light: "#0b1220", dark: "#f8fbff" }, "color", "text", "Emphasised text (titles, strong)."),
  themed("--sui-muted", { light: "#465366", dark: "#9fb0c8" }, "color", "text", "Secondary text, labels and hints."),
  // Accent family
  themed("--sui-blue", { light: "#0a4f99", dark: "#6cb6ff" }, "color", "text", "Base blue; the default accent."),
  themed("--sui-accent", { light: "var(--sui-blue)", dark: "var(--sui-blue)" }, "color", "text", "Accent for links, focus and primary actions."),
  themed("--sui-accent-hover", { light: "#083f78", dark: "#8cc8ff" }, "color", "text", "Accent on hover."),
  themed("--sui-accent-subtle", { light: "rgba(10, 79, 153, 0.1)", dark: "rgba(108, 182, 255, 0.11)" }, "color", "overlay", "Accent-tinted background (selection, user messages)."),
  // Success family
  themed("--sui-green", { light: "#11602a", dark: "#52d273" }, "color", "text", "Base green; the default success colour."),
  themed("--sui-ok", { light: "var(--sui-green)", dark: "var(--sui-green)" }, "color", "text", "Success / healthy state."),
  themed("--sui-ok-subtle", { light: "rgba(17, 96, 42, 0.1)", dark: "rgba(82, 210, 115, 0.08)" }, "color", "overlay", "Success-tinted background."),
  // Status tones: the base tints backgrounds and borders; -text is the text on them
  themed("--sui-tone-green", { light: "var(--sui-green)", dark: "var(--sui-green)" }, "color", "decorative", "Green tone base (tints and borders)."),
  themed("--sui-tone-green-text", { light: "#0f5a26", dark: "#bff8c9" }, "color", "text", "Text on a green tint."),
  themed("--sui-tone-blue", { light: "var(--sui-blue)", dark: "var(--sui-blue)" }, "color", "decorative", "Blue tone base (tints and borders)."),
  themed("--sui-tone-blue-text", { light: "#0550ae", dark: "#cae5ff" }, "color", "text", "Text on a blue tint."),
  ...TONES.flatMap(([tone, base, text]) => [
    themed(`--sui-tone-${tone}`, base, "color", "decorative", `${tone[0].toUpperCase()}${tone.slice(1)} tone base (tints and borders).`),
    themed(`--sui-tone-${tone}-text`, text, "color", "text", `Text on a ${tone} tint.`)
  ]),
  // Surfaces
  themed("--sui-bg", { light: "#f6f8fb", dark: "#08111f" }, "surface", "surface", "Page background."),
  themed("--sui-panel", { light: "#ffffff", dark: "#111d2f" }, "surface", "surface", "Panel background."),
  themed("--sui-card", { light: "#ffffff", dark: "rgba(17, 29, 47, 0.82)" }, "surface", "surface", "Card and message-bubble background."),
  themed("--sui-bg-elevated", { light: "#eef2f7", dark: "rgba(18, 31, 50, 0.72)" }, "surface", "surface", "Raised surface (rails, menus)."),
  themed("--sui-surface-2", { light: "var(--sui-bg-elevated)", dark: "var(--sui-bg-elevated)" }, "surface", "surface", "Secondary surface; defaults to the elevated surface."),
  themed("--sui-popover", { light: "rgba(255, 255, 255, 0.98)", dark: "rgba(8, 17, 31, 0.96)" }, "surface", "surface", "Opaque floating surface: what glass becomes under reduced transparency or increased contrast; pinned table cells."),
  themed("--sui-field", { light: "#ffffff", dark: "rgba(8, 17, 31, 0.5)" }, "surface", "surface", "Form control and button background."),
  themed("--sui-bg-hover", { light: "rgba(10, 79, 153, 0.06)", dark: "rgba(108, 182, 255, 0.06)" }, "surface", "overlay", "Row / item hover background."),
  themed("--sui-tint", { light: "rgba(15, 23, 42, 0.035)", dark: "rgba(255, 255, 255, 0.04)" }, "surface", "overlay", "Neutral tint that sets a block off its surface (rows, readers, pills)."),
  themed("--sui-code-bg", { light: "rgba(15, 23, 42, 0.05)", dark: "rgba(4, 10, 20, 0.58)" }, "surface", "overlay", "Code and preformatted-text background."),
  themed("--sui-backdrop", { light: "rgba(15, 23, 42, 0.35)", dark: "rgba(0, 0, 0, 0.5)" }, "surface", "decorative", "Scrim behind modal dialogs and popovers."),
  // Hairlines and control boundaries
  themed("--sui-line", { light: "rgba(31, 45, 66, 0.16)", dark: "rgba(183, 203, 231, 0.18)" }, "border", "decorative", "Default hairline and divider."),
  themed("--sui-border", { light: "var(--sui-line)", dark: "var(--sui-line)" }, "border", "decorative", "Component border; defaults to the hairline."),
  themed("--sui-border-strong", { light: "rgba(31, 45, 66, 0.28)", dark: "rgba(183, 203, 231, 0.28)" }, "border", "decorative", "Stronger border for floating layers."),
  themed("--sui-border-hover", { light: "rgba(10, 79, 153, 0.45)", dark: "rgba(108, 182, 255, 0.36)" }, "border", "decorative", "Border on hover / focus-within."),
  themed("--sui-field-border", { light: "#6b778a", dark: "#6b7c93" }, "border", "indicator", "Boundary of a form control (3:1 against its surroundings)."),
  themed("--sui-focus-ring", { light: "var(--sui-accent)", dark: "var(--sui-accent)" }, "border", "indicator", "Keyboard focus indicator (:focus-visible outline)."),
  // Floating layers
  themed("--sui-shadow", { light: "0 10px 34px rgba(15, 23, 42, 0.1)", dark: "0 10px 34px rgba(0, 0, 0, 0.22)" }, "shadow", "decorative", "Panel shadow."),
  themed("--sui-shadow-lg", { light: "0 16px 40px rgba(15, 23, 42, 0.16)", dark: "0 16px 40px rgba(0, 0, 0, 0.34)" }, "shadow", "decorative", "Popover, dialog and toast shadow."),
  themed("--sui-shadow-color", { light: "rgba(15, 23, 42, 0.12)", dark: "rgba(0, 0, 0, 0.22)" }, "shadow", "decorative", "Colour of small, directional shadows (pinned columns, raised buttons)."),
  // Liquid Glass: the material of the functional layer (controls and navigation
  // floating over content). Solid (--sui-popover) under reduced transparency.
  themed("--sui-glass", { light: "rgba(255, 255, 255, 0.72)", dark: "rgba(24, 36, 56, 0.72)" }, "surface", "surface", "Glass fill of controls and floating layers (buttons, tab strips, popovers, toasts)."),
  themed("--sui-glass-thick", { light: "rgba(255, 255, 255, 0.88)", dark: "rgba(17, 29, 47, 0.88)" }, "surface", "surface", "Thicker glass for larger, longer-lived surfaces (sheets, rails, detail popovers)."),
  themed("--sui-glass-sheen", { light: "rgba(255, 255, 255, 0.55)", dark: "rgba(255, 255, 255, 0.07)" }, "surface", "overlay", "Light caught across the top of a glass surface (the start of its sheen gradient)."),
  themed("--sui-glass-edge", { light: "rgba(31, 45, 66, 0.14)", dark: "rgba(183, 203, 231, 0.16)" }, "border", "decorative", "Glass rim: the edge that separates glass from what is behind it."),
  themed("--sui-glass-highlight", { light: "rgba(255, 255, 255, 0.9)", dark: "rgba(255, 255, 255, 0.14)" }, "border", "decorative", "Bright inner highlight along the top edge of glass."),
  themed("--sui-glass-shadow", { light: "0 8px 24px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(15, 23, 42, 0.08)", dark: "0 10px 30px rgba(0, 0, 0, 0.36), 0 1px 3px rgba(0, 0, 0, 0.3)" }, "shadow", "decorative", "Elevation of floating glass."),
  fixed("--sui-glass-blur", "24px", "material", "components.css", "Backdrop blur of glass; 0px under reduced transparency."),
  fixed("--sui-glass-saturate", "180%", "material", "components.css", "Backdrop saturation of glass, so colour from behind carries through; 100% under reduced transparency."),
  // Corners
  fixed("--sui-radius-sm", "8px", "radius", "components.css", "Small corner radius (inputs, code)."),
  fixed("--sui-radius-md", "12px", "radius", "components.css", "Medium corner radius (cards)."),
  fixed("--sui-radius", "var(--sui-radius-md)", "radius", "components.css", "Default corner radius."),
  fixed("--sui-radius-lg", "16px", "radius", "components.css", "Large corner radius (popovers, toasts, rails, bubbles)."),
  fixed("--sui-radius-xl", "20px", "radius", "components.css", "Extra-large corner radius (dialogs, tab strips)."),
  fixed("--sui-radius-pill", "999px", "radius", "components.css", "Capsule: buttons, tabs, badges and chips."),
  // Type
  fixed("--sui-mono", "ui-monospace, SFMono-Regular, Menlo, monospace", "font", "components.css", "Monospace face for ids, code and keys."),
  fixed("--sui-chat-text-size", "13px", "font", "components.css", "MessageBubble body text size."),
  // Motion
  fixed("--sui-duration", "120ms", "motion", "components.css", "Duration of every transition; 0s under prefers-reduced-motion: reduce."),
  fixed("--sui-ease", "cubic-bezier(0.2, 0.8, 0.2, 1)", "motion", "components.css", "Easing of colour, opacity and border transitions."),
  fixed("--sui-ease-spring", "cubic-bezier(0.34, 1.36, 0.64, 1)", "motion", "components.css", "Easing with a slight overshoot, for scale and position (presses, layers appearing)."),
  // Card body clamps (Card maxHeight)
  fixed("--sui-clamp-2xs", "80px", "clamp", "components.css", "Card body clamp, 2xs."),
  fixed("--sui-clamp-xs", "120px", "clamp", "components.css", "Card body clamp, xs."),
  fixed("--sui-clamp-sm", "160px", "clamp", "components.css", "Card body clamp, sm."),
  fixed("--sui-clamp-md", "200px", "clamp", "components.css", "Card body clamp, md."),
  fixed("--sui-clamp-lg", "280px", "clamp", "components.css", "Card body clamp, lg."),
  fixed("--sui-clamp-xl", "360px", "clamp", "components.css", "Card body clamp, xl."),
  // Layout spacing (Stack / Inline / Grid gap and padding props)
  fixed("--sui-space-none", "0px", "space", "layout.css", "Spacing step none."),
  fixed("--sui-space-xs", "4px", "space", "layout.css", "Spacing step xs."),
  fixed("--sui-space-sm", "8px", "space", "layout.css", "Spacing step sm."),
  fixed("--sui-space-md", "12px", "space", "layout.css", "Spacing step md."),
  fixed("--sui-space-lg", "16px", "space", "layout.css", "Spacing step lg."),
  fixed("--sui-space-xl", "24px", "space", "layout.css", "Spacing step xl."),
  fixed("--sui-space-2xl", "32px", "space", "layout.css", "Spacing step 2xl.")
]);

export type SuiTokenName = (typeof SUI_TOKENS)[number]["name"];

/** Every registered token name, in registry order. */
export const SUI_TOKEN_NAMES: readonly string[] = Object.freeze(SUI_TOKENS.map((entry) => entry.name));

/** A token's declared value in a theme (unresolved: it may be a `var()` reference). */
export function suiTokenValue(name: string, theme: SuiThemeName): string | undefined {
  const entry = SUI_TOKENS.find((candidate) => candidate.name === name);
  return entry ? entry[theme] : undefined;
}

/** The value `--sui-duration` takes under `prefers-reduced-motion: reduce`. */
export const SUI_REDUCED_MOTION_DURATION = "0s";

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
