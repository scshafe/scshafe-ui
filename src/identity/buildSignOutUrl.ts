export type IdentityLocation = Pick<Location, "hostname" | "origin">;

/** Pocket ID logout via oauth2-proxy, ported from Bellwether and Inbox.
 * The proxy substitutes {id_token}; no token reaches this component.
 * A local/IP address has no tailnet suffix from which to derive the IdP.
 */
export function buildSignOutUrl(
  location: IdentityLocation | undefined = typeof window === "undefined" ? undefined : window.location
): string | null {
  if (!location) return null;
  const hostname = location.hostname.toLowerCase();
  if (/^[\d.]*$/.test(hostname) || hostname.includes(":")) return null;
  const labels = hostname.split(".");
  if (labels.length < 3 || !labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  let origin: URL;
  try {
    origin = new URL(location.origin);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(origin.protocol) || origin.hostname !== hostname) return null;
  const suffix = labels.slice(1).join(".");
  const postLogout = encodeURIComponent(`${origin.origin}/`);
  const endSession = `https://id.${suffix}/api/oidc/end-session?id_token_hint={id_token}&post_logout_redirect_uri=${postLogout}`;
  return `/oauth2/sign_out?rd=${encodeURIComponent(endSession)}`;
}
