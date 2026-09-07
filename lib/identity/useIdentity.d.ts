import { type IdentityState } from "./identityResource.js";
export type IdentityResult = IdentityState & {
    refresh: () => Promise<void>;
};
/** Read the browser's oauth2-proxy identity once on mount; refresh is manual.
 * This standalone proxy-session seam needs only React, like LocalPopoverProvider.
 * Hosts that already own identity state can instead pass it to UserMenu.
 */
export declare function useIdentity(): IdentityResult;
