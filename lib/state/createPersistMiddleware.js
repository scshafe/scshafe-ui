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
function safeLocalStorage() {
    try {
        return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
    }
    catch {
        return null;
    }
}
export function readPersistedState(key, normalize, fallback) {
    const storage = safeLocalStorage();
    if (!storage)
        return fallback;
    try {
        const raw = storage.getItem(key);
        if (!raw)
            return fallback;
        return normalize(JSON.parse(raw));
    }
    catch {
        return fallback;
    }
}
function matcherFor(matches) {
    if (typeof matches === "string") {
        return (type) => type.startsWith(matches);
    }
    const types = new Set(matches.map((entry) => (typeof entry === "string" ? entry : entry.type)));
    return (type) => types.has(type);
}
export function createPersistMiddleware({ key, select, matches }) {
    const isMatch = matcherFor(matches);
    return (storeApi) => (next) => (action) => {
        const result = next(action);
        if (typeof action?.type === "string" && isMatch(action.type)) {
            const storage = safeLocalStorage();
            if (storage) {
                try {
                    storage.setItem(key, JSON.stringify(select(storeApi.getState())));
                }
                catch {
                    /* ignore — persistence is best-effort */
                }
            }
        }
        return result;
    };
}
