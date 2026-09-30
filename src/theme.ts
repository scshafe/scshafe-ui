// Theme selection. The stylesheets follow the user's `prefers-color-scheme`;
// `data-sui-theme="light" | "dark"` on the root element (or any subtree) pins
// a theme. Server-rendered pages put the attribute in their HTML; client apps
// can set it with applySuiTheme / useSuiTheme, or SuiProviders' `theme` option.
import { useEffect, useLayoutEffect } from "react";
import { SUI_THEME_ATTRIBUTE, type SuiThemeName } from "./tokens.js";

/** A pinned theme, or "system" to follow prefers-color-scheme. */
export type SuiThemePreference = SuiThemeName | "system";

export { SUI_THEME_ATTRIBUTE };

function rootElement(): Element | undefined {
  return typeof document === "undefined" ? undefined : document.documentElement;
}

/**
 * Pin `theme` on `element` (default: the document's root element), or remove
 * the pin for "system". Returns a function that restores the previous value.
 * A no-op without a DOM (server rendering).
 */
export function applySuiTheme(theme: SuiThemePreference, element: Element | undefined = rootElement()): () => void {
  if (!element) return () => {};
  if (theme !== "light" && theme !== "dark" && theme !== "system") {
    throw new TypeError(`unknown @scshafe/ui theme: ${String(theme)}`);
  }
  const previous = element.getAttribute(SUI_THEME_ATTRIBUTE);
  if (theme === "system") element.removeAttribute(SUI_THEME_ATTRIBUTE);
  else element.setAttribute(SUI_THEME_ATTRIBUTE, theme);
  return () => {
    if (previous === null) element.removeAttribute(SUI_THEME_ATTRIBUTE);
    else element.setAttribute(SUI_THEME_ATTRIBUTE, previous);
  };
}

const useIsomorphicLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Keep the document's theme pinned to `theme` while the calling component is
 * mounted (restored on unmount). `undefined` leaves the attribute alone.
 */
export function useSuiTheme(theme: SuiThemePreference | undefined): void {
  useIsomorphicLayoutEffect(() => (theme === undefined ? undefined : applySuiTheme(theme)), [theme]);
}
