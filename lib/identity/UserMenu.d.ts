import { type IdentityLocation } from "./buildSignOutUrl.js";
import type { IdentityState } from "./identityResource.js";
export interface UserMenuProps {
    /** Host-owned identity avoids an additional session request. */
    identity?: IdentityState;
    /** Defaults to the browser location; injectable for SSR. */
    location?: IdentityLocation;
    className?: string;
}
/** Identity chip and RP-initiated Sign out link. Anonymous/loading renders nothing. */
export declare function UserMenu({ identity, ...props }: UserMenuProps): import("react").JSX.Element;
