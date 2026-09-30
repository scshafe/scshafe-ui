// L3 pin — the card doctrine as component behavior: iconized state through the
// icon seam (providerless markup unchanged — the bucket-test contract holds),
// Card v2's status slot / chip cap / relative timestamp / meta footer, ListRow's
// status+timestamp, EmptyState glyphs, StatCount pairing, relativeTimeLabel.
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { Badge, Status, StatCount, Card, ListRow, EmptyState, relativeTimeLabel } = await import("../lib/index.js");
const { DefaultIconProvider } = await import("../lib/icons/index.js");

const bare = (element) => renderToStaticMarkup(element);
const iconized = (element) => renderToStaticMarkup(React.createElement(DefaultIconProvider, null, element));

test("iconized state renders only under a provider — providerless markup is unchanged", () => {
  const before = bare(React.createElement(Status, { state: "running" }));
  assert.doesNotMatch(before, /<svg/, "no provider → text-only chip (bucket pins hold)");
  assert.match(before, /class="sui-badge sui-badge--green"[^>]*data-sui-component="Status"/);
  const after = iconized(React.createElement(Status, { state: "running" }));
  assert.match(after, /<svg/, "provider → the state glyph renders");
  const optedOut = iconized(React.createElement(Status, { state: "running", icon: null }));
  assert.doesNotMatch(optedOut, /<svg/, "icon={null} opts out");
  const kind = iconized(React.createElement(Status, { state: "patch" }));
  assert.doesNotMatch(kind, /<svg/, "kind words get no glyph by design");
  const badge = iconized(React.createElement(Badge, { value: "3", icon: "action.star" }));
  assert.match(badge, /<svg/);
});

test("Card v2: status slot, chip cap with +N overflow, relative timestamp, meta footer", () => {
  const html = iconized(React.createElement(Card, {
    id: "c1",
    title: "Approve deploy",
    status: "blocked",
    chips: [{ label: "infra" }, { label: "urgent" }, { label: "ops" }, { label: "q3" }],
    timestamp: new Date(Date.now() - 7200_000).toISOString(),
    meta: [{ label: "id", value: "0123456789abcdef-full-uuid-never-truncated" }],
    children: "body",
  }));
  assert.match(html, /class="sui-card-status"/, "the glanceable state has its own slot");
  assert.match(html, /data-sui-component="Status"[^>]*data-sui-tone="orange"/);
  assert.ok(html.includes("infra") && html.includes("urgent"), "first two chips visible");
  assert.equal(html.includes(">ops<"), false, "third chip collapsed");
  assert.match(html, /sui-card-chip-overflow[^>]*title="ops, q3"[^>]*>\+2</, "+N lists the hidden chips");
  assert.match(html, /class="sui-card-timestamp"[^>]*title="[^"]+"[^>]*>2h ago</, "relative + absolute-on-hover");
  assert.match(html, /class="sui-card-meta"/);
  assert.match(html, /0123456789abcdef-full-uuid-never-truncated/, "ids demoted, never truncated");
  const plain = bare(React.createElement(Card, { id: "c2", title: "T", children: "b" }));
  assert.doesNotMatch(plain, /sui-card-status|sui-card-meta|sui-card-timestamp/, "all v2 slots are opt-in");
});

test("ListRow gains the status slot and timestamp; chips stay text-only taxonomy", () => {
  const html = iconized(React.createElement(ListRow, {
    title: "Run 42",
    status: "failed",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    chips: ["retry_scheduled"],
    children: null,
  }));
  assert.match(html, /class="sui-card-status"/);
  assert.match(html, /data-sui-tone="red"/);
  assert.match(html, /1m ago/);
  const chipsSection = html.slice(html.indexOf('class="sui-list-row-chips"'));
  assert.doesNotMatch(chipsSection.slice(0, 200), /<svg/, "taxonomy chips render without glyphs");
});

test("EmptyState icon and StatCount pairing", () => {
  const empty = iconized(React.createElement(EmptyState, { message: "No runs yet", icon: "tab.runs" }));
  assert.match(empty, /class="sui-empty-icon"/);
  assert.match(empty, /<svg/);
  const pair = bare(React.createElement(StatCount, { state: "running", count: 4 }));
  assert.match(pair, /class="sui-stat-count"[^>]*data-sui-component="StatCount"/);
  assert.match(pair, /data-sui-component="Status"/);
  assert.match(pair, /data-sui-component="StatCountValue"/);
});

test("relativeTimeLabel buckets and directions", () => {
  const now = "2026-07-31T12:00:00Z";
  assert.equal(relativeTimeLabel("2026-07-31T11:59:58Z", now), "now");
  assert.equal(relativeTimeLabel("2026-07-31T11:58:00Z", now), "2m ago");
  assert.equal(relativeTimeLabel("2026-07-31T04:00:00Z", now), "8h ago");
  assert.equal(relativeTimeLabel("2026-07-28T12:00:00Z", now), "3d ago");
  assert.equal(relativeTimeLabel("2026-06-01T12:00:00Z", now), "2mo ago");
  assert.equal(relativeTimeLabel("2026-07-31T14:00:00Z", now), "in 2h");
  assert.equal(relativeTimeLabel(null, now), "");
});
