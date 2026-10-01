// A server-rendered app on @scshafe/ui/ssr: plain node:http, no React, no client JavaScript,
// a strict Content-Security-Policy (no inline style, no script). The package's stylesheets are
// served from the installed package; app.css only frames the document.
//
//   node examples/ssr-app/server.mjs          # http://127.0.0.1:8080 (PORT, HOST override)
//
// It is the seed of the U4 guide's server-rendered app and is tested by test/ssr-app.test.mjs.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as ui from "@scshafe/ui/ssr";
import { relativeTimeLabel } from "@scshafe/ui/format";

export const CSP = "default-src 'self'; style-src 'self'; script-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

const ASSETS = new Map([
  ["/assets/tokens.css", fileURLToPath(import.meta.resolve("@scshafe/ui/tokens.css"))],
  ["/assets/layout.css", fileURLToPath(import.meta.resolve("@scshafe/ui/layout.css"))],
  ["/assets/components.css", fileURLToPath(import.meta.resolve("@scshafe/ui/components.css"))],
  ["/assets/app.css", fileURLToPath(new URL("./app.css", import.meta.url))]
]);

// Demo data: a sorted inbox.
const MESSAGES = [
  { id: "m1", from: "Pat Recruiter", subject: "Next steps for the role", bucket: "jobs", state: "running", at: "2026-10-01T08:00:00Z" },
  { id: "m2", from: "Daily Digest", subject: "Your Thursday reading", bucket: "newsletters", state: "completed", at: "2026-10-01T06:30:00Z" },
  { id: "m3", from: "Shop", subject: "20% off ends Sunday", bucket: "promotions", state: "queued", at: "2026-09-30T18:00:00Z" },
  { id: "m4", from: "Unknown sender", subject: "Re: your account", bucket: "unsorted", state: "blocked", at: "2026-09-30T12:00:00Z" }
];

function page({ title, active, body, now }) {
  const nav = ui.navTabs({
    ariaLabel: "Sections",
    items: [
      { id: "inbox", label: "Inbox", href: "/", active: active === "inbox", badge: MESSAGES.length },
      { id: "rules", label: "Rules", href: "/rules", active: active === "rules" }
    ]
  });
  return ui.documentPage({
    title: `${title} · mailroom example`,
    stylesheets: [...ASSETS.keys()],
    body: ui.appShell({
      ariaLabel: title,
      chrome: ui.html`<header class="app-header"><span class="app-brand">mailroom</span>${nav}</header>`,
      children: ui.html`<div class="app-body">${body(now)}</div>`
    })
  });
}

function inbox(query) {
  return (now) => {
    const q = query.trim().toLowerCase();
    const shown = q ? MESSAGES.filter((m) => `${m.from} ${m.subject} ${m.bucket}`.toLowerCase().includes(q)) : MESSAGES;
    const buckets = [...new Set(MESSAGES.map((m) => m.bucket))].map((bucket) => ({ bucket, count: MESSAGES.filter((m) => m.bucket === bucket).length }));
    return ui.stack({ gap: "lg", children: [
      ui.tabPanelHeader({ title: "Inbox", headingLevel: 1, aside: `${MESSAGES.length} messages`, statusLabel: q ? `filtered by “${query}”` : null }),
      ui.html`<form class="app-search" action="/" method="get" role="search">${[
        ui.inputField({ id: "q", name: "q", label: "Search", type: "search", value: query, placeholder: "Sender, subject or bucket" }),
        ui.button({ label: "Search", type: "submit", variant: "primary" }),
        q ? ui.button({ label: "Clear", href: "/", variant: "ghost" }) : null
      ]}</form>`,
      ui.grid({ columns: { kind: "autoFit", minSize: "xs" }, gap: "sm", children: buckets.map(({ bucket, count }) => ui.metricCard({ label: bucket, value: count })) }),
      ui.list({
        title: "Messages",
        count: shown.length,
        empty: { message: q ? `Nothing matches “${query}”.` : "The inbox is empty." },
        children: shown.map((m) => ui.listRow({ title: m.subject, subtitle: m.from, href: `/m/${encodeURIComponent(m.id)}`, status: m.state, chips: [m.bucket], timestamp: m.at, now, as: "div" }))
      }),
      ui.dataTable({
        ariaLabel: "Messages per bucket",
        tableId: "buckets",
        columns: [
          { id: "bucket", header: "Bucket", rowHeader: true, render: (row) => row.bucket },
          { id: "count", header: "Messages", align: "right", render: (row) => String(row.count) }
        ],
        rows: buckets
      })
    ] });
  };
}

function rules() {
  return () => ui.panel({ children: [
    ui.panelHeader({ title: "Rules", headingLevel: 1, description: "Whitelist rules route a sender straight to a bucket." }),
    ui.emptyState({ message: "No rules yet." })
  ] });
}

function message(id) {
  const m = MESSAGES.find((candidate) => candidate.id === id);
  if (!m) return null;
  return (now) => ui.panel({ children: [
    ui.panelHeader({ title: m.subject, headingLevel: 1, description: m.from, aside: ui.status({ state: m.state }) }),
    ui.recordMeta({ entries: [{ label: "bucket", value: m.bucket }, { label: "received", value: m.at }] }),
    ui.description({ children: `Received ${relativeTimeLabel(m.at, now)}.` }),
    ui.button({ label: "Back to the inbox", href: "/" })
  ] });
}

function notFound() {
  return () => ui.emptyState({ role: "status", message: ui.html`Not found. ${ui.button({ label: "Go to the inbox", href: "/", variant: "ghost" })}` });
}

const SECURITY_HEADERS = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "cross-origin-opener-policy": "same-origin"
};

export function createApp({ now = () => Date.now() } = {}) {
  return createServer(async (request, response) => {
    const send = (status, type, body) => {
      response.writeHead(status, { ...SECURITY_HEADERS, "content-type": type, "cache-control": "no-store" });
      response.end(request.method === "HEAD" ? undefined : body);
    };
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.setHeader("allow", "GET, HEAD");
        return send(405, "text/plain; charset=utf-8", "Method Not Allowed\n");
      }
      const url = new URL(request.url ?? "/", "http://localhost");
      const asset = ASSETS.get(url.pathname);
      if (asset) return send(200, "text/css; charset=utf-8", await readFile(asset));
      let body;
      let status = 200;
      let title;
      let active = null;
      if (url.pathname === "/") { body = inbox(url.searchParams.get("q") ?? ""); title = "Inbox"; active = "inbox"; }
      else if (url.pathname === "/rules") { body = rules(); title = "Rules"; active = "rules"; }
      else if (url.pathname.startsWith("/m/") && (body = message(decodeURIComponent(url.pathname.slice(3))))) { title = "Message"; active = "inbox"; }
      else { body = notFound(); status = 404; title = "Not found"; }
      return send(status, "text/html; charset=utf-8", String(page({ title, active, body, now: now() })));
    } catch (error) {
      console.error(error);
      return send(500, "text/plain; charset=utf-8", "Internal Server Error\n");
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? "127.0.0.1";
  createApp().listen(port, host, () => console.log(`mailroom example on http://${host}:${port}`));
}
