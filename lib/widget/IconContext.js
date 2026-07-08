import React from "react";
// Default = a no-op renderer that renders NOTHING. A primitive rendered with NO
// provider simply shows no icon rather than crashing — the graceful-degrade
// closed state for standalone consumers. MC ALWAYS mounts McIconProvider at the
// app root, so MC never hits this path (its icons are always the registry ones).
// (Latent: a FUTURE MC render root/portal outside McIconProvider would drop
// glyphs silently — same inert-default class as C0's PopoverControllerContext;
// a loud-over-silent hardening pass could dev-warn in BOTH fallbacks together.)
const NOOP_ICON_RENDERER = () => null;
export const IconContext = React.createContext(NOOP_ICON_RENDERER);
// Hook returning the injected render function. Primitives do
// `const renderIcon = useIcon();` then `renderIcon(name, { size })`.
export function useIcon() {
    return React.useContext(IconContext);
}
