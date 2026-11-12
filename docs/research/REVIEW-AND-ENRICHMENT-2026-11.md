# Review and enrichment proposals, November 2026

**Status: proposed; do not merge.** Nothing here is decided. The owner picks from it; each
accepted item becomes its own change. Written 2026-11-12 by the project's agent on Claude
Fable 5.2, against `main` at `ef069ce` (`@scshafe/ui` 0.9.0).

## 1. Summary

The release engineering, the token and theme system and the static accessibility checks are
strong, and better than most libraries of this size. The weak side is everything a consumer
touches after install: the TypeScript declarations of a third of the components are wrong, the
menus and tooltips have no keyboard or dismissal behaviour, and nobody can see the components
without building an app. Adoption reflects that: the only public web app on the library is
five releases behind and restyles it.

Top findings:

1. **A strict TypeScript app cannot use `Editor`, `Reader`, `Tab`, `List`, `Label` and others
   with their documented props.** 21 source files are `.jsx` compiled with `checkJs: false`, so
   the shipped declarations say `title?: null` or `htmlFor?: null` ([3.3](#33-types-and-public-api)).
2. **Every `Status` badge shows developer metadata to end users on hover** ("Component: Status
   | Layer: primitive | Purpose: …"), and so does every `StatCount` and `ListRow` status
   ([3.4](#34-component-behaviour)).
3. **Menus and tooltips are mouse-only and never close by themselves.** No Escape, outside
   click, arrow keys or focus trigger exists in the package; the docs do not tell hosts to add
   them ([3.5](#35-accessibility)).
4. **The `html` template of `@scshafe/ui/ssr` can be made to skip its context checks** by an
   ordinary-looking static template, and it checks URL values one at a time rather than the
   composed attribute ([3.7](#37-server-rendered-adapter)).
5. **Adoption is thin and drifting.** One public web app uses the package, at 0.4.1; scshafe-qt's
   token snapshot is also at 0.4.1; one app dropped React because the package needs a token to
   install; request #14 (token snapshot asset) has waited since 2026-10-30 for an owner
   decision ([3.10](#310-consumers-and-parity)).

Top five ideas (ranked list in [section 4](#4-ideas)):

1. Convert the `.jsx` components to typed `.tsx` and typecheck the whole catalog in `verify`.
2. A component gallery built from the test catalog and published with each release.
3. Built-in popover behaviour: dismissal, menu keyboard model, tooltips on focus.
4. The token snapshot as a release asset (request #14), then a parity table with scshafe-qt
   and scshafe-ios.
5. A real-browser test lane that automates the manual accessibility checklist.

## 2. How this was done

- Read `AGENTS.md`, `README.md`, every file in `docs/`, `CHANGELOG.md`, `package.json`,
  `dev.toml`, the release configuration, all of `src/` (about 8,000 lines), the three
  stylesheets and the tests. Three delegated read-only passes covered the smaller components,
  the SSR adapter with the stylesheets and tests, and the public consumers; I re-checked every
  finding from them that appears below as verified, by reading the lines or running the case.
- Ran `pnpm install --frozen-lockfile`, `pnpm run verify` (219 tests pass, packed-install
  smokes pass, about 25 s) and `dev check .` (clean). CI and Publish are green for 0.9.0.
- Typechecked a small strict TypeScript consumer against the built declarations, rendered
  `Status` without a provider, and ran the SSR template cases. No repository file was changed
  apart from this document.
- Consumers: public GitHub data only. `mail-otp`, `scshafe-dev` and `infra` are not visible to
  this agent, so the app standard's own plan for this library, and the mail apps' use of the
  SSR adapter, are not assessed here.
- Limits: nothing was viewed in a browser. Visual claims (glass, layout, touch) are from the
  CSS, and are marked where they are not verified.

There is no plan, roadmap or decision log in this repository: the design records were removed
in 0.2.0 (`CHANGELOG.md`, "Removed"). "Against its own plans" is therefore measured against
`AGENTS.md`, the doctrine, `docs/ACCESSIBILITY.md` and the changelog's stated goals.

## 3. Review

### 3.1 Scorecard

| Area | Grade | One line |
| --- | --- | --- |
| Release engineering and supply chain | A | Tag-only publishing, pack-twice bytes, install-back, payload manifest, kit drift check. |
| Tokens and theming | A− | Registry, three stylesheets and contrast kept in step by tests; no type, size or layer tokens. |
| Accessibility, static (contrast, names, focus ring, motion) | A− | Axe in both themes, computed contrast including glass over any backdrop. |
| Accessibility, interactive (menus, tooltips, dialogs) | D | No keyboard model or dismissal for popovers; tooltips need a mouse. |
| Server-rendered adapter | B | Careful design and parity tests; two real holes in the template checks. |
| Types and public API | D+ | A third of components ship wrong or `any` declarations; the store erases state types. |
| Component behaviour | C+ | Several user-visible bugs, none caught because there are almost no interaction tests. |
| State layer | B− | Sound factories with stale-response guards; untyped, no cancellation, a few races. |
| Tests | B | 219 fast tests, strong on static properties; no browser, almost no interaction, weak API pinning. |
| Docs | B− | Excellent adoption guides; no component reference; three guides on three versions. |
| Adoption and parity | D | One public web consumer, five releases behind; no parity table; request #14 open. |
| Invariant "no application-specific names" | C | Origin-app vocabulary and plan codes remain in shipped source. |

### 3.2 Against the stated goals

Done and holding:

- The `sui` namespace, the marker contract for the core set, light and dark themes, reduced
  motion, the focus ring, the optional peers and the Redux-free root are all enforced by tests
  (`test/namespace.test.mjs`, `test/tokens.test.mjs`, `test/contrast.test.mjs`,
  `test/state-optionality.test.mjs`, `test/editor.test.mjs`).
- The SSR adapter (0.4.0), the adoption guide with `CheckboxField` and `Banner` (0.5.0), Liquid
  Glass (0.6.0) and AA text on glass in both themes (0.7.0, 0.8.0) shipped as described.
- The release kit matches scshafe-dev 0.16.0 (`dev check .`: clean).

Half-built:

- **Popover behaviour.** `src/state/Popovers.ts:11-12` says "Auto-close wiring (Escape / outside
  click / scroll) stays a host concern". `ContextMenuComponent.tsx:41-43` relies on a "global
  outside-click listener" the package does not ship. No doc tells a host to write one.
- **The identity seam.** `createIdentityResource(fetchImpl)` exists
  (`src/identity/identityResource.ts:39`) but is not exported (`src/identity/index.ts`), and
  `/oauth2/userinfo` is fixed at `identityResource.ts:54`. `AGENTS.md` says the package never
  knows an endpoint.
- **The table.** `createPagedListSlice` has `sortChanged`, but `PinnedDataTable` has no sortable
  header, `aria-sort`, selection, empty or loading state. Pinning is left-only.
- **`dev.toml` `[skills]`** records the missing `.agents/skills` as a gap (LIB-02).
- **Markdown.** `MarkdownContent` parses a small subset (no nested lists, tables, images,
  rules or strikethrough; `src/MarkdownContentComponent.jsx:101-188`), while `MarkdownEditor`
  writes full markdown through tiptap. What the editor saves, the reader may show as plain text.

Drifted from the docs or the invariants:

- **Application-specific names in shipped source**, against the `AGENTS.md` invariant:
  `brand.mission`, `nav.houston` (`src/icons/iconNames.ts:15,19`); a sixty-word workflow
  vocabulary with entries such as `awaiting_plan_review`, `dead_lettered`,
  `implementation_brief` (`src/format.ts:10-24`); examples naming "project create, plan edit,
  agent server create" (`src/widget/EditorComponent.jsx:10-11`).
- **Process references in shipped comments**: "S1 of DESIGN-STATE-LAYER.md"
  (`src/state/index.ts:1`) and "L4 of DESIGN-SITE-LAYOUT.md" (`src/icons/index.ts:1`), both
  removed in 0.2.0; plan codes (P0-B5, C0, M0, P1-B1) throughout `src/index.ts` and
  `src/widget/`; "see test/popovers.test.mjs" (`src/widget/popoverPosition.ts:5`), a test that
  does not exist; `styles.css` (`popoverPosition.ts:20`) and `icons/icon-names.js`
  (`src/widget/TabComponent.jsx:15`), files that do not exist.
- **README: "per-component `*Props` are exported".** `SheetProps` is not exported
  (`src/widget/SheetComponent.tsx:3`), and the `.jsx` components have no props types at all.
- **Three guides, three versions.** `docs/FIRST-APP.md:4` uses 0.4.1 "throughout",
  `docs/ADOPTING.md:5` uses 0.5.0, the README uses 0.9.0. A reader who follows FIRST-APP
  installs a version without glass, `Banner` or the Sheet fix.
- **"Private package."** `src/build.ts:33` tells the user the package is private; the guides
  say it is public (and still needs a token).
- **The 880px "byte-identical desktop" rule** (`src/widget/popoverPosition.ts:13-21`) is a
  constraint of the origin app. Its effect today: above 880px popovers are never kept inside
  the viewport.

### 3.3 Types and public API

**Wrong declarations (verified with `tsc --strict`).** `tsconfig.json` has `allowJs`,
`declaration` and `checkJs: false`, so each un-annotated `.jsx` component gets its prop types
inferred from its default values. A default of `null` becomes the type `null`:

| Component | Declared | Effect in a TypeScript app |
| --- | --- | --- |
| `Editor` | `title?: null`, `onSubmit?: null`, `error?: null`, `secondaryAction?: null` | cannot pass a title, a submit handler or an error |
| `Reader` | `title?: null`, `description?: null`, `actions?: null` | cannot pass a title |
| `Tab` | `icon?: null`, `badge?: null`, `onSelect?: null` | cannot handle selection |
| `List` | `title?: null`, `count?: null`, `empty?: null`, `actions?: null` | cannot pass a title or an empty state |
| `Label` | `htmlFor?: null` | cannot tie a label to its field |
| `Title`, `Description`, `Identifier` | `tooltip?: null`, `truncate?: null` | minor |

The same build gives `any` for every prop of `Button`, `IconButton`, `Badge`, `Status`,
`MessageBubble`, the form fields and others (163 `any` in the emitted declarations), so
`<Button variant="nonsense">` typechecks. The packed TypeScript smoke
(`test/smoke/package.smoke.ts`) touches about ten types and none of these components, which is
why this passes `verify`. JavaScript apps are not affected, which is probably why it was not
noticed: the one public consumer is JavaScript.

**The store erases state types.** `createSuiStore` passes `reducerMap as any`
(`src/state/createSuiStore.ts:45`), `SuiProviders` takes `store: any`
(`src/state/SuiProviders.tsx:26`), and every factory selector takes `state: any`. A consumer
gets no `RootState`, so the doctrine's "selectors everywhere" has no type support.

**Inconsistencies that become breaking to fix after 1.0:**

- `ariaLabel` in some components, `"aria-label"` in the layout primitives and `Icon`.
- `dataSuiComponent` against `componentName` for the same idea.
- Class modifiers in two styles: `sui-button-primary`, `sui-tab-active` against
  `sui-badge--green`, `sui-sheet--right`; and BEM elements only in `Sheet` (`sui-sheet__header`).
- `InputField` and `TextAreaField` are controlled only and silently read-only without
  `onChange`; `SelectField` and `CheckboxField` also work uncontrolled.
- Layout primitives accept no `className`, `style` or event props.
- The export names `ConfirmDialogComponent`, `FocusTabsComponent` (an alias) and
  `_isResolverPending` (a test helper in the public barrel, `src/state/ConfirmDialog.ts:93`).
- The wildcard export `"./*"` in `package.json` makes every internal module a public path.

**Hard-coded English** with no override: "Sign out", "Columns", "Reset all", "Notifications",
"Dismiss", "Refresh", "Show full", "Save name", "pixels wide" and others. Dates use
`toLocaleString()` (`src/format.ts:48`).

### 3.4 Component behaviour

Verified defects, most visible first:

1. **`Status` shows its developer metadata as a tooltip.** `src/primitive/StatusComponent.jsx:26-32`
   passes the metadata object as `tooltip`, not `fallback`, and `tooltipText`
   (`src/tooltip.js:25`) renders an object tooltip even when developer mode is off. Rendering
   `<Status state="running" />` wraps the badge in a hover card. `StatCount`, `Card` and
   `ListRow` inherit it.
2. **A column width cannot be typed.** The width field dispatches on each keystroke
   (`src/state/components/DataTableColumnMenuComponent.tsx:115-125`) and the reducer clamps to
   48–1200 (`src/state/DataTablePreferences.ts:67-70`): typing "1" stores 48. This field is
   also the documented alternative to dragging (WCAG 2.5.7) in `docs/ACCESSIBILITY.md`.
3. **`MarkdownEditor`'s handle does not attach on React 18.** `ref` is read as a plain prop
   (`src/editor/MarkdownEditorComponent.tsx:23,34`), which only React 19 passes; the peer range
   is `react >=18`. Either the range or the component is wrong.
4. **`Copyable` reports success when nothing was copied.** Without `navigator.clipboard` (any
   plain-HTTP origin) it still flashes "copied" (`src/CopyableComponent.jsx:56-60`). Nothing
   is announced to a screen reader either way.
5. **Popovers are not kept on screen above 880px** (`src/widget/popoverPosition.ts:119`): a
   menu opened near the right or bottom edge overflows. There is no flip to the other side at
   any width.
6. **`Card` with `maxHeight` renders its children twice**, once in the card and once in the
   "show full" popover (`src/widget/CardComponent.tsx:117,151`): duplicate ids, and stateful
   children mount twice.
7. **Every tooltip-capable component re-renders on every popover open or close.** `Tooltip`
   reads the controller before its no-text early return (`src/widget/TooltipComponent.tsx:42`),
   and the controller object changes with `openId` (`src/state/RtkPopoverProvider.tsx:31-37`).
   Each component also builds a metadata object per render for a developer mode nobody uses.
8. **Hydration mismatches.** `relativeTimeLabel` uses `Date.now()` and `timestamp` uses the
   runtime's locale (`src/format.ts:48,56`), so server and client text differ; relative times
   never refresh.
9. **`ConfirmDialog` focuses the confirm button, also for `kind: "danger"`**
   (`src/state/components/ConfirmDialogComponent.tsx:41`): Enter deletes.
10. Smaller: a controlled `SelectField` whose value is not among its options shows the first
    option; `Grid` throws on `count: 0`; `Title level={7}` renders `h3` with class `h7`;
    `UserMenu` disappears during `refresh()`; a click on the rail handle without moving saves
    the width.

### 3.5 Accessibility

What holds: contrast (computed, both themes, glass over any backdrop), names, the focus ring,
reduced motion and transparency, live regions for toasts and banners, keyboard resizing of
columns and the rail. `docs/ACCESSIBILITY.md` is honest about what is manual.

Gaps the document does not list:

- **Tooltips open on mouse enter only** (`src/widget/HoverCardComponent.tsx:105-106`). There is
  no focus trigger, no Escape, and the popover is `role="dialog"` rather than `role="tooltip"`
  tied with `aria-describedby` (`src/widget/PopoverComponent.tsx:37`). WCAG 1.4.13 asks for
  dismissable and for content available on focus. Icon-only buttons still have their name, so
  this is a loss of the hint, not of the name.
- **Menus have no keyboard model.** `ContextMenu` and `MoreActionsMenu` render `role="menu"`
  but focus does not move in, arrows and Escape do nothing, and focus does not return
  (`src/state/components/ContextMenuComponent.tsx:65-93`). Triggers carry no `aria-expanded` or
  `aria-haspopup`. `ContextMenu` opens on `contextmenu` only, so a keyboard user reaches it
  only with the context-menu key.
- **`FocusTabs` announces `role="tab"`** without arrow-key movement or a roving tab stop
  (`src/widget/FocusTabsComponent.tsx:57`); `Tab` is a toggle button (`aria-pressed`). Two
  models for one concept.
- **`Sheet`** takes no `aria-labelledby` from `SheetHeader`, and focus return on close is left
  to the host (the document says so).
- **Hover-only content.** `.sui-hover-button` and `.sui-badge-label` appear on `:hover`
  (`components.css:404-405,519-529`); the stylesheets have no `@media (hover: none)` path, so on
  touch they are unreachable or need a first tap. Not verified on a device.
- **Target sizes on touch**: the rail handle is 8–10px and several buttons are 24px; only the
  table handle has a `pointer: coarse` rule (`components.css:321-324`).
- **No `forced-colors` rule and no print styles** in any stylesheet. The manual checklist
  covers forced colours; nothing records that it was run.

### 3.6 State layer

Sound: fetch-once with a condition guard, stale-page and stale-detail guards, persistence that
never throws, URL sync with a detach function, defensive reducers.

Risks:

- `webApiJson` turns any body that is not JSON into `{}` and returns it as success
  (`src/state/webApi.ts:63`). A 200 HTML page (a proxy login page, an error page from a reverse
  proxy) becomes an empty object in the store. There is no `AbortSignal`, timeout or
  `credentials` option, and the return type is `any`.
- `createPagedListSlice`: a rejected page from a superseded filter is not version-checked
  (`src/state/createPagedListSlice.ts:168-172`), so an old failure marks the new list failed.
- `createResourceSlice`: `invalidated` during a load allows a second request, and the older
  response can land last (`src/state/createResourceSlice.ts:45-48`).
- `ConfirmDialog` keeps its resolver in a module variable (`src/state/ConfirmDialog.ts:31`): two
  stores on one page, or concurrent server renders, share it.
- Toast timers are not cancellable and the list is unbounded (`src/state/Toasts.ts:74-76`); the
  auto-dismiss test sleeps for real milliseconds.
- `paneSizesPersistMiddleware` and `attachViewportSync` must be wired by the host and appear in
  no guide.
- Filters are `Record<string, string>` only; no multi-value filters.
- The one public consumer wrote its own toast tray because it believed the library's was tied
  to the origin app. The state components are in fact exported from `/state`; the README names
  them but shows no usage.

### 3.7 Server-rendered adapter

The design is right: a branded `SafeHtml`, enum-checked props, tag names never from data, no
`style`, script or handler output, element-tree parity with React for every twin
(`test/ssr.test.mjs`), a strict-CSP example, and a peer-free install proven in `verify`.

Two defects in `html` (reproduced; exact inputs are kept out of this public document):

1. **The context scanner has no comment state** (`src/ssr/index.ts:82-87`). A quote character
   inside an HTML comment, or inside an unquoted static attribute value, in the developer's own
   template text puts the scanner into "quoted" state for the rest of the template. After that,
   a URL value is emitted unchecked and values inside `<script>` or in handler attributes are
   accepted instead of throwing. The attacker controls only values, so this needs a template of
   that shape, but such a template looks harmless.
2. **URL values are checked one by one** (`src/ssr/index.ts:125-127`). Two interpolations that
   together form the scheme and the rest of a URL in one attribute pass.

Also:

- `safeUrl` accepts protocol-relative and backslash forms (`src/ssr/index.ts:162-173`), and the
  test pins one as allowed (`test/ssr.test.mjs:247`). For `dismissHref` or `listRow.href` built
  from request data this is an open redirect. `MarkdownContent` has the same rule
  (`src/MarkdownContentComponent.jsx:11`).
- The lists of URL attributes in `html` and in `attrs()` differ and miss `srcset`, `data`,
  `ping` and `content` (`src/ssr/index.ts:69,178`).
- `documentPage` emits no `color-scheme` meta and no `dir`; `dataAttributes` can override the
  component marker (`src/ssr/index.ts:268-269`).
- No twin, though they need no script: `Card`, `Reader`, `Identifier`, a static
  `MarkdownContent`, `MessageBubble`. No pagination helper, so a server-rendered list has no
  answer to the React side's infinite scroll.
- A server-rendered page cannot switch theme without the app writing a cookie round trip; no
  helper or guide covers it.

### 3.8 Styles and tokens

- **No type scale.** `components.css` has 12px 21 times, 13px 12 times, 11px 12 times and ten
  other sizes; weights and line heights are literals too. scshafe-ios's design notes record
  "scshafe-ui has no type scale" and define their own, so the three libraries already disagree.
- **No layer, breakpoint or control-size tokens.** z-index values are 1, 3, 4, 5, 7, 60 and
  9000; breakpoints 880px and 560px are literals used by one component; radii of 1–4px remain
  as literals.
- **`color-mix()` on 72 lines and `:has()` twice, with no fallback.** Without `:has()` Card's
  "show full" footer never appears (`components.css:638`). The engines floor for browsers is
  not written down anywhere.
- **Not ready for right-to-left**: about 39 physical declarations against 4 logical ones.
- **`100vh`** on the right sheet (`components.css:276`); mobile browsers want `dvh`.
- Well done: no `!important`, no outline removal, `:where()` selectors so host overrides win,
  the reduced-transparency path, and the token tests.

### 3.9 Tests, verify and docs

- `verify` is fast (25 s locally, under 2 minutes in CI) and green. It proves static
  properties very well and behaviour hardly at all: the only simulated events are a checkbox
  click, a banner dismiss, the Sheet cancel event and the Tab key. The test "ContextMenu closes
  on action" never clicks (`test/state-components.test.mjs:54-67`); table resizing is checked by
  a regular expression over the source (`test/pinned-data-table.test.mjs:29-35`).
- No test for `MarkdownContent` parsing, `Copyable`, `webApi.ts`, the popover clamp math,
  `useInfiniteScroll` or most `format` helpers.
- `test/markers.test.mjs` pins 17 of 55 catalog entries, although `AGENTS.md` calls the markers
  the contract hosts pin. Nothing fails when an exported component is missing from the catalog.
- No API report: a removed prop or export outside the dozen names in the smokes goes unnoticed.
- No browser run of any kind; the eight-item manual checklist in `docs/ACCESSIBILITY.md` is the
  only cover for layout, sticky columns, the dialog top layer, glass over real content and
  forced colours, and no release note records that it was run.
- Docs: `FIRST-APP.md` and `ADOPTING.md` are the best part of the project. Missing: a
  per-component reference (props, markers, classes, an image), a guide to the state components,
  and the popover wiring a host must do today.
- **Environment (owner action).** This agent's shell runs Node 24.18.0, below the package's
  own floor of 24.22.1; 24.22.1 is installed under fnm but `fnm` is not on the session's PATH,
  so every command prints `fnm: command not found` and `verify` runs with "Unsupported engine"
  warnings. The packed-install smokes also ran under pnpm 12.8.1, not the pinned 10.34.5,
  because the scratch consumer has no `packageManager` field; that part belongs to the release
  kit in scshafe-dev.

### 3.10 Consumers and parity

From public repositories only:

| Project | Stack | Use of `@scshafe/ui` |
| --- | --- | --- |
| voice-journey | React 19, Redux Toolkit | **0.4.1** (current is 0.9.0). Uses the root, `/state` heavily, `/build`, `/format`. Re-declares ten tokens for its own theme, restyles `.sui-data-table` and `.sui-input-field`, and built its own toast tray, sub-tabs, card, stat tiles, progress bar and an 850-line SVG chart kit. |
| voice-lab | server-rendered | Chose not to use it: its design record says a public repository cannot ask others to install a package that needs a token. |
| bellwether | React 19, Redux Toolkit, Vite, TypeScript | None. Hand-rolled panels, tabs, metric grid, chat thread, tables and empty states in one 1,364-line file. The closest fit for adoption, and it is TypeScript, so it would hit finding 3.3 at once. |
| jobtrack | Express, server-rendered | None. Own card, pill, badge, panel and table classes: a direct fit for `/ssr`. |
| aptscout | Svelte | None; could take the stylesheets and tokens only. |
| wedding-planner | no frontend yet | None. |
| mail-otp | not visible | Said by `docs/ADOPTING.md` to be the model SSR consumer. |

Native siblings:

- **scshafe-qt** (0.10.0) snapshots the tokens of **0.4.1**: 62 tokens against 77, the old radii,
  no glass. **scshafe-ios** snapshots 0.9.0. Both read `src/tokens.ts` with their own script,
  and both ask for the snapshot as a release asset (request #14; scshafe-qt's own open review
  PR says the same).
- No table maps components across the three libraries. By name, native has and the web lacks:
  Switch, RadioButton, Slider, ProgressBar, SearchField, a standalone Chip, a loading-state
  wrapper, a type scale, and charts (Chart, Histogram). The web has and native lacks: the data
  table with its column menu, popovers and menus, the markdown pair, `Card`, `MessageBubble`,
  the rail workspace.
- Two iOS apps hand-copy the 0.9.0 accent colours.

**Request #14** is genuine (opened by `scshafe-agent[bot]` with the broker header). The
automatic run answered "needs owner" for good reasons: the upload step belongs in
`publish.yml`, which is scshafe-dev's, and backfilling 0.9.0 means adding an asset to a
published release. It is the cheapest high-value item on this page and is blocked only on
those two decisions.

### 3.11 What blocks value today

1. A TypeScript app cannot adopt the composites (3.3).
2. An app that uses menus must write dismissal and keyboard handling itself, undocumented (3.5).
3. Nobody can look at the components, so apps keep building their own (3.10).
4. Installing needs a token even though the package is public, which rules it out for public
   apps that expect outside contributors (3.10). This is a GitHub Packages property.
5. Consumers do not learn about releases, so they stay on old versions (3.10).

## 4. Ideas

Effort: **S** under a day of agent work, **M** one to three days, **L** a week or more or
several releases. Rank is value for effort, with blockers first. "Decision" means the owner
must choose before work starts.

### 4.1 Quick wins

| # | Idea | Value | Effort | Risks and dependencies |
| --- | --- | --- | --- | --- |
| 1 | **Typed components.** Convert the 21 `.jsx` files to `.tsx` with exported `*Props`; turn on `checkJs` for the rest; export `SheetProps`. Add a strict typecheck of the whole catalog to `verify`. | Unblocks every TypeScript consumer; makes wrong props a compile error. | M | Tightening `any` can break a JavaScript-with-types consumer that passes odd values: minor bump with notes. No marker or class change. |
| 2 | **Fix the visible defects** of 3.4: Status metadata tooltip, the width field (commit on blur or Enter), `Copyable` feedback, danger confirm focus, `MarkdownEditor` ref (`forwardRef` or peer `>=19`). | Removes bugs users see today. | S | The Status fix changes rendered markup (the hover-card wrapper goes): note it. Decision on the React floor. |
| 3 | **Harden `html` and `safeUrl`**: a comment state and unquoted-value handling in the scanner; reject a URL attribute with more than one interpolation or check the composed value; one shared URL-attribute list; refuse `//` and backslash forms unless asked. Add the cases as tests. | Closes the two holes in 3.7. | S | Rejecting `//host` is breaking for anyone who relies on it (a test pins it): minor bump. Ship as a patch release soon, and supersede nothing. |
| 4 | **Token snapshot asset (request #14).** A generator script here with a byte-stability test; the upload step lands in scshafe-dev's `publish.yml`. | Ends token drift for scshafe-qt and scshafe-ios; replaces two readers. | S here, S in scshafe-dev | Decision: backfill 0.9.0 or start at the next release. Needs a request to scshafe-dev (owner session). |
| 5 | **Pin what the contract promises.** Markers for all catalog entries; a test that every exported component is in the catalog; an API report (the emitted `.d.ts` export list, checked in) that fails on unreviewed change. | Makes "breaking change" detectable, which SemVer here depends on. | S | The API report adds a file to regenerate in release commits. |
| 6 | **One version in the guides.** Either a test that every `@scshafe/ui@x.y.z` in `README.md` and `docs/` equals `package.json`, or a release step that rewrites them. Fix "private package" in `src/build.ts`. | Guides stop teaching 0.4.1. | S | `docs/FIRST-APP.md` claims a fresh-eyes run at 0.4.1; bumping it without re-running is a small honesty cost. |
| 7 | **Scrub origin-app residue.** Remove plan codes and dead file references from comments; decide the fate of `toneByState`, `iconByState` and the `brand.*`/`nav.*` icon names. | Restores the `AGENTS.md` invariant; shipped source reads cleanly. | S for comments | Decision: the vocabularies are public API. Options: keep as "default workflow vocabulary" and say so, or deprecate and let hosts pass a map. |
| 8 | **`webApiJson` hardening**: fail on a non-JSON success body unless the status is 204, accept `signal` and `credentials`, generic return type; version-check rejected pages. | Stops silent empty data behind a proxy. | S | A host that relied on `{}` for empty bodies breaks: note it. |
| 9 | **Export the contrast check** as `@scshafe/ui/contrast` (the computation in `test/support/contrast.mjs`). | `docs/ACCESSIBILITY.md` tells hosts to copy test code; voice-journey re-declares ten tokens unchecked. | S | New public surface to keep stable. |
| 10 | **Fix the agent host's Node default** to 24.22.1 and put `fnm` on the session PATH. | `verify` runs on a supported, patched Node. | S | Owner action on the host; not this agent's to change. |

### 4.2 Bigger bets

| # | Idea | Value | Effort | Risks and dependencies |
| --- | --- | --- | --- | --- |
| 11 | **Component gallery.** A static site generated from `test/support/catalog.mjs`: every component in both themes, with its props table (from the types of idea 1), marker, classes and the SSR twin's output beside the React one. Built in CI, published with each release. | The owner and every app agent can see what exists; it is also the fixture for ideas 13 and 17. Directly attacks "apps build their own". | M | Decision: where it is published (GitHub Pages on this public repository is the obvious place; it would be the first deployed thing for a library that "deploys nothing"). Depends on idea 1 for prop tables. |
| 12 | **Popover behaviour in the package.** Escape, outside click and scroll dismissal in both providers; focus into menus, arrow keys, typeahead, focus return, `aria-expanded` on triggers; tooltips on focus with `role="tooltip"`; keep popovers on screen at every width with a flip. Consider the native `popover` attribute and CSS anchor positioning underneath. | Closes the largest accessibility gap and removes code every host must write. | M–L | Markup changes (`role`, wrappers) are contract changes: minor bump. Hosts that wired their own dismissal get double handling: provide an opt-out. Decision: browser floor if anchor positioning is used. |
| 13 | **Real-browser lane.** Playwright on the GitHub-hosted runner against the gallery: keyboard flows for menus, dialogs and the table; screenshots in light, dark, reduced transparency and forced colours; contrast sampled from pixels over the glass test images. | Turns the eight manual checks into evidence per release; catches layout and `:has()`/`color-mix()` regressions jsdom cannot see. | L | New dev dependency with a browser download (an `allowBuilds` review); screenshot flake needs tolerance; CI time grows. Depends on idea 11. |
| 14 | **Fill the component gaps the apps show**, in this order: `Switch`, `RadioGroup`, `SearchField`, `ProgressBar` and a loading wrapper (`Skeleton`/`Spinner`), `Tabs` with panels, standalone `Chip`, SSR `pagination`, then `DateField` and `Combobox`. Each with an SSR twin where it needs no script. | Matches what voice-journey, bellwether and jobtrack built themselves and what scshafe-qt already has. | L, incremental (S–M each) | The doctrine's extraction bar is "two real consumers": the audit in 3.10 meets it for most of these. Each needs tokens, catalog, axe and parity entries. |
| 15 | **Table, second version.** Sortable headers with `aria-sort` wired to `createPagedListSlice.sortChanged`; row selection; empty and loading rows; right pinning; windowing for long lists; sort links in the SSR `dataTable`. | The table is the most used and most restyled component in the one consumer. | L | Larger API; keep `PinnedDataTable` stable and add beside it, or version the props. |
| 16 | **Fleet adoption loop.** A `consumers` list in this repository; on each release the agent files one request per consumer through the broker with the changelog's migration notes; a codemod subpath for mechanical renames; a small fleet table (project, pinned version, days behind). | Consumers stop drifting five releases; friction comes back as requests. | M | Depends on `request targets` covering the apps. Public requests are visible to anyone. Decision: whether this agent may file upgrade requests routinely. |
| 17 | **One token source for three platforms, and a parity table.** After idea 4: a `docs/PARITY.md` mapping each component across web, Qt and iOS with status; add type-scale, layer and control-size tokens so native stops inventing them; later, generate `tokens.ts`, `tokens.css` and the snapshot from one data file. | Ends the disagreement on type and radii; gives the owner one place to see parity. | M for the table and tokens, L for generation | Decision: is scshafe-ui the source of truth for native tokens (today it is by practice), and how glass maps to native. New tokens are additive. |
| 18 | **Typed state layer.** `createSuiStore` infers the state type; typed `useSuiSelector`; cancellation on superseded requests; a mutation helper that pairs a thunk with toasts and invalidation; a polling or event-stream resource. | Makes the doctrine cheaper than hand-rolling; fixes the races in 3.6. | M–L | Must stay within "no RTK Query". The polling resource is a doctrine addition: decision. |
| 19 | **Form layer.** A field wrapper that carries error text, `aria-invalid` and `aria-errormessage`; an error summary; the same on the server so a failed POST re-renders with errors; uncontrolled mode for all fields. | Every app has forms; today errors are the host's markup. | M | Changes field markup: minor bump. |
| 20 | **Agent-facing reference.** Ship a generated `docs/COMPONENTS.md` (from idea 11's data) inside the package so an app's agent reads it from `node_modules`; add the `.agents/skills` entry `dev.toml` records as missing: "build a screen with @scshafe/ui". | The consumers are built by agents; this is their documentation channel. | S after idea 11 | Depends on scshafe-dev's skill catalog (M4). Adds to the payload. |
| 21 | **Density, type scale and touch.** Font-size and line-height tokens, a `data-sui-density` attribute, `pointer: coarse` sizes, `(hover: none)` paths, `dvh`, logical properties. | Phone use and right-to-left become possible; one look across platforms. | M | Touches most rules: visual change, needs idea 13 to do safely. Decision: are phones and other languages in scope. |
| 22 | **Charts.** Categorical and sequential chart tokens with contrast checks, plus a small SVG set (sparkline, bar, line) or a documented recipe. | Two apps and scshafe-qt already have charts; none share colours. | M–L | Decision: components, or tokens and guidance only. Scope can grow without limit. |
| 23 | **Optional enhancement script for server-rendered pages** (`@scshafe/ui/enhance`): theme toggle, dismiss, copy, column resize, loaded as one same-origin module under a CSP. | Server-rendered apps get the small interactions without React. | M | Breaks "no client JavaScript" as a blanket statement; must stay optional. Decision. |
| 24 | **A plan for 1.0**: settle the naming inconsistencies of 3.3 in one breaking release, drop the wildcard export, write the deprecation policy, then freeze. | Consumers pin exact versions today because any minor may break. | M | Needs ideas 1, 5 and 12 first. |
| 25 | **Distribution without a token.** Publish also to the public npm registry, or document a tarball-from-release install. | Removes the reason voice-lab gave for not adopting. | S–M | Decision, and a fleet-wide one (the library standard names GitHub Packages; `publish.yml` is scshafe-dev's). |

### 4.3 Where newer models help

- **Visual review per release.** A vision-capable model reads the gallery screenshots (idea
  13) against `docs/ACCESSIBILITY.md` and the previous release, and writes the "what changed
  visually" section of the changelog. It supplements the pixel checks; it does not replace a
  person with a screen reader.
- **Adoption runs.** For each release, an agent migrates one consumer on a branch and reports
  every point where the guide was wrong or a component was missing, as a request here. This is
  how `FIRST-APP.md` was validated once; it can be routine (idea 16).
- **Cross-platform parity review.** The same model compares web, Qt and iOS renderings of one
  component and lists differences for `docs/PARITY.md` (idea 17).
- **Migration notes and codemods** drafted from the API report diff (idea 5), then checked by
  running them on a consumer.
- **Screen drafting for app agents.** With the generated reference (idea 20) in the package, an
  app's agent can build a screen from the catalog instead of inventing classes; the gallery
  gives it images to compare its output with.
- **Review depth.** This review found the type and SSR defects by running things (a strict
  typecheck, hostile templates) rather than reading. A scheduled review of that kind on each
  minor release is cheap now.

### 4.4 Suggested order

1. A patch release with ideas 2, 3 and 8 (defects and hardening).
2. Idea 4 with the scshafe-dev step, and idea 10 on the host.
3. Idea 1 with idea 5 (typed components, pinned API) as the next minor.
4. Idea 11 (gallery), then 12 (popover behaviour), then 13 (browser lane).
5. Ideas 14 to 17 driven by the first adoptions (jobtrack on `/ssr`, bellwether on React).

## 5. Decisions for the owner

1. **Request #14**: approve the asset, and backfill 0.9.0 or start at the next release.
2. **React floor**: keep `>=18` and fix `MarkdownEditor`, or raise the peer to `>=19`.
3. **Origin-app vocabularies** (`toneByState`, `iconByState`, `brand.*`/`nav.*` icons): keep as
   a documented default, or deprecate.
4. **Developer-mode tooltips** (`devUxEnabled`, the per-component metadata): keep or retire.
   Retiring removes a wrapper from the markup and a re-render path.
5. **Gallery**: whether a library may publish a static site, and where.
6. **Popover behaviour**: move into the package (a contract change), and whether to build on
   the native `popover` attribute and anchor positioning, which sets a browser floor.
7. **Browser support**: write the floor down. The stylesheets already need `color-mix()` and
   `:has()`.
8. **Scope**: phones, right-to-left and other languages; charts; a client script for
   server-rendered pages.
9. **Distribution**: GitHub Packages only, or a token-free route as well.
10. **Fleet loop**: may this agent file upgrade requests to consumers on each release.
11. **Source of truth for native tokens**, and how glass maps to Qt and iOS.
12. **Disclosure**: the SSR template defects are described here in general terms in a public
    repository. If the owner prefers, the fix can land before this document is discussed
    further.

## 6. Commands run

```sh
pnpm install --frozen-lockfile
pnpm run verify        # 219 tests pass; payload, release bytes and packed-install smokes pass
dev check .            # result: clean
gh issue list --label agent-request --state open   # #14
```

Also: `tsc --strict` over a five-line consumer of the built declarations; a render of
`Status` with `react-dom/server`; six `html` template cases against the built SSR module. Run
first on Node 24.18.0 (the session default, see 3.9), then again on Node 24.22.1 with the same results; pnpm 10.34.5.
