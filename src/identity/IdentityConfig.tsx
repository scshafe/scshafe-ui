import React, { createContext, useContext } from "react";
import type { SignOutConfig } from "./buildSignOutUrl.js";

/** Identity configuration a host (or the shared auth library) supplies once. */
export interface IdentityConfig {
  /** Sign-out target; without it UserMenu shows no Sign out link. */
  signOut?: SignOutConfig | null;
}

const IdentityConfigContext = createContext<IdentityConfig>({});

/** Provide identity configuration to every UserMenu below (SuiProviders' `identity` option mounts this). */
export function IdentityConfigProvider({ config, children }: { config: IdentityConfig; children?: React.ReactNode }) {
  return <IdentityConfigContext.Provider value={config}>{children}</IdentityConfigContext.Provider>;
}

export function useIdentityConfig(): IdentityConfig {
  return useContext(IdentityConfigContext);
}
