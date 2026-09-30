import React from "react";
import { Provider } from "react-redux";
import { IconContext, type IconRenderer } from "../widget/IconContext.js";
import { RtkPopoverProvider } from "./RtkPopoverProvider.js";
import { useSuiTheme, type SuiThemePreference } from "../theme.js";
import { IdentityConfigProvider, type IdentityConfig } from "../identity/IdentityConfig.js";

// ============================================================================
// SuiProviders — the one-mount app root for state-layer consumers: react-redux
// Provider + RtkPopoverProvider (+ the icon seam when a renderer is supplied).
//
//   const store = createSuiStore({ slices: [Toasts, Popovers, /* … */] });
//   <SuiProviders store={store} icons={renderIcon}>
//     <App />
//   </SuiProviders>
//
// `icons` is optional — without it the IconContext default (render nothing)
// stands, exactly like consuming the components alone. `theme` pins
// data-sui-theme on the document root while mounted ("system" removes the pin
// so prefers-color-scheme decides; omitted, the attribute is left alone), and
// `identity` supplies the Sign out configuration to UserMenu.
// Requires the Popovers slice in the store (createSuiStore({ slices: [Popovers, …] })).
// ============================================================================

export interface SuiProvidersProps {
  store: any;
  children: React.ReactNode;
  icons?: IconRenderer;
  devUxEnabled?: boolean;
  /** Pin the light or dark theme on the document root, or follow the system ("system"). */
  theme?: SuiThemePreference;
  /** Identity configuration (the Sign out target) for every UserMenu below. */
  identity?: IdentityConfig;
}

export function SuiProviders({ store, children, icons, devUxEnabled = false, theme, identity }: SuiProvidersProps) {
  useSuiTheme(theme);
  const content = identity ? <IdentityConfigProvider config={identity}>{children}</IdentityConfigProvider> : children;
  const inner = <RtkPopoverProvider devUxEnabled={devUxEnabled}>{content}</RtkPopoverProvider>;
  return (
    <Provider store={store}>
      {icons ? <IconContext.Provider value={icons}>{inner}</IconContext.Provider> : inner}
    </Provider>
  );
}
