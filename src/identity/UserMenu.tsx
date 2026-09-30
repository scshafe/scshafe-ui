import { buildSignOutUrl, type IdentityLocation, type SignOutConfig } from "./buildSignOutUrl.js";
import { useIdentityConfig } from "./IdentityConfig.js";
import type { IdentityState } from "./identityResource.js";
import { useIdentity } from "./useIdentity.js";

export interface UserMenuProps {
  /** Host-owned identity avoids an additional session request. */
  identity?: IdentityState;
  /** Sign-out target; overrides IdentityConfigProvider's. `null` hides Sign out. */
  signOut?: SignOutConfig | null;
  /** Defaults to the browser location (for the default post-logout return); injectable for SSR. */
  location?: IdentityLocation;
  className?: string;
}

function IdentityChip({ identity, signOut, location, className }: UserMenuProps & { identity: IdentityState }) {
  const config = useIdentityConfig();
  if (identity.status !== "identified") return null;
  const label = identity.email || identity.preferredUsername || identity.user;
  const href = buildSignOutUrl(signOut === undefined ? config.signOut : signOut, location);
  return (
    <div className={["sui-user-menu", className].filter(Boolean).join(" ")} data-sui-component="UserMenu">
      <span className="sui-user-menu-identity" title={label}>{label}</span>
      {href ? <a className="sui-button sui-button-secondary sui-button-mini" href={href}>Sign out</a> : null}
    </div>
  );
}

function ConnectedUserMenu(props: Omit<UserMenuProps, "identity">) {
  const identity = useIdentity();
  return <IdentityChip {...props} identity={identity} />;
}

/** Identity chip and RP-initiated Sign out link. Anonymous/loading renders nothing. */
export function UserMenu({ identity, ...props }: UserMenuProps) {
  return identity
    ? <IdentityChip {...props} identity={identity} />
    : <ConnectedUserMenu {...props} />;
}
