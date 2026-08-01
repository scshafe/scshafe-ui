// ============================================================================
// createPersistMiddleware + readPersistedState — the localStorage persistence
// pattern MC hand-rolled three times (ChatReadReceipts, ProjectPins, PaneSizes),
// written once.
//
// The middleware saves `select(getState())` under `key` after any matching
// action; `readPersistedState` hydrates a slice's initialState (with a
// normalizer, because localStorage content is untrusted input from a past
// version of the app). Storage failures are swallowed — persistence is an
// enhancement, never a crash.
//
//   const initialState = readPersistedState("mc.paneSizes", normalize, { sizes: {} });
//   const persistPaneSizes = createPersistMiddleware({
//     key: "mc.paneSizes",
//     select: (state) => state.PaneSizes,
//     matches: "PaneSizes/",            // or: [paneSizeSet, paneSizeCleared]
//   });
// ============================================================================

function safeLocalStorage(): Storage | null {
  try {
    return typeof (globalThis as any).localStorage === "undefined" ? null : (globalThis as any).localStorage;
  } catch {
    return null;
  }
}

export function readPersistedState<TState>(
  key: string,
  normalize: (parsed: unknown) => TState,
  fallback: TState
): TState {
  const storage = safeLocalStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return normalize(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

type ActionMatcher = string | ReadonlyArray<string | { type: string }>;

function matcherFor(matches: ActionMatcher): (type: string) => boolean {
  if (typeof matches === "string") {
    return (type) => type.startsWith(matches);
  }
  const types = new Set(matches.map((entry) => (typeof entry === "string" ? entry : entry.type)));
  return (type) => types.has(type);
}

export interface CreatePersistMiddlewareOptions {
  key: string;
  select: (state: any) => unknown;
  /** Action-type prefix ("PaneSizes/") or an array of action creators / type strings. */
  matches: ActionMatcher;
}

export function createPersistMiddleware({ key, select, matches }: CreatePersistMiddlewareOptions) {
  const isMatch = matcherFor(matches);
  return (storeApi: { getState: () => any }) => (next: (action: any) => any) => (action: any) => {
    const result = next(action);
    if (typeof action?.type === "string" && isMatch(action.type)) {
      const storage = safeLocalStorage();
      if (storage) {
        try {
          storage.setItem(key, JSON.stringify(select(storeApi.getState())));
        } catch {
          /* ignore — persistence is best-effort */
        }
      }
    }
    return result;
  };
}
