import React from "react";

// C1 — the injected icon seam. The icon-consuming primitives (Button/IconButton,
// HoverButton, Tab, EditableName) pass SEMANTIC icon-name strings (e.g.
// "action.copy") and never import an icon set. They call a render function read
// from React context. Two states supply it:
//   - a host provider (IconContext.Provider, or the packaged DefaultIconProvider
//     from @scshafe/ui/icons): renders the host's glyph for each name.
//   - the context DEFAULT (no provider): a no-op that renders nothing, so a
//     consumer that injects no icon set degrades GRACEFULLY (shows no glyph)
//     instead of crashing.
//
// This mirrors PopoverControllerContext's inversion: the package owns the seam,
// the host owns the icon set.

// The props a primitive passes alongside the icon name: the subset the
// primitives use (size + aria-hidden), open so a host renderer can forward its
// icon component's full surface (strokeWidth / className / aria-label / title).
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
// keep passing icon-name strings; the INJECTED renderer resolves them (a host's
// registry, or nothing under the default).
export type IconRenderer = (name: string, props?: IconRenderProps) => React.ReactNode;

// Default = a no-op renderer that renders NOTHING. A primitive rendered with NO
// provider simply shows no icon rather than crashing — the graceful-degrade
// closed state. (Latent: a render root/portal outside the host's provider drops
// glyphs silently — same inert-default class as PopoverControllerContext; a
// loud-over-silent hardening pass could dev-warn in BOTH fallbacks together.)
const NOOP_ICON_RENDERER: IconRenderer = () => null;

export const IconContext = React.createContext<IconRenderer>(NOOP_ICON_RENDERER);

// Hook returning the injected render function. Primitives do
// `const renderIcon = useIcon();` then `renderIcon(name, { size })`.
export function useIcon(): IconRenderer {
  return React.useContext(IconContext);
}
