# Accessibility

`@scshafe/ui` targets [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA for
the components it renders. This page says what the package does, what its
tests check automatically, and what still needs a person with a real browser
and assistive technology. Automated checks are not complete evidence of
accessibility; the manual list below is part of every release that changes
rendering.

## Themes

The package ships a light and a dark theme. Every colour, surface, border and
shadow token has a value in each (`SUI_TOKENS[].light` / `.dark`, and
`tokens.css`).

- By default the theme follows the user's `prefers-color-scheme`.
- `data-sui-theme="light"` or `data-sui-theme="dark"` on the root element pins a
  theme; on any other element it pins that subtree.
- `SuiProviders` takes `theme="light" | "dark" | "system"`; `applySuiTheme` and
  `useSuiTheme` (package root) do the same without the state layer.
  Server-rendered pages put the attribute in their HTML.
- Each theme sets `color-scheme`, so native controls and scrollbars match.

## What the package does

| Area | Behaviour | WCAG 2.2 |
| --- | --- | --- |
| Keyboard | Every control is a native `button`, `a`, `input`, `select` or `textarea`, or has `tabindex="0"` and key handlers (Copyable: Enter and Space; column and rail resize handles: Left/Right, Shift for larger steps, Home/End, and Enter to reset the rail). No positive `tabindex`. | 2.1.1, 2.4.3 |
| Focus visible | One rule gives every focusable element inside a component a 2px `--sui-focus-ring` outline on `:focus-visible` (drawn inward inside scrolling or clipping containers). No rule removes the outline. | 2.4.7, 1.4.11 |
| Contrast | Text tokens reach 4.5:1, and control boundaries (`--sui-field-border`) and the focus ring 3:1, against every surface and tint the stylesheets use, in both themes. Body text (`--sui-text`, `--sui-text-strong`) on glass reaches 4.5:1 over any backdrop, without counting on the blur. | 1.4.3, 1.4.11 |
| Reduced motion | Every transition runs for `--sui-duration` (120ms), which `prefers-reduced-motion: reduce` sets to `0s`. Popovers, toasts and sheets appear through `@starting-style` transitions on the same duration, so they appear at once under reduced motion; no layer waits on its entrance before it takes input. There are no keyframe animations or script-driven motion. | 2.3.3 |
| Reduced transparency | Glass (the translucent controls and floating layers) becomes the opaque `--sui-popover` surface with no blur under `prefers-reduced-transparency: reduce` and `prefers-contrast: more`, and under `data-sui-transparency="reduce"` on the root or a subtree, for browsers that do not report the preference. Increased contrast also darkens the glass rim. Every glass surface has a real border, so it keeps its edge in forced colours. | 1.4.3, 1.4.11 |
| Names | Icon-only buttons take `aria-label` (IconButton `label`, HoverButton `label`); icons are `aria-hidden`; tables, dialogs, menus, separators and labelled groups carry names. | 4.1.2, 1.1.1 |
| States | Tabs expose `aria-selected` / `aria-pressed`; toggles `aria-pressed`; resize handles `aria-valuenow`/`-min`/`-max`/`-text`. | 4.1.2 |
| Errors | `Editor` and `EditableName` render their error with `role="alert"`; `InputField` marks `required`; toasts are `role="status"`, errors `role="alert"`. | 3.3.1, 4.1.3 |
| Target size | Package controls are at least 24px, except HoverButton `size="sm"` (16px) and `"md"` (20px), which rely on the spacing exception. | 2.5.8 |

## Automated checks (`pnpm test`)

| Check | File | What it proves |
| --- | --- | --- |
| Token contrast | `test/contrast.test.mjs` | For both themes, computes WCAG contrast from the registry: every `text` token against every `surface` token (translucent ones composited over the page and panel backgrounds) and every overlay laid on them (hover, selection, code, neutral tint, accent tint up to 20%, tone tints up to 12%): at least 4.5:1. Every tone's text colour against its own tint: 4.5:1. `indicator` tokens (field border, focus ring) against every surface and neutral tint: 3:1. A second test keeps `components.css` within those tint maxima. |
| axe-core | `test/axe.test.mjs` | Renders every component in the catalog (`test/support/catalog.mjs`, one entry per public component) with React into jsdom, with the stylesheets loaded, in the light and then the dark theme, and runs axe-core 4.13 with the WCAG 2.0/2.1/2.2 A and AA rules and axe's best practices. It must report no violations. A positive control proves the run reports an unnamed button. |
| Keyboard focus | `test/keyboard-focus.test.mjs` | For each interactive component: its control is in the sequential focus order (positive `tabindex` first, then document order, skipping disabled, hidden and `tabindex="-1"` elements); pressing Tab to each element in that order focuses it, it matches `:focus-visible`, and its computed outline is a visible solid ring and it is not transparent. Components without controls must render nothing tabbable. No stylesheet rule removes or sets an outline outside `:focus-visible`. |
| Themes | `test/theme.test.mjs`, `test/tokens.test.mjs` | Every themed token cascades its light value by default and its dark value when pinned (root and subtree); the three stylesheets declare the registry values in the light, preferred-dark and pinned-dark blocks; component rules use tokens, not colour literals. |
| Reduced motion | `test/motion.test.mjs` | Every transition uses `var(--sui-duration)`; the reduced-motion block sets it to `0s`; no keyframes or script-driven motion. |
| Glass | `test/glass.test.mjs`, `test/contrast.test.mjs` | Glass is translucent and its fallback opaque in both themes; reduced transparency, increased contrast and `data-sui-transparency="reduce"` make it solid (the attribute in the jsdom cascade too, inside a subtree pinned to the other theme); only leaf layers blur their backdrop; entrances are starting styles on transitioned properties. Body text over glass composited on black and on white reaches 4.5:1, on the same side of the text's luminance, so it does over every backdrop between them. |
| Namespace | `test/namespace.test.mjs` | Every class and data attribute is in the `sui` namespace (not an accessibility check, but it keeps the render contract the checks above run against). |

Not automated, and why:

- **axe `color-contrast`** is off: jsdom does not paint, so axe cannot see
  the rendered colours. The token contrast test replaces it.
- **axe `region`, `landmark-one-main`, `page-has-heading-one`** are off: a
  component rendered on its own is not a page. Landmarks, the page title and
  the heading outline are the host's.
- **Inside an open `<dialog>`**, axe in jsdom reports every rule as "needs
  review" (there is no top layer). The catalog also checks the Sheet's
  header, body and footer outside a dialog (`SheetParts`).

## Manual checks before a release that changes rendering

Run these in a current Chromium and Firefox, in both themes, with the
operating system's reduced-motion setting on and off.

1. **Screen reader pass** (NVDA or VoiceOver) over the catalog components:
   names and roles are announced as intended; toasts are announced once
   (status politely, errors assertively); a ConfirmDialog announces its title
   and message. Note where focus lands after a Sheet closes: the Sheet unmounts
   its dialog, so the host may need to move focus back to the trigger.
2. **Focus not obscured (2.4.11)**: tabbing through a PinnedDataTable with a
   sticky header and pinned column, and past a ToastTray in the corner, never
   hides the focused element completely.
3. **Dragging alternatives (2.5.7)**: column widths can also be set in
   DataTableColumnMenu's width field; the rail width has keyboard steps and a
   reset, but no single-pointer alternative to dragging — a known gap.
4. **Target size (2.5.8)**: HoverButton `sm` and `md` meet the spacing
   exception where they are used (no other target within 24px).
5. **Reflow and zoom (1.4.10, 1.4.4)**: at 320 CSS px wide and at 200% zoom
   the RailWorkspace stacks and nothing needs two-dimensional scrolling
   except tables.
6. **Forced colours / high contrast mode**: focus rings and control
   boundaries stay visible (outlines and borders are used, never
   background-only indication).
7. **Glass over real content**: open popovers, tooltips and toasts, and
   place the tab strip, over a photograph, a saturated illustration and
   scrolling dense text, in both themes. Labels stay readable; secondary
   (`--sui-muted`) and accent text are only token-checked over the package's
   surfaces, so check them here. The selected tab stays identifiable at a
   glance.
8. **Reduced transparency and increased contrast**: with the operating
   system's setting (where the browser reports it) and with
   `data-sui-transparency="reduce"` on the root, glass is solid and nothing
   blurs; with increased contrast the rims are darker.

## What the host is responsible for

- The page: `lang`, `title`, landmarks (`main`, `nav`), one `h1` and a
  sensible heading order, and `body { background: var(--sui-bg); color: var(--sui-text); }`.
- Labels for controls it renders itself, and error messages tied to fields.
- Keeping contrast when it re-declares tokens: run the same computation
  (`test/contrast.test.mjs` shows how) against its values.
- Not removing the focus ring without a replacement of at least the same
  visibility.
- In a server-rendered page, rendering `data-sui-theme` in the HTML when it
  pins a theme, so there is no flash of the other theme.
