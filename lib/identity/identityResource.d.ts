export interface Identity {
    user: string;
    email: string;
    preferredUsername?: string;
    groups?: string[];
}
export type IdentityState = {
    status: "loading";
} | {
    status: "anonymous";
} | ({
    status: "identified";
} & Identity);
/** Internal, per-hook resource. Reads the proxy session once; only refresh
 * starts another request. It owns no app authorization, tokens, or timer.
 */
export declare function createIdentityResource(fetchImpl?: typeof fetch): {
    getSnapshot: () => IdentityState;
    getServerSnapshot: () => IdentityState;
    subscribe(listener: () => void): () => void;
    load: () => Promise<void>;
    refresh: () => Promise<void>;
};
