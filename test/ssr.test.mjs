// U3 — @scshafe/ui/ssr, the server-rendered adapter. Through the public specifier:
//   - marker parity: each helper and its React component, given equivalent props, produce the
//     same element tree (tags, classes, data-sui-* markers, ARIA and other attributes, text),
//     after removing what is React-only by design (the HoverCard tooltip wrapper, the data
//     table's resize handles and inline width styles, the Grid's inline column style — the
//     helper's column class carries the same template);
//   - escaping: hostile strings in every text and attribute position stay text; URL attributes
//     only take http(s), mailto, tel and relative URLs;
//   - CSP: no style attribute, no <script>, no event-handler attribute, ever;
//   - axe (both themes) and keyboard focus over a server-rendered catalog;
//   - the subpath imports nothing but ../format.js (no React).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { installDom } from "./support/dom.mjs";

installDom();
const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const ui = await import("@scshafe/ui");
const ssr = await import("@scshafe/ui/ssr");
const { SUI_THEMES, SUI_THEME_ATTRIBUTE } = await import("@scshafe/ui/tokens");
const { default: axe } = await import("axe-core");

const h = React.createElement;
const noop = () => {};
const STAMP = "2026-09-29T10:00:00Z";

function parse(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
}

const REACT_ONLY_CLASSES = /^sui-grid-(columns|auto-fit)--/;

/** A comparable tree: React-only wrappers/handles removed, attributes sorted, classes as sets. */
function normalize(node) {
  const out = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      if (child.textContent !== "") {
        const last = out.at(-1);
        if (typeof last === "string") out[out.length - 1] = last + child.textContent;
        else out.push(child.textContent);
      }
      continue;
    }
    if (child.nodeType !== 1) continue;
    if (child.matches('.sui-tooltip[data-sui-component="HoverCard"]')) { out.push(...normalize(child)); continue; }
    if (child.matches(".sui-data-table-resize-handle")) continue;
    const attrs = {};
    for (const { name, value } of child.attributes) {
      if (name === "style") continue;
      if (name === "class") {
        const tokens = value.split(/\s+/).filter((token) => token && !REACT_ONLY_CLASSES.test(token));
        if (tokens.length) attrs.class = [...new Set(tokens)].sort().join(" ");
        continue;
      }
      attrs[name] = value;
    }
    out.push({ tag: child.tagName.toLowerCase(), attrs: Object.fromEntries(Object.entries(attrs).sort()), children: normalize(child) });
  }
  return out;
}

const tableColumns = [
  { id: "name", header: "Name", rowHeader: true, render: (row) => row.name },
  { id: "size", header: "Size", align: "right", render: (row) => String(row.size) }
];
const tableRows = [{ id: "a", name: "alpha.txt", size: 12 }, { id: "b", name: "beta.txt", size: 40 }];

