export type IdentityLocation = Pick<Location, "hostname" | "origin">;

/**
 * Where Sign out goes, from configuration (the shared auth library supplies
 * it; the package never derives an identity provider's host).
 */
export interface SignOutConfig {
  /**
   * The identity provider's OIDC `end_session_endpoint`, e.g.
   * `https://id.example.net/api/oidc/end-session`. Absolute `https:` (plain
   * `http:` only for a loopback host in development), without credentials.
   */
  endSessionEndpoint: string;
  /** Where the provider returns the user after logout. Default: the app's origin + "/". */
  postLogoutRedirectUri?: string;
  /** The auth proxy's same-origin sign-out path. Default: oauth2-proxy's `/oauth2/sign_out`. */
  proxySignOutPath?: string;
  /** Ask the proxy to pass the session's ID token as `id_token_hint` (oauth2-proxy's `{id_token}` macro). Default true. */
  idTokenHint?: boolean;
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

function safeUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === "https:") return url;
  if (url.protocol === "http:" && LOOPBACK.has(url.hostname)) return url;
  return null;
}

/**
 * The RP-initiated logout href: the proxy clears its session, then redirects
 * (`rd`) to the provider's end-session endpoint, which returns the user to
 * `postLogoutRedirectUri`. The proxy substitutes `{id_token}`; no token
 * reaches the browser code. Returns null when no valid configuration is given,
 * so a menu without configuration offers no Sign out link rather than a guess.
 */
export function buildSignOutUrl(
  config: SignOutConfig | null | undefined,
  location: IdentityLocation | undefined = typeof window === "undefined" ? undefined : window.location
): string | null {
  if (!config) return null;
  const endSession = safeUrl(config.endSessionEndpoint);
  if (!endSession) return null;
  const proxyPath = config.proxySignOutPath ?? "/oauth2/sign_out";
  if (typeof proxyPath !== "string" || !/^\/(?![/\\])[^\s?#]*$/.test(proxyPath)) return null;
  let postLogout: string | undefined;
  if (config.postLogoutRedirectUri !== undefined) {
    const configured = safeUrl(config.postLogoutRedirectUri);
    if (!configured) return null;
    postLogout = configured.href;
  } else if (location) {
    const origin = safeUrl(location.origin);
    if (!origin || origin.hostname !== location.hostname.toLowerCase()) return null;
    postLogout = `${origin.origin}/`;
  }
  const query = [
    ...(config.idTokenHint === false ? [] : ["id_token_hint={id_token}"]),
    ...(postLogout ? [`post_logout_redirect_uri=${encodeURIComponent(postLogout)}`] : [])
  ];
  const separator = endSession.search ? "&" : "?";
  const target = query.length ? `${endSession.href}${separator}${query.join("&")}` : endSession.href;
  return `${proxyPath}?rd=${encodeURIComponent(target)}`;
}
