// 0.9.1 — the fetch seam: a success response whose body is not JSON fails instead of becoming
// `{}` (204 No Content excepted), and signal and credentials reach fetch.
import assert from "node:assert/strict";
import test from "node:test";

const { webApiJson, webApiMutation, WebApiError } = await import("@scshafe/ui/state");

const calls = [];
function serve(body, { status = 200, contentType = "application/json" } = {}) {
  globalThis.fetch = async (path, init) => {
    calls.push({ path, init });
    return new Response(body, { status, headers: { "content-type": contentType } });
  };
}

test("webApiJson returns the parsed body of a JSON success", async () => {
  serve(JSON.stringify({ items: [1, 2] }));
  assert.deepEqual(await webApiJson("/api/items"), { items: [1, 2] });
});

test("webApiJson throws WebApiError on a success body that is not JSON", async () => {
  serve("<!doctype html><title>Sign in</title>", { contentType: "text/html" });
  await assert.rejects(webApiJson("/api/items", { label: "Items" }), (error) => {
    assert.ok(error instanceof WebApiError);
    assert.equal(error.status, 200);
    assert.equal(error.path, "/api/items");
    assert.match(error.message, /Items returned a response that is not JSON \(HTTP 200\)/);
    return true;
  });
  serve("", { status: 200 });
  await assert.rejects(webApiJson("/api/items"), WebApiError, "an empty 200 is not JSON either");
});

test("webApiJson resolves 204 No Content to {}", async () => {
  serve(null, { status: 204 });
  assert.deepEqual(await webApiJson("/api/items/1", { method: "DELETE" }), {});
});

test("webApiJson keeps the HTTP status in errors, with or without a JSON body", async () => {
  serve(JSON.stringify({ error: "No such plan" }), { status: 404 });
  await assert.rejects(webApiJson("/api/plans/9"), { name: "WebApiError", status: 404, message: "No such plan" });
  serve("Bad gateway", { status: 502, contentType: "text/plain" });
  await assert.rejects(webApiJson("/api/plans", { label: "Plans" }), { status: 502, message: "Plans request failed: HTTP 502" });
});

test("webApiJson and webApiMutation pass signal and credentials to fetch", async () => {
  serve(JSON.stringify({ ok: true }));
  const controller = new AbortController();
  calls.length = 0;
  await webApiJson("/api/a", { signal: controller.signal, credentials: "include" });
  await webApiMutation("/api/b", { name: "x" }, { signal: controller.signal, credentials: "omit" });
  await webApiJson("/api/c");
  assert.equal(calls[0].init.signal, controller.signal);
  assert.equal(calls[0].init.credentials, "include");
  assert.equal(calls[1].init.signal, controller.signal);
  assert.equal(calls[1].init.credentials, "omit");
  assert.equal(calls[1].init.method, "POST");
  assert.equal("signal" in calls[2].init, false, "unset options are left to fetch's defaults");
  assert.equal("credentials" in calls[2].init, false);
});

test("an aborted request rejects with the abort, not a WebApiError", async () => {
  globalThis.fetch = (_path, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(init.signal.reason));
  });
  const controller = new AbortController();
  const pending = webApiJson("/api/slow", { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});
