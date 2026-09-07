export type IdentityLocation = Pick<Location, "hostname" | "origin">;
/** Pocket ID logout via oauth2-proxy, ported from Bellwether and Inbox.
 * The proxy substitutes {id_token}; no token reaches this component.
 * A local/IP address has no tailnet suffix from which to derive the IdP.
 */
export declare function buildSignOutUrl(location?: IdentityLocation | undefined): string | null;
