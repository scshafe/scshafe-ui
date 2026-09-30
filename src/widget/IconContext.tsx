import React from "react";

// C1 (components-standalone track) — the injected seam that decouples the
// generic Bucket-C primitives (Button/IconButton, HoverButton, Tab,
// EditableName) from MC's icon set (web/src/icons/*: Icon.jsx →
// iconComponentFor → icon-registry.jsx / icon-names.js).
//
// WHY: those primitives imported <Icon> DIRECTLY and passed SEMANTIC icon-name
// strings (e.g. "action.copy") that Icon → iconComponentFor(name) resolves
// against the MC-SPECIFIC registry. Moving them into the standalone package
// would drag MC's whole icon set with them. They now call an INJECTED render
// function read from React context. Two states supply it:
//   - SuiIconProvider (MC): renders MC's EXISTING <Icon name={...}/> so every
//     glyph / size / aria attribute is BYTE-IDENTICAL to before.
//   - the context DEFAULT (no provider): a no-op that renders nothing, so a
//     standalone consumer that injects no icon set degrades GRACEFULLY (shows
//     no glyph) instead of crashing. Standalone consumers inject their own icon
//     set via their own provider.
//
// This mirrors C0's PopoverControllerContext inversion. web/src/icons/* itself
// STAYS in MC (it is MC's icon set, not generic) — only the DEPENDENCY on it is
// inverted. The icon-name string still flows to the MC registry via the
// injected renderer, so MC call sites are unchanged.

// The props a primitive passes alongside the icon name. Matches the subset of
// Icon.jsx's props the Bucket-C primitives actually use (size + aria-hidden),
// while staying open so an MC renderer can forward Icon's full surface
// (strokeWidth / className / aria-label / title) unchanged.
export interface IconRenderProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
  title?: string;
  [extra: string]: unknown;
}

// The seam itself: (semantic name, props) => the rendered icon node. Call sites
// keep passing icon-name strings; the INJECTED renderer resolves them (MC → its
// registry; a standalone consumer → its own set, or nothing under the default).
export type IconRenderer = (name: string, props?: IconRenderProps) => React.ReactNode;

// Default = a no-op renderer that renders NOTHING. A primitive rendered with NO
// provider simply shows no icon rather than crashing — the graceful-degrade
// closed state for standalone consumers. MC ALWAYS mounts SuiIconProvider at the
// app root, so MC never hits this path (its icons are always the registry ones).
// (Latent: a FUTURE MC render root/portal outside SuiIconProvider would drop
// glyphs silently — same inert-default class as C0's PopoverControllerContext;
// a loud-over-silent hardening pass could dev-warn in BOTH fallbacks together.)
const NOOP_ICON_RENDERER: IconRenderer = () => null;

export const IconContext = React.createContext<IconRenderer>(NOOP_ICON_RENDERER);

// Hook returning the injected render function. Primitives do
// `const renderIcon = useIcon();` then `renderIcon(name, { size })`.
export function useIcon(): IconRenderer {
  return React.useContext(IconContext);
}