// [name, React element, SSR markup]
const PAIRS = [
  ["Stack", h(ui.Stack, { gap: "lg", align: "center", id: "s", "aria-label": "Stack", data: { "data-test": "x" } }, "a"), ssr.stack({ gap: "lg", align: "center", id: "s", "aria-label": "Stack", data: { "data-test": "x" }, children: "a" })],
  ["Inline", h(ui.Inline, { gap: "sm", wrap: true, justify: "between", as: "nav" }, "a"), ssr.inline({ gap: "sm", wrap: true, justify: "between", as: "nav", children: "a" })],
  ["Grid", h(ui.Grid, { gap: "md", rowGap: "lg", columns: { kind: "equal", count: 3 } }, "a"), ssr.grid({ gap: "md", rowGap: "lg", columns: { kind: "equal", count: 3 }, children: "a" })],
  ["Pane", h(ui.Pane, { header: h("h2", null, "Pane"), footer: "footer", padding: "lg" }, "body"), ssr.pane({ header: ssr.html`<h2>Pane</h2>`, footer: "footer", padding: "lg", children: "body" })],
  ["Scroll", h(ui.Scroll, { axis: "both", height: "auto" }, "a"), ssr.scroll({ axis: "both", height: "auto", children: "a" })],
  ["Title", h(ui.Title, { level: 2 }, "Section"), ssr.title({ level: 2, children: "Section" })],
  ["Description", h(ui.Description, { tone: "default" }, "Helper"), ssr.description({ tone: "default", children: "Helper" })],
  ["Label", h(ui.Label, { htmlFor: "x", required: true }, "Name"), ssr.label({ htmlFor: "x", required: true, children: "Name" })],
  ["InputField", h(ui.InputField, { id: "n", label: "Name", value: "Ada", name: "name", placeholder: "Your name", autoComplete: "name", required: true, onChange: noop }), ssr.inputField({ id: "n", label: "Name", value: "Ada", name: "name", placeholder: "Your name", autoComplete: "name", required: true })],
  ["InputField disabled", h(ui.InputField, { id: "e", label: "Email", type: "email", value: "", disabled: true, onChange: noop }), ssr.inputField({ id: "e", label: "Email", type: "email", value: "", disabled: true })],
  ["SelectField", h(ui.SelectField, { id: "k", label: "Kind", field: "kind", value: "b", name: "kind", options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", title: "B" }, { value: "c", label: "Gamma", disabled: true }], onChange: noop }), ssr.selectField({ id: "k", label: "Kind", field: "kind", value: "b", name: "kind", options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", title: "B" }, { value: "c", label: "Gamma", disabled: true }] })],
  ["SelectField empty", h(ui.SelectField, { id: "k2", label: "Kind", value: "", options: [], onChange: noop }), ssr.selectField({ id: "k2", label: "Kind", value: "", options: [] })],
  ["TextAreaField", h(ui.TextAreaField, { id: "t", label: "Note", value: "line one\nline two", rows: 5, onChange: noop }), ssr.textAreaField({ id: "t", label: "Note", value: "line one\nline two", rows: 5 })],
  ["CheckboxField", h(ui.CheckboxField, { id: "c", label: "Notify me", name: "notify", value: "yes", checked: true, required: true, description: "Once an hour.", onChange: noop }), ssr.checkboxField({ id: "c", label: "Notify me", name: "notify", value: "yes", checked: true, required: true, description: "Once an hour." })],
  ["CheckboxField uncontrolled", h(ui.CheckboxField, { id: "c2", label: "Archive", disabled: true, className: "extra", "aria-describedby": "hint" }), ssr.checkboxField({ id: "c2", label: "Archive", disabled: true, className: "extra", attributes: { "aria-describedby": "hint" } })],
  ["Button", h(ui.Button, { label: "Save", variant: "primary" }), ssr.button({ label: "Save", variant: "primary" })],
  ["Button submit", h(ui.Button, { label: "Go", type: "submit", size: "mini", disabled: true, name: "action", value: "go" }), ssr.button({ label: "Go", type: "submit", size: "mini", disabled: true, name: "action", value: "go" })],
  ["Badge", h(ui.Badge, { value: 3, label: "open", tone: "green" }), ssr.badge({ value: 3, label: "open", tone: "green" })],
  ["Badge plain", h(ui.Badge, { value: "draft", tone: "nonsense" }), ssr.badge({ value: "draft", tone: "nonsense" })],
  ["Status", h(ui.Status, { state: "running" }), ssr.status({ state: "running" })],
  ["StatCount", h(ui.StatCount, { state: "failed", count: 2 }), ssr.statCount({ state: "failed", count: 2 })],
  ["Kbd keys", h(ui.Kbd, { keys: ["Ctrl", "K"] }), ssr.kbd({ keys: ["Ctrl", "K"] })],
  ["Kbd", h(ui.Kbd, { ariaLabel: "Escape" }, "Esc"), ssr.kbd({ ariaLabel: "Escape", children: "Esc" })],
  ["ChipList", h(ui.ChipList, { items: [{ label: "infra", status: "running", tooltip: "Infra" }, { label: "ops" }] }), ssr.chipList({ items: [{ label: "infra", status: "running", tooltip: "Infra" }, { label: "ops" }] })],
  ["RecordMeta", h(ui.RecordMeta, { entries: [{ label: "id", value: "r-1" }, null, { label: "by", value: "ada" }] }), ssr.recordMeta({ entries: [{ label: "id", value: "r-1" }, null, { label: "by", value: "ada" }] })],
  ["MetricCard", h(ui.MetricCard, { label: "Open", value: 12, detail: "since Monday" }), ssr.metricCard({ label: "Open", value: 12, detail: "since Monday" })],
  ["EmptyState", h(ui.EmptyState, { message: "Nothing here yet.", role: "status" }), ssr.emptyState({ message: "Nothing here yet.", role: "status" })],
  ["Banner info", h(ui.Banner, { title: "Heads up", text: "Sync runs hourly." }), ssr.banner({ title: "Heads up", text: "Sync runs hourly." })],
  ["Banner ok", h(ui.Banner, { tone: "ok", text: "Saved.", id: "b", className: "extra" }), ssr.banner({ tone: "ok", text: "Saved.", id: "b", className: "extra" })],
  ["Banner warn", h(ui.Banner, { tone: "warn", title: "Endpoint held", actions: h("a", { href: "/resume" }, "Resume") }, h("p", null, "Paused.")), ssr.banner({ tone: "warn", title: "Endpoint held", actions: ssr.html`<a href="/resume">Resume</a>`, children: ssr.html`<p>Paused.</p>` })],
  ["Banner danger", h(ui.Banner, { tone: "danger", title: "Save failed", text: "No answer.", toneLabel: null, role: "status" }), ssr.banner({ tone: "danger", title: "Save failed", text: "No answer.", toneLabel: null, role: "status" })],
  ["Banner unknown tone", h(ui.Banner, { tone: "nonsense", text: "x", role: null, toneLabel: "Note" }), ssr.banner({ tone: "nonsense", text: "x", role: null, toneLabel: "Note" })],
  ["ListRow", h(ui.ListRow, { title: "Nightly", subtitle: "main", status: "running", chips: ["retry_scheduled"], timestamp: STAMP }), ssr.listRow({ title: "Nightly", subtitle: "main", status: "running", chips: ["retry_scheduled"], timestamp: STAMP })],
  ["ListRow li", h(ui.ListRow, { title: "Row", as: "li", titleLevel: 4, actions: h("span", null, "act") }, h("p", null, "detail")), ssr.listRow({ title: "Row", as: "li", titleLevel: 4, actions: ssr.html`<span>act</span>`, children: ssr.html`<p>detail</p>` })],
  ["List", h(ui.List, { title: "Runs", count: 1, description: "Recent runs." }, h(ui.ListRow, { title: "Nightly", subtitle: "main" })), ssr.list({ title: "Runs", count: 1, description: "Recent runs.", children: ssr.listRow({ title: "Nightly", subtitle: "main" }) })],
  ["List empty", h(ui.List, { title: "Runs", empty: { message: "No runs yet." } }), ssr.list({ title: "Runs", empty: { message: "No runs yet." } })],
  ["Panel", h(ui.Panel, null, h(ui.PanelHeader, { title: "Panel", description: "About", aside: "3 items" }), h("p", null, "Body.")), ssr.panel({ children: [ssr.panelHeader({ title: "Panel", description: "About", aside: "3 items" }), ssr.html`<p>Body.</p>`] })],
  ["Tab", h(ui.Tab, { id: "plans", label: "Plans", active: true, badge: 4 }), ssr.tab({ id: "plans", label: "Plans", active: true, badge: 4 })],
  ["Tab disabled", h(ui.Tab, { id: "runs", label: "Runs", disabled: true }), ssr.tab({ id: "runs", label: "Runs", disabled: true })],
  ["TabPanelHeader", h(ui.TabPanelHeader, { title: "Plans", aside: "12 open", statusLabel: "refreshed 2m ago" }), ssr.tabPanelHeader({ title: "Plans", aside: "12 open", statusLabel: "refreshed 2m ago" })],
  ["PinnedDataTable", h(ui.PinnedDataTable, { ariaLabel: "Files", tableId: "files", columns: tableColumns, rows: tableRows, rowKey: (row) => row.id, onColumnWidthSet: noop, onColumnWidthReset: noop }), ssr.dataTable({ ariaLabel: "Files", tableId: "files", columns: tableColumns, rows: tableRows })]
];

