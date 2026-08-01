# DESIGN: the standard site layout — workspace, cards, icons (the L-series)

*2026-07-31 · status: proposal (no code). Grounded in a full survey of MC's `web/src` + `styles.css` at the post-S3 branch state; every claim cites what the code actually renders.*

**The ask.** Standardize a site layout on what MC does well — the contained-scroll workspace (chrome fixed, bodies scroll) and heavy, obvious icon use — while fixing what it does poorly at the detail level: cluttered cards in focus-tab lists that bury the most important state.

**TL;DR.** Two findings reframe the work. (1) The contained-scroll layout everyone likes is **not in the package** — `SplitWorkspace`/`SurfaceHeader`/`Toolbar` ship in mc-ui with **zero call sites**; MC hand-rolls the pattern as app CSS plus four near-identical workspace copies. The pattern is proven but never got extracted, so no other site can have it. (2) The card clutter is **not a component defect** — `Card` is used once, `ListRow` twice; almost every list hand-rolls `<article class="task-row">` with its own conventions. There is no card doctrine to violate. So the plan is: write the doctrine into the components (Card v2 + icons-in-status), and extract the workspace shell for real (L-series, four phases, ~4–5 days).

---

## 1. What MC actually does well — and where it lives

The contained scroll is one unbroken chain, verified end to end:

- `#app`/`.app-root` are `height:100%; min-height:0`; `.app-main` is a clipped flex column (`overflow:hidden`).
- **The switch:** `.app-shell` scrolls like a document by default, but `.app-shell[data-active-workspace-content="project"|"projects"]` flips to `overflow:hidden; align-items:stretch` — one attribute turns the page from document-scroll into an app-frame.
- `.project-detail` is the only grid link: `grid-template-rows: auto minmax(0,1fr)` (tabs pinned, focus area grows).
- Below that it's flexbox discipline: `.project-tab-panel > * { flex: 0 0 auto }` pins every child (header, status line, rollups), and exactly one child — `> .mc-scroll` or `> .project-tab-fill` — gets `flex: 1 1 0`. The leaf scrollers are mc-ui's `Scroll`/`Pane` (`min-height:0` + `overflow`).
- Rails own their own scroll (`.collapsible-list-rail-body`), so a long plan list never scrolls the detail pane.

**The catch:** all of this is `styles.css` convention + a marker class (`.project-tab-fill` exists solely to say "I am the growing child"). The packaged layout components meant to encode it are unused — and MC instead carries **four literal copies** of the rail+detail workspace declaration (`.architecture-workspace`, `.project-notes-workspace`, `.implementation-plan-workspace`, `.project-chat-live-grid`), each with ~20 lines of duplicated rail chrome and its own mobile override. The 880px behavior even contains a dead rule (a `grid-template-columns` override on an element that is `display:flex`), and the drag-resize inline width forces `!important` wars in the mobile chat rules — symptoms of a pattern maintained in five places instead of one.

Also genuinely good and worth keeping as-is: one-active-focus rendering (no hidden tab DOM), the model-driven `FocusTabs` (already app-agnostic: items are pure data with icon/count/tooltip), `PaneSizes` drag-resize with commit-on-pointerup, the `surfaceId` collapse registry, manual-refresh doctrine, and tooltips-as-documentation on every primitive.

## 2. Card diagnosis — the clutter, as coded

