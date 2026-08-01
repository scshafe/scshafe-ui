// S1 (state layer) — the fetch seam, moved from the copies both consumers carried
// (MC web/src/state/webApi.js, voice-journey web/src/state/webApi.js — verbatim
// behavior, now typed). The library never knows an endpoint: hosts call these with
// their own paths, and the factories accept fetchers built on top.

export interface WebApiErrorOptions {
  status?: number | null;
  payload?: unknown;
  path?: string | null;
  label?: string;
}

export class WebApiError extends Error {
  status: number | null;
  payload: unknown;
  path: string | null;
  label: string;

  constructor(message: string, { status = null, payload = null, path = null, label = "Request" }: WebApiErrorOptions = {}) {
    super(message);
    this.name = "WebApiError";
    this.status = status;
    this.payload = payload;
    this.path = path;
    this.label = label;
  }
}

export function webApiIdempotencyKey(prefix?: string): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${uuid}` : uuid;
}

export interface WebApiJsonOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  label?: string;
  cache?: RequestCache;
}

export async function webApiJson(path: string, {
  method = "GET",
  body,
  headers = {},
  idempotencyKey,
  label = "Request",
  cache = "no-store"
}: WebApiJsonOptions = {}): Promise<any> {
  const requestHeaders: Record<string, string> = { accept: "application/json", ...headers };
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
  const payload: any = await response.json().catch(() => ({}));

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

export interface WebApiMutationOptions {
  method?: string;
  idempotencyKey?: string;
  idempotencyPrefix?: string;
  label?: string;
}

export function webApiMutation(path: string, body: unknown, { method = "POST", idempotencyKey, idempotencyPrefix, label = "Mutation" }: WebApiMutationOptions = {}): Promise<any> {
  return webApiJson(path, {
    method,
    body,
    idempotencyKey: idempotencyKey ?? (idempotencyPrefix ? webApiIdempotencyKey(idempotencyPrefix) : undefined),
    label
  });
}
