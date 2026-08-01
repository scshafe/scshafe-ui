export declare function readPersistedState<TState>(key: string, normalize: (parsed: unknown) => TState, fallback: TState): TState;
type ActionMatcher = string | ReadonlyArray<string | {
    type: string;
}>;
export interface CreatePersistMiddlewareOptions {
    key: string;
    select: (state: any) => unknown;
    /** Action-type prefix ("PaneSizes/") or an array of action creators / type strings. */
    matches: ActionMatcher;
}
export declare function createPersistMiddleware({ key, select, matches }: CreatePersistMiddlewareOptions): (storeApi: {
    getState: () => any;
}) => (next: (action: any) => any) => (action: any) => any;
export {};
