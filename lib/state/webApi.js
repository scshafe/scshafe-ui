// S1 (state layer) — the fetch seam, moved from the copies both consumers carried
// (MC web/src/state/webApi.js, voice-journey web/src/state/webApi.js — verbatim
// behavior, now typed). The library never knows an endpoint: hosts call these with
// their own paths, and the factories accept fetchers built on top.
export class WebApiError extends Error {
    status;
    payload;
    path;
    label;
    constructor(message, { status = null, payload = null, path = null, label = "Request" } = {}) {
        super(message);
        this.name = "WebApiError";
        this.status = status;
        this.payload = payload;
        this.path = path;
        this.label = label;
    }
}
export function webApiIdempotencyKey(prefix) {
    const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return prefix ? `${prefix}-${uuid}` : uuid;
}
export async function webApiJson(path, { method = "GET", body, headers = {}, idempotencyKey, label = "Request", cache = "no-store" } = {}) {
    const requestHeaders = { accept: "application/json", ...headers };
    if (body !== undefined && requestHeaders["content-type"] === undefined && requestHeaders["Content-Type"] === undefined) {
        requestHeaders["content-type"] = "application/json";
    }
    if (idempotencyKey) {
        requestHeaders["Idempotency-Key"] = idempotencyKey;
    }
    const response = await fetch(path, {
        method,
        headers: requestHeaders,
        cache,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = payload?.error ?? payload?.message ?? `${label} request failed: HTTP ${response.status}`;
        throw new WebApiError(message, { status: response.status, payload, path, label });
    }
    if (payload && typeof payload === "object" && "ok" in payload && payload.ok === false) {
        const message = payload?.error ?? `${label} returned ok=false`;
        throw new WebApiError(message, { status: response.status, payload, path, label });
    }
    return payload;
}
export function webApiMutation(path, body, { method = "POST", idempotencyKey, idempotencyPrefix, label = "Mutation" } = {}) {
    return webApiJson(path, {
        method,
        body,
        idempotencyKey: idempotencyKey ?? (idempotencyPrefix ? webApiIdempotencyKey(idempotencyPrefix) : undefined),
        label
    });
}
