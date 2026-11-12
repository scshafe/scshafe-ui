// S1 (state layer) — the fetch seam. The library never knows an endpoint: hosts call these with
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
  /** Aborts the request: an AbortController's signal, or AbortSignal.timeout(ms). */
  signal?: AbortSignal;
  /** Whether cookies and HTTP authentication go with the request; fetch's default
   * ("same-origin") when unset. */
  credentials?: RequestCredentials;
}

/** Fetch JSON. A response that is not ok, or a JSON body with `ok: false`, throws WebApiError;
 * so does a successful response whose body is not JSON (an HTML login or error page from a
 * proxy, an empty body), except 204 No Content, which resolves to `{}`. `T` is the caller's
 * claim about the payload's shape; nothing checks it. */
export async function webApiJson<T = any>(path: string, {
  method = "GET",
  body,
  headers = {},
  idempotencyKey,
  label = "Request",
  cache = "no-store",
  signal,
  credentials
}: WebApiJsonOptions = {}): Promise<T> {
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
    body: body === undefined ? undefined : JSON.stringify(body),
    ...(signal ? { signal } : {}),
    ...(credentials ? { credentials } : {})
  });
  if (response.ok && response.status === 204) return {} as T;
  const text = await response.text();
  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch {
    if (response.ok) {
      throw new WebApiError(`${label} returned a response that is not JSON (HTTP ${response.status})`, { status: response.status, payload: null, path, label });
    }
    payload = {};
  }

  if (!response.ok) {
    const message = payload?.error ?? payload?.message ?? `${label} request failed: HTTP ${response.status}`;
    throw new WebApiError(message, { status: response.status, payload, path, label });
  }
  if (payload && typeof payload === "object" && "ok" in payload && payload.ok === false) {
    const message = payload?.error ?? `${label} returned ok=false`;
    throw new WebApiError(message, { status: response.status, payload, path, label });
  }
  return payload as T;
}

export interface WebApiMutationOptions {
  method?: string;
  idempotencyKey?: string;
  idempotencyPrefix?: string;
  label?: string;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
}

export function webApiMutation<T = any>(path: string, body: unknown, { method = "POST", idempotencyKey, idempotencyPrefix, label = "Mutation", signal, credentials }: WebApiMutationOptions = {}): Promise<T> {
  return webApiJson<T>(path, {
    method,
    body,
    idempotencyKey: idempotencyKey ?? (idempotencyPrefix ? webApiIdempotencyKey(idempotencyPrefix) : undefined),
    label,
    signal,
    credentials
  });
}
