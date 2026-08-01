export interface WebApiErrorOptions {
    status?: number | null;
    payload?: unknown;
    path?: string | null;
    label?: string;
}
export declare class WebApiError extends Error {
    status: number | null;
    payload: unknown;
    path: string | null;
    label: string;
    constructor(message: string, { status, payload, path, label }?: WebApiErrorOptions);
}
export declare function webApiIdempotencyKey(prefix?: string): string;
export interface WebApiJsonOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    idempotencyKey?: string;
    label?: string;
    cache?: RequestCache;
}
export declare function webApiJson(path: string, { method, body, headers, idempotencyKey, label, cache }?: WebApiJsonOptions): Promise<any>;
export interface WebApiMutationOptions {
    method?: string;
    idempotencyKey?: string;
    idempotencyPrefix?: string;
    label?: string;
}
export declare function webApiMutation(path: string, body: unknown, { method, idempotencyKey, idempotencyPrefix, label }?: WebApiMutationOptions): Promise<any>;
