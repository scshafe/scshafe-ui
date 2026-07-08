# mc-ui

Mission Control's generic frontend component package — framework-light React components with
no domain coupling, consumable by MC and other projects (the sibling of `graphpaper`).

## Layers

**Layout primitives (this release).** `Stack` · `Inline` · `Grid` · `Pane` · `Scroll` — thin,
accessible wrappers over CSS layout tokens (`--mc-space-*`). Import-closed: they depend only on
`react` and each other (via `layoutShared` — pure types + `resolveBaseAttrs`/`spaceClass`/
`joinClasses` helpers). This is the layout substrate an app renders through, and the home for a
responsive/mobile pass.

**Generic components — Bucket A (C2).** `Kbd` · `Sheet` (`SheetHeader`/`SheetBody`/`SheetFooter`) ·
`PinnedDataTable` · `MarkdownEditor`. The first three are import-closed (react only); `MarkdownEditor`
adds the tiptap editor stack (`@tiptap/react` · `@tiptap/starter-kit` · `@tiptap/extension-link` ·
`@tiptap/extension-placeholder` · `tiptap-markdown`, declared as package deps). Their styles ship in
`mc-ui/components.css`.

More layers (primitives like Button/Badge, the remaining widgets) follow as their couplings are
decoupled — see `DESIGN-FRONTEND-COMPONENT-PACKAGE.md` at the repo root for the extraction arc.

## Usage

```tsx
import { Stack, Inline, Grid, Pane, Scroll, Kbd, Sheet, PinnedDataTable, MarkdownEditor } from "mc-ui";
import "mc-ui/layout.css";     // layout-primitive styles (self-contained; theme via the --mc-space-* tokens)
import "mc-ui/components.css"; // Bucket-A component styles (Kbd / Sheet / PinnedDataTable / MarkdownEditor)

<Stack gap="md" align="stretch">
  <Inline gap="xs" wrap>…</Inline>
</Stack>
```

Types (`SpaceToken`, `ClampToken`, `StatusTone`, `BaseLayoutProps`, per-component `*Props`, …) are
re-exported from the package root.

## Build

TSX source in `src/` compiles to `lib/*.js` + `lib/*.d.ts` (committed): `npm run build`. Consumers'
bundlers (esbuild) bundle `lib/*.js`; TypeScript resolves `lib/*.d.ts`. `react` is a peer dependency.

## Styling

`import "mc-ui/layout.css"` — self-contained, carved from Mission Control's stylesheet. It defines
default `--mc-space-*` spacing tokens at `:root`; override them to theme. (Mission Control itself
keeps its own global stylesheet, so this file is for standalone consumers.)
