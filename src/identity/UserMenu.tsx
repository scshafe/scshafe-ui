import { buildSignOutUrl, type IdentityLocation } from "./buildSignOutUrl.js";
import type { IdentityState } from "./identityResource.js";
import { useIdentity } from "./useIdentity.js";

export interface UserMenuProps {
  /** Host-owned identity avoids an additional session request. */
  identity?: IdentityState;
  /** Defaults to the browser location; injectable for SSR. */
  location?: IdentityLocation;
  className?: string;
}

function IdentityChip({ identity, location, className }: UserMenuProps & { identity: IdentityState }) {
  if (identity.status !== "identified") return null;
  const label = identity.email || identity.preferredUsername || identity.user;
  const href = buildSignOutUrl(location);
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
