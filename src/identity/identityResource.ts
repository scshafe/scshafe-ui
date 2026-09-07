export interface Identity {
  user: string;
  email: string;
  preferredUsername?: string;
  groups?: string[];
}

export type IdentityState =
  | { status: "loading" }
  | { status: "anonymous" }
  | ({ status: "identified" } & Identity);

const LOADING: IdentityState = { status: "loading" };
const ANONYMOUS: IdentityState = { status: "anonymous" };

// oauth2-proxy v7.15.3 UserInfo: user/email are always strings; groups and
// preferredUsername are optional. additionalClaims is intentionally ignored.
// https://github.com/oauth2-proxy/oauth2-proxy/blob/v7.15.3/oauthproxy.go#L660-L688
function parseIdentity(raw: unknown): IdentityState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return ANONYMOUS;
  const value = raw as Record<string, unknown>;
  if (typeof value.user !== "string" || typeof value.email !== "string") return ANONYMOUS;
  if (value.preferredUsername !== undefined && typeof value.preferredUsername !== "string") return ANONYMOUS;
  if (value.groups !== undefined && (!Array.isArray(value.groups) || !value.groups.every((group) => typeof group === "string"))) return ANONYMOUS;
  const user = value.user.trim();
  const email = value.email.trim();
  const preferredUsername = typeof value.preferredUsername === "string" ? value.preferredUsername.trim() : "";
  if (!user && !email && !preferredUsername) return ANONYMOUS;
  return {
    status: "identified", user, email,
    ...(preferredUsername ? { preferredUsername } : {}),
    ...(Array.isArray(value.groups) ? { groups: [...value.groups] as string[] } : {})
  };
}

/** Internal, per-hook resource. Reads the proxy session once; only refresh
 * starts another request. It owns no app authorization, tokens, or timer.
 */
export function createIdentityResource(fetchImpl: typeof fetch = (...args) => fetch(...args)) {
  let state = LOADING;
  let started = false;
  let inFlight: Promise<void> | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: IdentityState) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const refresh = (): Promise<void> => {
    if (inFlight) return inFlight;
    started = true;
    publish(LOADING);
    inFlight = Promise.resolve().then(async () => {
      try {
        const response = await fetchImpl("/oauth2/userinfo", {
          credentials: "same-origin", mode: "same-origin", cache: "no-store",
          redirect: "error", headers: { Accept: "application/json" }
        });
        publish(response.ok ? parseIdentity(await response.json()) : ANONYMOUS);
      } catch {
        publish(ANONYMOUS);
      }
    }).finally(() => { inFlight = undefined; });
    return inFlight;
  };
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => LOADING,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    load: () => started ? (inFlight ?? Promise.resolve()) : refresh(),
    refresh
  };
}