for (const [name, element, markup] of PAIRS) {
  test(`marker parity: ${name}`, () => {
    const reactTree = normalize(parse(renderToStaticMarkup(element)));
    const ssrTree = normalize(parse(String(markup)));
    assert.deepEqual(ssrTree, reactTree);
  });
}

test("List empty state shows its message and passes no stray attributes", () => {
  const legacy = renderToStaticMarkup(h(ui.List, { empty: { title: "Empty", description: "Nothing to show yet." } }));
  assert.match(legacy, /<div class="sui-empty-state" data-sui-component="EmptyState">Empty: Nothing to show yet\.<\/div>/);
  assert.doesNotMatch(legacy, /\s(title|description)=/);
  const defaulted = renderToStaticMarkup(h(ui.List, { empty: {} }));
  assert.match(defaulted, />Nothing to show yet\.<\/div>/);
  assert.doesNotMatch(renderToStaticMarkup(h(ui.List, { empty: { message: "No runs." } })), /\s(title|description|message)=/);
});

test("parity covers every server-rendered marker family", () => {
  const markers = new Set(PAIRS.flatMap(([, , markup]) => [...String(markup).matchAll(/data-sui-component="([^"]+)"/g)].map((match) => match[1])));
  for (const marker of ["Stack", "Inline", "Grid", "Pane", "Scroll", "Title", "Description", "Label", "InputField", "SelectField", "TextAreaField", "CheckboxField", "Button", "Badge", "Status", "StatCount", "StatCountValue", "Kbd", "ChipList", "RecordMeta", "MetricCard", "EmptyState", "Banner", "List", "ListRow", "Panel", "PanelHeader", "Tab", "TabPanelHeader", "PinnedDataTable"]) {
    assert.ok(markers.has(marker), marker);
  }
});

test("Grid columns: the class carries the template the React Grid sets inline", () => {
  const css = readFileSync(new URL("../layout.css", import.meta.url), "utf8");
  for (let count = 1; count <= 12; count += 1) {
    const reactStyle = renderToStaticMarkup(h(ui.Grid, { columns: { kind: "equal", count } }, "a")).match(/grid-template-columns:([^"]+)"/)[1];
    assert.match(String(ssr.grid({ columns: { kind: "equal", count } })), new RegExp(`sui-grid-columns--${count}\\b`));
    assert.ok(css.includes(`.sui-grid-columns--${count} { grid-template-columns: ${reactStyle}; }`), `layout.css .sui-grid-columns--${count} = ${reactStyle}`);
  }
  for (const [token, size] of [["xs", "8rem"], ["sm", "12rem"], ["md", "16rem"], ["lg", "20rem"], ["xl", "24rem"]]) {
    const reactStyle = renderToStaticMarkup(h(ui.Grid, { columns: { kind: "autoFit", minSize: size } }, "a")).match(/grid-template-columns:([^"]+)"/)[1];
    assert.match(String(ssr.grid({ columns: { kind: "autoFit", minSize: token } })), new RegExp(`sui-grid-auto-fit--${token}\\b`));
    assert.ok(css.includes(`.sui-grid-auto-fit--${token} { grid-template-columns: ${reactStyle}; }`), `layout.css .sui-grid-auto-fit--${token}`);
  }
  assert.throws(() => ssr.grid({ columns: { kind: "equal", count: 13 } }), /1–12/);
  assert.throws(() => ssr.grid({ columns: { kind: "autoFit", minSize: "100px" } }), /minSize/);
});

test("server-only shapes: link tabs and buttons, nav, shell, workspace, document", () => {
  const link = String(ssr.tab({ id: "inbox", label: "Inbox", href: "/inbox", active: true }));
  assert.match(link, /^<a class="sui-tab sui-tab-active" href="\/inbox" aria-current="page" data-sui-component="Tab" data-sui-tab-id="inbox">/);
  assert.doesNotMatch(String(ssr.tab({ id: "x", label: "X", href: "/x", disabled: true })), /href=/);
  assert.match(String(ssr.tab({ id: "x", label: "X", href: "/x", disabled: true })), /aria-disabled="true"/);
  assert.match(String(ssr.button({ label: "Open", href: "/open", variant: "primary" })), /^<a class="sui-button sui-button-primary" href="\/open" data-sui-component="Button">Open<\/a>$/);
  const nav = ssr.navTabs({ ariaLabel: "Sections", items: [{ id: "a", label: "A", href: "/a", active: true }, { id: "b", label: "B", href: "/b" }] });
  assert.match(String(nav), /^<nav class="sui-nav-tabs" aria-label="Sections" data-sui-component="NavTabs">/);
  assert.equal((String(nav).match(/data-sui-component="Tab"/g) ?? []).length, 2);
  // A string is text, never markup: only SafeHtml composes.
  assert.match(String(ssr.workspace({ tabs: String(nav) })), /&lt;nav class=&quot;sui-nav-tabs&quot;/);
  const shell = String(ssr.appShell({ chrome: ssr.html`<header>h</header>`, contained: true, ariaLabel: "Inbox", children: ssr.workspace({ tabs: nav, children: [ssr.title({ children: "T" }), ssr.fill("body")] }) }));
  assert.match(shell, /^<div class="sui-app-frame" data-sui-component="AppFrame"><header>h<\/header><main class="sui-app-shell sui-app-shell--contained" aria-label="Inbox" data-sui-component="AppShell"><div class="sui-workspace" data-sui-component="Workspace"><nav /);
  assert.match(shell, /<div class="sui-focus-area"><div class="sui-workspace-panel">.*<div class="sui-fill">body<\/div><\/div><\/div><\/div><\/main><\/div>$/);
  const page = String(ssr.documentPage({ title: "Inbox <1>", theme: "dark", stylesheets: ["/assets/tokens.css", "javascript:alert(1)"], body: "hi" }));
  assert.match(page, /^<!doctype html><html lang="en" data-sui-theme="dark"><head><meta charset="utf-8"\/><meta name="viewport" content="width=device-width, initial-scale=1"\/><title>Inbox &lt;1&gt;<\/title><link rel="stylesheet" href="\/assets\/tokens.css"\/><link rel="stylesheet" href="#"\/><\/head><body>hi<\/body><\/html>$/);
  assert.throws(() => ssr.documentPage({ title: "x", lang: 'en" onload="x', body: "" }), /lang/);
  assert.match(String(ssr.listRow({ title: "Open me", href: "/m/1" })), /<h5 [^>]*><a href="\/m\/1" class="sui-list-row-anchor">Open me<\/a><\/h5>/);
  assert.equal(String(ssr.recordMeta({ entries: [] })), "");
  assert.match(String(ssr.list({ title: "Empty", empty: { message: "Nothing yet." } })), /<div class="sui-empty-state" data-sui-component="EmptyState">Nothing yet\.<\/div>/);
  assert.match(String(ssr.dataTable({ ariaLabel: "T", tableId: "t", columns: tableColumns, rows: [], empty: "No files." })), /<td colspan="2"><div class="sui-empty-state" data-sui-component="EmptyState">No files\.<\/div><\/td>/);
});

// ---------------------------------------------------------------------------------------------
// Escaping and URLs

const HOSTILE = `"'><img src=x onerror="alert(1)"><script>alert(2)</script><svg/onload=alert(3)>&amp;`;

function assertInert(markup, where) {
  const fragment = parse(String(markup));
  assert.equal(fragment.querySelector("img, script, svg, iframe, object, embed"), null, `${where}: an injected element`);
  for (const element of fragment.querySelectorAll("*")) {
    for (const { name } of element.attributes) {
      assert.ok(!/^on/i.test(name), `${where}: event-handler attribute ${name} on <${element.tagName.toLowerCase()}>`);
      assert.notEqual(name, "style", `${where}: style attribute`);
    }
  }
  return fragment;
}

test("hostile strings in every text and attribute position stay text", () => {
  const x = HOSTILE;
  const cases = {
    stack: ssr.stack({ id: x, role: x, "aria-label": x, "aria-labelledby": x, "aria-describedby": x, dataSuiComponent: x, data: { "data-x": x }, children: x }),
    pane: ssr.pane({ header: x, footer: x, children: x }),
    title: ssr.title({ children: x }),
    description: ssr.description({ children: x }),
    label: ssr.label({ htmlFor: x, children: x }),
    inputField: ssr.inputField({ id: x, label: x, value: x, name: x, placeholder: x, inputMode: x, autoComplete: x, className: x, attributes: { pattern: x, "data-y": x } }),
    selectField: ssr.selectField({ id: x, label: x, value: x, name: x, field: x, preserveUnknownValue: true, options: [{ value: x, label: x, title: x }] }),
    selectFieldEmpty: ssr.selectField({ id: "e", label: "e", options: [], emptyLabel: x }),
    textAreaField: ssr.textAreaField({ id: x, label: x, value: x, placeholder: x, name: x }),
    checkboxField: ssr.checkboxField({ id: x, label: x, name: x, value: x, description: x, className: x, attributes: { "aria-describedby": x, "data-y": x } }),
    banner: ssr.banner({ title: x, text: x, actions: x, dismissHref: x, dismissLabel: x, toneLabel: x, id: x, className: x, tone: x }),
    bannerChildren: ssr.banner({ children: x, dismissHref: "/" }),
    button: ssr.button({ label: x, name: x, value: x, className: x, "aria-label": x }),
    linkButton: ssr.button({ label: x, href: x }),
    badge: ssr.badge({ value: x, label: x, tone: x, componentName: x }),
    status: ssr.status({ state: x }),
    statCount: ssr.statCount({ state: x, count: x }),
    kbd: ssr.kbd({ keys: [x, x], ariaLabel: x }),
    kbdChildren: ssr.kbd({ children: x, ariaLabel: x }),
    chipList: ssr.chipList({ items: [{ label: x, tooltip: x, status: x }], dataSuiComponent: x }),
    recordMeta: ssr.recordMeta({ entries: [{ label: x, value: x }, { label: x, value: { x } }] }),
    metricCard: ssr.metricCard({ label: x, value: x, detail: x, dataSuiComponent: x }),
    emptyState: ssr.emptyState({ message: x, className: x, componentName: x, role: x }),
    list: ssr.list({ title: x, description: x, count: 1, actions: x, children: x }),
    listRow: ssr.listRow({ title: x, subtitle: x, status: x, chips: [x, { value: x }], media: x, actions: x, className: x, componentName: x, href: x, children: x }),
    panel: ssr.panel({ className: x, componentName: x, "aria-label": x, children: x }),
    panelHeader: ssr.panelHeader({ title: x, description: x, aside: x, className: x, componentName: x }),
    tab: ssr.tab({ id: x, label: x, badge: x }),
    linkTab: ssr.tab({ id: x, label: x, badge: x, href: x }),
    navTabs: ssr.navTabs({ ariaLabel: x, items: [{ id: x, label: x, href: x }] }),
    tabPanelHeader: ssr.tabPanelHeader({ title: x, aside: x, statusLabel: x, leading: x, actions: x, className: x, dataSuiComponent: x }),
    dataTable: ssr.dataTable({ ariaLabel: x, tableId: x, columns: [{ id: x, header: x, render: () => x }], rows: [{}] }),
    appShell: ssr.appShell({ chrome: x, ariaLabel: x, children: x }),
    workspace: ssr.workspace({ tabs: x, children: ssr.fill(x) }),
    documentPage: ssr.documentPage({ title: x, stylesheets: [x], body: x }),
    template: ssr.html`<p title="${x}">${x}${[x, 1, null, false]}</p>`
  };
  for (const [where, markup] of Object.entries(cases)) {
    const fragment = assertInert(markup, where);
    const text = fragment.textContent + [...fragment.querySelectorAll("*")].flatMap((element) => [...element.attributes].map((attribute) => attribute.value)).join("");
    if (!["linkButton", "documentPage"].includes(where)) assert.ok(text.includes(x), `${where}: the hostile string survives as text or attribute value`);
  }
});

test("URL attributes take http(s), mailto, tel and relative URLs only", () => {
  const href = (url) => parse(String(ssr.button({ label: "x", href: url }))).querySelector("a").getAttribute("href");
  for (const url of ["https://example.test/a?b=c#d", "http://example.test", "mailto:ada@example.test", "tel:+15555550100", "/inbox", "./x", "../y", "?q=1", "#top", "inbox/item:1", "/a:b", "//cdn.example.test/x"]) {
    assert.equal(href(url), url, url);
  }
  for (const url of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "\u0001javascript:alert(1)", "java\tscript:alert(1)", "java\nscript:alert(1)", "javascript\r:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox", "file:///etc/passwd", "blob:https://x/y", "x:y"]) {
    assert.equal(href(url), "#", JSON.stringify(url));
  }
  assert.equal(ssr.safeUrl("  https://example.test/  "), "https://example.test/");
  // An entity in the attribute cannot spell a scheme: & is escaped.
  assert.equal(href("javascript&colon;alert(1)"), "javascript&colon;alert(1)");
  assert.match(String(ssr.button({ label: "x", href: "javascript&colon;alert(1)" })), /href="javascript&amp;colon;alert\(1\)"/);
});

test("html``, trustedHtml, join and attrs", () => {
  assert.equal(String(ssr.html`<b>${"<i>"}</b>${ssr.html`<i>ok</i>`}${42}${null}${undefined}${false}${["a", "<", ssr.trustedHtml("<br/>")]}`), "<b>&lt;i&gt;</b><i>ok</i>42a&lt;<br/>");
  assert.equal(String(ssr.join(["a", "<b>", null, ""], ", ")), "a, &lt;b&gt;");
  assert.throws(() => new ssr.SafeHtml("<x>", Symbol("forged")), /SafeHtml/);
  assert.throws(() => ssr.renderContent({ toString: () => "<script>" }), /objects are not content/);
  assert.equal(ssr.SafeHtml.is(ssr.html`x`), true);
  assert.equal(ssr.SafeHtml.is({ toString: () => "x" }), false);
  assert.equal(ssr.attrs({ title: 'a"b', hidden: true, open: false, rows: 3, gone: null }), ' title="a&quot;b" hidden="" rows="3"');
  for (const name of ["onclick", "onError", "style", "srcdoc", 'x"y', "x y", "", "1a"]) {
    assert.throws(() => ssr.attrs({ [name]: "v" }), /refused|invalid/, name);
  }
  assert.throws(() => ssr.inputField({ id: "a", label: "a", attributes: { onfocus: "x" } }), /event-handler/);
  assert.throws(() => ssr.button({ label: "a", attributes: { style: "color:red" } }), /style/);
  assert.throws(() => ssr.stack({ data: { onclick: "x" } }), /data attribute/);
  assert.throws(() => ssr.stack({ as: "script" }), /as must be/);
  assert.throws(() => ssr.stack({ gap: "huge" }), /gap must be/);
  assert.throws(() => ssr.inputField({ id: "a", label: "a", type: "image" }), /type must be/);
  assert.throws(() => ssr.title({ level: 7 }), /1–6/);
  assert.equal(ssr.escapeHtml(`<&>"'`), "&lt;&amp;&gt;&quot;&#39;");
});

test("html`` is context-aware: URL attributes are checked, unsafe positions refused", () => {
  const evil = "javascript:alert(1)";
  // A '>' inside an earlier quoted value does not end the tag: href is still a URL context.
  assert.equal(String(ssr.html`<a title="x>y" href="${evil}">t</a>`), '<a title="x>y" href="#">t</a>');
  assert.equal(String(ssr.html`<a href='${"JaVaScRiPt:x"}'>t</a>`), "<a href='#'>t</a>");
  assert.equal(String(ssr.html`<form action="${evil}"><button formaction="${"data:x"}">b</button></form>`), '<form action="#"><button formaction="#">b</button></form>');
  assert.equal(String(ssr.html`<a href="${"/ok?a=1&b=2"}">t</a>`), '<a href="/ok?a=1&amp;b=2">t</a>');
  assert.equal(String(ssr.html`<p title="${"a\"b"}" data-x='${"c'd"}'>${"<x>"}</p>`), '<p title="a&quot;b" data-x=\'c&#39;d\'>&lt;x&gt;</p>');
  assert.equal(String(ssr.html`<textarea>${"</textarea><script>"}</textarea><title>${"</title>"}</title>`), "<textarea>&lt;/textarea&gt;&lt;script&gt;</textarea><title>&lt;/title&gt;</title>");
  assert.equal(String(ssr.html`<script src="/a.js"></script><p>${"<x>"}</p>`), '<script src="/a.js"></script><p>&lt;x&gt;</p>');
  assert.equal(String(ssr.html`<p>1 < 2 and 3 > 2: ${"<b>"}</p>`), "<p>1 < 2 and 3 > 2: &lt;b&gt;</p>");
  const refused = [
    [() => ssr.html`<${"script"}>`, /tag name/],
    [() => ssr.html`</${"p"}>`, /tag name/],
    [() => ssr.html`<p${"x"}>`, /tag name/],
    [() => ssr.html`<div ${"onclick=alert(1)"}>`, /inside a tag/],
    [() => ssr.html`<div title=${"x onclick=alert(1)"}>`, /quote attribute values/],
    [() => ssr.html`<div onclick="${"alert(1)"}">`, /onclick/],
    [() => ssr.html`<div ONMOUSEOVER='${"x"}'>`, /onmouseover/],
    [() => ssr.html`<div style="${"color:red"}">`, /style/],
    [() => ssr.html`<iframe srcdoc="${"<script>"}">`, /srcdoc/],
    [() => ssr.html`<script>${"alert(1)"}</script>`, /inside <script>/],
    [() => ssr.html`<style>${"body{}"}</style>`, /inside <style>/],
    [() => ssr.html`<a href="${ssr.html`/x`}">`, /plain string/],
    [() => ssr.html`<p title="${ssr.html`<b>`}">`, /markup cannot go in an attribute/]
  ];
  for (const [render, message] of refused) assert.throws(render, message);
});

// ---------------------------------------------------------------------------------------------
// CSP shape, accessibility, keyboard focus over a server-rendered catalog

const CATALOG = [
  { name: "shell", render: () => ssr.appShell({
    chrome: ssr.navTabs({ ariaLabel: "Sections", items: [{ id: "inbox", label: "Inbox", href: "/", active: true, badge: 3 }, { id: "rules", label: "Rules", href: "/rules" }] }),
    ariaLabel: "Inbox",
    children: ssr.stack({ children: [ssr.title({ level: 1, children: "Inbox" }), ssr.description({ children: "Sorted mail." })] })
  }), focus: "a" },
  { name: "form", render: () => ssr.html`<form action="/search" method="get">${ssr.stack({ children: [
    ssr.inputField({ id: "q", name: "q", label: "Search", value: "invoice", type: "search" }),
    ssr.selectField({ id: "b", name: "bucket", label: "Bucket", value: "jobs", options: [{ value: "jobs", label: "Jobs" }, { value: "otp", label: "OTP" }] }),
    ssr.textAreaField({ id: "n", name: "note", label: "Note" }),
    ssr.checkboxField({ id: "cb", name: "archived", value: "1", label: "Include archived", checked: true, description: "Older than a year." }),
    ssr.label({ htmlFor: "q", children: "Search label" }),
    ssr.button({ label: "Search", type: "submit", variant: "primary" }),
    ssr.button({ label: "Help", href: "/help", variant: "ghost" })
  ] })}</form>`, focus: "input, select, textarea, button, a" },
  { name: "status", render: () => ssr.inline({ wrap: true, children: [ssr.badge({ value: 3, label: "open", tone: "green" }), ssr.status({ state: "failed" }), ssr.statCount({ state: "running", count: 2 }), ssr.kbd({ keys: ["Ctrl", "K"] }), ssr.chipList({ items: [{ label: "infra", status: "running" }] }), ssr.recordMeta({ entries: [{ label: "id", value: "r-1" }] }), ssr.metricCard({ label: "Open", value: 12, detail: "today" })] }) },
  { name: "lists", render: () => ssr.stack({ children: [
    ssr.list({ title: "Runs", count: 2, description: "Recent.", children: [ssr.listRow({ title: "Nightly", subtitle: "main", status: "running", timestamp: STAMP, href: "/runs/1" }), ssr.listRow({ title: "Weekly", chips: ["blocked"] })] }),
    ssr.list({ title: "Nothing", empty: { message: "No runs yet." } }),
    ssr.panel({ children: [ssr.panelHeader({ title: "Panel", aside: "3 items" }), ssr.emptyState({ message: "Empty." })] }),
    ssr.tabPanelHeader({ title: "Plans", aside: "12 open", statusLabel: "refreshed", actions: ssr.button({ label: "Refresh", href: "/plans" }) })
  ] }), focus: "a" },
  { name: "banners", render: () => ssr.stack({ children: [
    ssr.banner({ tone: "info", title: "Heads up", text: "Sync runs hourly." }),
    ssr.banner({ tone: "ok", text: "Saved.", dismissHref: "/?" }),
    ssr.banner({ tone: "warn", title: "Endpoint held", text: "Deliveries are paused.", actions: ssr.button({ label: "Resume", href: "/resume" }), dismissHref: "/" }),
    ssr.banner({ tone: "danger", title: "Save failed", text: "The server did not answer." })
  ] }), focus: "a" },
  { name: "table", render: () => ssr.dataTable({ ariaLabel: "Files", tableId: "files", columns: tableColumns, rows: tableRows }), focus: "[role=region]" },
  { name: "layout", render: () => ssr.grid({ columns: { kind: "autoFit", minSize: "sm" }, children: [ssr.pane({ header: ssr.title({ level: 2, children: "Pane" }), children: ssr.scroll({ children: "Long content" }) }), ssr.pane({ footer: "f", children: "b" })] }) },
  { name: "tabs", render: () => ssr.inline({ children: [ssr.tab({ id: "a", label: "A", active: true }), ssr.tab({ id: "b", label: "B", badge: 2 })] }), focus: "button" }
];

test("no style attribute, <script> or event handler anywhere in the server-rendered catalog", () => {
  for (const entry of CATALOG) {
    const markup = String(entry.render());
    assert.doesNotMatch(markup, /\sstyle=|<script|\son[a-z]+=/i, entry.name);
    assertInert(markup, entry.name);
  }
});

const AXE = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
  rules: { "color-contrast": { enabled: false }, region: { enabled: false }, "landmark-one-main": { enabled: false }, "page-has-heading-one": { enabled: false }, "heading-order": { enabled: false } },
  resultTypes: ["violations"]
};

function mount(markup) {
  const container = document.createElement("div");
  container.innerHTML = String(markup);
  document.body.appendChild(container);
  return container;
}

for (const theme of SUI_THEMES) {
  test(`axe finds no violations in the server-rendered catalog (${theme} theme)`, async () => {
    document.documentElement.setAttribute(SUI_THEME_ATTRIBUTE, theme);
    const violations = [];
    for (const entry of CATALOG) {
      const container = mount(entry.render());
      try {
        const result = await axe.run(container, AXE);
        for (const violation of result.violations) for (const node of violation.nodes) violations.push(`${entry.name}: ${violation.id} ${node.html.slice(0, 100)}`);
      } finally {
        container.remove();
      }
    }
    document.documentElement.removeAttribute(SUI_THEME_ATTRIBUTE);
    assert.deepEqual(violations, []);
  });
}

let generation = 0;
function freshStyle(element) {
  document.documentElement.setAttribute("data-style-generation", String(generation += 1));
  return getComputedStyle(element);
}

test("every focusable server-rendered control takes keyboard focus with a visible ring", () => {
  for (const entry of CATALOG.filter((candidate) => candidate.focus)) {
    const container = mount(entry.render());
    try {
      const targets = [...container.querySelectorAll(entry.focus)].filter((element) => !element.disabled && element.tabIndex >= 0);
      assert.ok(targets.length > 0, `${entry.name} renders ${entry.focus}`);
      for (const element of targets) {
        document.activeElement?.blur();
        document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", code: "Tab", bubbles: true }));
        element.focus();
        assert.equal(document.activeElement, element, `${entry.name}: ${element.outerHTML.slice(0, 80)} takes focus`);
        assert.ok(element.matches(":focus-visible"), `${entry.name}: :focus-visible`);
        const outline = freshStyle(element).getPropertyValue("outline");
        assert.ok(/\b[1-9]\d*(?:\.\d+)?px\b/.test(outline) && /\bsolid\b/.test(outline), `${entry.name}: ${element.outerHTML.slice(0, 80)} outline ${outline}`);
      }
    } finally {
      document.activeElement?.blur();
      container.remove();
    }
  }
});

test("the ssr subpath is import-closed: only ../format.js, and no React in its types", () => {
  const js = readFileSync(new URL("../lib/ssr/index.js", import.meta.url), "utf8");
  const imports = [...js.matchAll(/^\s*(?:import|export)\b[^;]*?from\s+"([^"]+)"/gm)].map((match) => match[1]);
  assert.deepEqual(imports, ["../format.js"]);
  assert.doesNotMatch(js, /\bimport\s*\(/, "no dynamic import");
  const format = readFileSync(new URL("../lib/format.js", import.meta.url), "utf8");
  assert.doesNotMatch(format, /^\s*import\b/m, "format.js imports nothing");
  const types = readFileSync(new URL("../lib/ssr/index.d.ts", import.meta.url), "utf8");
  assert.doesNotMatch(types, /from\s+"|import\(/, "the declarations import nothing");
});