Adoption first: `Card` ×1 (SmokeChecklist — and it's the best-behaved list in the app), `ListRow` ×2, `MetricCard` ×3. Everything else — inbox, approvals, consults, backlog closed-groups — hand-rolls its face. The concrete clutter causes, with receipts:

1. **Full UUIDs on the face.** Approvals renders the full id with a comment saying "never shortened" (a real domain constraint — auditability); consults and backlog show raw `idLine`s at title-adjacent weight. `.id` even sets `word-break:break-all`, so ids wrap mid-token across two lines.
2. **Always-visible forms.** Inbox cards embed live action forms inline (11 kind-specific variants — verdict buttons + text inputs on every card); consults render a full decide form (select + input + submit) on every row. N rows × one form each = the wall of controls.
3. **Timestamps at title weight.** Inbox and consults put bare timestamp text in the header row, competing with the headline.
4. **Two chip vocabularies.** Toned `Status`/`Badge` chips coexist with raw un-toned `mc-chip` spans (inbox kind/severity, consult type/decider) — the eye can't learn one system. Inbox's own chip classes (`inbox-kind-chip`, `-severity-*`) are **entirely unstyled** — the classes exist in JSX, no CSS anywhere.
5. **Rollups push rows below the fold.** Approvals stacks a duplicated refresh cluster + note + badge rollup above the list; consults stacks three `PanelHeader` sections; plans pin five children above the workspace.
6. **Unbounded bodies.** Backlog rows inline the full markdown brief with no clamp — one long brief and the list is gone. (`Card` already has clamp + overflow-detect + "Show full" popover; the hand-rolls don't.)
7. **Pairs that wrap apart.** StateOverview emits alternating `<Status/><Badge/>` with no pairing wrapper, so a state and its count can land on different lines.

The state-expression failure is structural: in the one place `Card` is used, state arrives as `chips[0]` — one chip among peers, in the corner. Nothing in the system says *"this is the fact you glance for."*

## 3. Icon diagnosis

The machinery is right: a closed 41-name semantic registry (`brand.`×1, `nav.`×7, `tab.`×15, `action.`×18) over `iconoir-react`, a load-time names↔bindings invariant, a no-op-degrading `IconContext` seam, one provider mount. Findings:

- **Two broken names in production:** the navigation selector maps `tab.git` and `tab.delete` — neither exists in the registry, so two project tabs silently render the `QuestionMark` fallback today.
- **The highest-value spot has no icon slot.** `Badge`/`Status` — every status, severity, and kind chip in the app — render text only. If icons should be leaned into hard, *state* is where they pay most: a glyph vocabulary for the tone system (running ▸, blocked ⛔-class, completed ✓, failed ✕, draft ✎…) makes every card scannable without reading.
- **Inconsistencies:** `RailToggle` and rail headers use literal `‹`/`›` text although `action.chevron-*` exist; tab headers say the word "Refresh" while rails use the `action.refresh` icon-button — two conventions for one action; `EmptyState` (21 consumer files) is bare text; `Card` has no icon affordance and `ListRow`'s `media` slot has zero usages.
- Menus already lean in (61 icon'd items, `action.copy` ×49) — proof the vocabulary works where it exists.

## 4. Recommendation 1 — the card doctrine (written into the components)

One sentence of doctrine: **a card answers "what is this and what state is it in" at a glance; everything else is demoted or hidden until asked for.** Concretely, as component API (additive, marker-contract-safe):

- **Card v2 anatomy** — `status` becomes a first-class prop (rendered as an iconized Status at a fixed position, visually distinct from taxonomy chips), `chips` capped at 2 visible + a "+N" overflow popover, a `meta` prop rendering a muted footer row (`RecordMeta`), `timestamp` rendered relative + muted + right-aligned with the absolute on `title`. Body clamped by default (`maxHeight="md"`) — the clamp/Show-full machinery already exists.
- **Ids: demoted, never truncated when the domain forbids it.** The approvals constraint is honored by *placement*, not shortening: full id in the mono meta footer with a copy affordance, out of the title's visual line.
- **Actions: hover-revealed by default.** The `mc-hover-host` + `MoreActionsMenu` machinery is already in the package (S3); inline always-open forms become popover-anchored forms (the pattern plans/notes already use for "New…").
- **One chip vocabulary.** Everything toned through `Status`/`Badge`; raw `mc-chip` retired from card faces (stays for code-ish inline tokens).
- **`StatCount`** — a tiny pairing component (state + count that cannot wrap apart) for rollup rows, replacing the alternating-fragments pattern.
- **Density** — a per-list switch: `comfortable` (Card) / `compact` (ListRow, single line); one canonical list container (`Grid autoFit minmax(240px,1fr)` for cards, `Stack gap="sm"` for rows) instead of per-tab inventions.
- **Iconized state** — `Status`/`Badge` gain an optional leading glyph resolved via `useIcon` from a shipped `iconByState` map (see L4); `EmptyState` gains an optional icon. This is the single highest-leverage "lean into icons" move: state becomes scannable everywhere at once.

## 5. Recommendation 2 — the L-series extractions

The two-consumer bar is met from two directions: MC internally consumes the workspace pattern in four hand-rolled copies, and the standard-site ask makes every future scaffold a consumer.

| Phase | Content | Effort |
|---|---|---|
| **L4 (first): `mc-ui/icons`** | Optional subpath, same mechanics as `mc-ui/state`: `iconoir-react` as optional peer; the 41-name registry moves in (fixing `tab.git`/`tab.delete`), plus `iconByState` (tone/state → glyph) and `DefaultIconProvider`. MC's `McIconProvider` thins to a re-export; the scaffold template mounts icons by default. Registry stays closed + load-time-verified. | 0.5–1 d |
| **L3: Card v2 + StatCount + iconized Status** | The §4 doctrine as additive props on `Card`/`ListRow`/`Badge`/`Status`/`EmptyState` + the new `StatCount`; carve the missing inbox chip styles as toned Badge usage. Bucket-test pins extended, not broken (new markup is opt-in via new props). | 1 d |
| **L2: `RailWorkspace`** | The real extraction of the four hand-rolled copies: `<RailWorkspace rail={…} detail={…}>` with contained scroll built in — composes `CollapsibleListRail` + `FocusSelectionList` + `RailToggle` (which move in with it), rides `PaneSizes` + a new `Layout` slice (`isMobile`, `collapsedListsBySurface`) in `mc-ui/state`, and owns the ≤880/≤560 responsive behavior in package CSS — ending the inline-width `!important` war by handling mobile inside the component. Supersedes the unused `SplitWorkspace` (deprecate). This revisits decision 4 *with cause*: the second consumer demanded it. | 1.5–2 d |
| **L1: the workspace frame contract** | The contained-scroll chain as documented package CSS: `.mc-app-frame` (clipped root), the document-vs-app-frame switch, `.mc-workspace-panel` (pinned children + one growing child; `.mc-fill` replaces `.project-tab-fill`), and a packaged `TabPanelHeader` (title + iconized refresh + status slot — unifying the two refresh conventions) beside the already-generic `FocusTabs`. MC adopts by class-swap; the scaffold template ships the frame by default so every new site starts contained-scroll. | 1 d |

**Quick wins in MC, independent of the arc** (each ≤30 min, on the branch): fix the two broken icon names; swap `RailToggle`/rail chevron text for `action.chevron-*`; make tab-header Refresh icon+label; delete the dead 880px grid rule.

**Sequencing rationale:** L4 before L3 because iconized state is the heart of the card doctrine; L2 before L1 because `RailWorkspace` is the biggest duplication payoff and L1's frame contract is partly documentation of what L2 builds. Each phase lands like S1–S4 did: package first with its own pin tests, MC adopts on the branch, voice-journey/scaffold adopt as proof, decisions honored in the commit trail.

## 6. What stays host-side

Domain tab bodies, the 11 inbox action-form variants (they become popover forms but stay MC code), the navigation/selector model layer, gestures/refresh plumbing, MC's icon *choices* for its domain tabs (the registry mechanism moves; `tab.plans` meaning "implementation plans" is MC vocabulary — hosts extend the registry with their own `tab.*` names through the same closed-list pattern).

## 7. Decisions requested

1. **Approve the card doctrine (§4)** as the standard — it will be written into components and the scaffold, and MC's tabs migrate to it opportunistically (inbox and consults first; they're the worst offenders and the best proof).
2. **Approve the L-series (§5)** with the L4 → L3 → L2 → L1 order.
3. **Confirm the decision-4 revision**: rails + `FocusSelectionList` (+`FocusTabs` packaging in L1) move into mc-ui as part of `RailWorkspace`; `SplitWorkspace`/`SurfaceHeader`/`Toolbar` are superseded/deprecated rather than adopted. SplitWorkspace-the-name retires; `MetaRow` stays host-side (unchanged).
4. **Icon posture**: confirm `mc-ui/icons` ships iconoir as the default set (optional peer), with `iconByState` making status glyphs the default everywhere Status renders — the strongest form of "lean into icons".
