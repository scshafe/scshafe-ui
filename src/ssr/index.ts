// @scshafe/ui/ssr — the server-rendered adapter (U3). String-template helpers that emit the
// same sui- classes and data-sui-component markers as the React components, so a server-rendered
// app (no React, no client JavaScript) shares layout.css / components.css / tokens.css with the
// React apps. Rules:
//   - every interpolated value is escaped; only SafeHtml (from these helpers, `html`, or the
//     explicit `trustedHtml` escape hatch) passes through unescaped;
//   - URL attributes (href, action, formaction, src) accept http(s), mailto, tel and relative
//     URLs only; anything else renders as "#";
//   - no style attribute and no event-handler attribute is ever emitted (CSP `style-src 'self'`
//     and no inline script); Grid columns are classes here (the React Grid uses a style);
//   - no client JavaScript: hover cards / tooltips, resize handles and icon glyphs are React-only.
// Import-closed: this module imports nothing but ../format.js (itself import-free), so a consumer
// needs no React.

import { relativeTimeLabel, timestamp as timestampLabel, toneByState } from "../format.js";

// ---------------------------------------------------------------------------------------------
// Safe HTML, escaping, attributes

/** Markup that is already safe to emit: produced by these helpers, `html`, or `trustedHtml`. */
export class SafeHtml {
  readonly #value: string;
  constructor(value: string, token: symbol) {
    if (token !== SAFE_TOKEN) throw new TypeError("SafeHtml is created by the @scshafe/ui/ssr helpers, html`` or trustedHtml()");
    this.#value = value;
  }
  toString(): string {
    return this.#value;
  }
  static is(value: unknown): value is SafeHtml {
    return typeof value === "object" && value !== null && #value in value;
  }
}

const SAFE_TOKEN = Symbol("sui-safe-html");
const safe = (value: string): SafeHtml => new SafeHtml(value, SAFE_TOKEN);

/** Anything a helper accepts as content. Strings and numbers are escaped; arrays are joined;
 * null, undefined and booleans render nothing (as in React). */
export type Content = SafeHtml | string | number | bigint | boolean | null | undefined | ReadonlyArray<Content>;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape text for an HTML text node or a double-quoted attribute value. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** Render content to a string: escape text, keep SafeHtml, join arrays. */
export function renderContent(content: Content): string {
  if (content === null || content === undefined || typeof content === "boolean") return "";
  if (SafeHtml.is(content)) return content.toString();
  if (Array.isArray(content)) return content.map((item) => renderContent(item)).join("");
  if (typeof content === "object") throw new TypeError("@scshafe/ui/ssr: objects are not content (pass a string, a number, SafeHtml or an array of them)");
  return escapeHtml(content);
}

// Where a template value lands, from a scan of the template text before it. Escaping makes a
// value safe in text and in a QUOTED attribute value; other contexts are not made safe by
// escaping, so `html` refuses them (and, in URL attributes, also checks the scheme).
type TemplateContext =
  | { kind: "text" }
  | { kind: "raw"; element: string }
  | { kind: "tag-name" }
  | { kind: "tag" }
  | { kind: "unquoted"; attribute: string }
  | { kind: "quoted"; attribute: string };

const URL_TEMPLATE_ATTRIBUTES = new Set(["href", "src", "action", "formaction", "cite", "poster", "ping", "xlink:href"]);

function scanContext(prefix: string): TemplateContext {
  let state: "text" | "tag" | "quoted" | "raw" = "text";
  let quote = "";
  let tagStart = 0;
  let attribute = "";
  let raw = "";
  for (let index = 0; index < prefix.length; index += 1) {
    const char = prefix[index] as string;
    if (state === "raw") {
      if (char === "<" && prefix.slice(index + 1, index + 2 + raw.length).toLowerCase() === `/${raw}`) { state = "tag"; tagStart = index; }
    } else if (state === "text") {
      if (char === "<" && /[a-zA-Z/!?]/.test(prefix[index + 1] ?? "")) { state = "tag"; tagStart = index; }
    } else if (state === "tag") {
      if (char === '"' || char === "'") {
        state = "quoted";
        quote = char;
        attribute = (/([^\s"'=<>/]+)\s*=\s*$/.exec(prefix.slice(tagStart, index))?.[1] ?? "").toLowerCase();
      } else if (char === ">") {
        const opened = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(prefix.slice(tagStart, index))?.[1]?.toLowerCase() ?? "";
        state = opened === "script" || opened === "style" ? "raw" : "text";
        raw = opened;
      }
    } else if (char === quote) {
      state = "tag";
    }
  }
  // A trailing "<" (or "<" + spaces is still text): the value would become the tag name.
  if (state === "text") return prefix.endsWith("<") ? { kind: "tag-name" } : { kind: "text" };
  if (state === "raw") return { kind: "raw", element: raw };
  if (state === "quoted") return { kind: "quoted", attribute };
  const tagText = prefix.slice(tagStart);
  if (/^<\/?[a-zA-Z0-9-]*$/.test(tagText)) return { kind: "tag-name" };
  const unquoted = /([^\s"'=<>/]+)\s*=\s*$/.exec(tagText);
  if (unquoted) return { kind: "unquoted", attribute: (unquoted[1] ?? "").toLowerCase() };
  return { kind: "tag" };
}

function interpolate(prefix: string, value: Content): string {
  const context = scanContext(prefix);
  switch (context.kind) {
    case "text":
      return renderContent(value);
    case "raw":
      throw new TypeError(`@scshafe/ui/ssr html\`\`: no values inside <${context.element}>`);
    case "tag-name":
      throw new TypeError("@scshafe/ui/ssr html``: a value cannot be (part of) a tag name");
    case "tag":
      throw new TypeError("@scshafe/ui/ssr html``: inside a tag, a value goes in a quoted attribute value (use attrs() for whole attributes)");
    case "unquoted":
      throw new TypeError("@scshafe/ui/ssr html``: quote attribute values (attr=\"${…}\")");
    case "quoted":
      if (/^on/.test(context.attribute) || context.attribute === "style" || context.attribute === "srcdoc") {
        throw new TypeError(`@scshafe/ui/ssr html\`\`: no values in the ${context.attribute} attribute`);
      }
      if (URL_TEMPLATE_ATTRIBUTES.has(context.attribute)) {
        if (typeof value !== "string" && typeof value !== "number") throw new TypeError("@scshafe/ui/ssr html``: a URL attribute takes a plain string");
        return escapeHtml(safeUrl(value));
      }
      if (SafeHtml.is(value)) throw new TypeError("@scshafe/ui/ssr html``: markup cannot go in an attribute value");
      return renderContent(value);
  }
}

/** Tagged template: `html\`<p>${name}</p>\`` escapes every value that is not SafeHtml. A value
 * may sit in text or in a quoted attribute value; in href/src/action/formaction/cite/poster/ping
 * it must be a plain string and goes through safeUrl. Refused (throws): a tag name, an unquoted
 * attribute value, a bare position inside a tag, markup in an attribute value, an on*, style or
 * srcdoc attribute, and the inside of <script> or <style>. */
export function html(strings: TemplateStringsArray, ...values: ReadonlyArray<Content>): SafeHtml {
  let out = strings[0] ?? "";
  for (let index = 0; index < values.length; index += 1) {
    out += interpolate(out, values[index]) + (strings[index + 1] ?? "");
  }
  return safe(out);
}

/** The explicit escape hatch: mark a string as safe markup. Only for markup you produced or
 * sanitized yourself; never for user input. */
export function trustedHtml(markup: string): SafeHtml {
  return safe(String(markup));
}

/** Join content items with an optional separator (escaped like content). */
export function join(items: ReadonlyArray<Content>, separator: Content = ""): SafeHtml {
  const sep = renderContent(separator);
  return safe(items.map((item) => renderContent(item)).filter((item) => item !== "").join(sep));
}

const ALLOWED_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

/** A URL safe for href/action/src: http(s), mailto, tel or relative; otherwise "#". */
export function safeUrl(value: unknown): string {
  // What the URL parser does first: strip leading/trailing C0 controls and spaces, drop every
  // tab and newline (so "java\tscript:" is still a javascript: URL).
  const cleaned = String(value ?? "").replace(/^[\u0000- ]+|[\u0000- ]+$/g, "").replace(/[\t\n\r]/g, "");
  const colon = cleaned.indexOf(":");
  if (colon === -1) return cleaned;
  const delimiter = cleaned.search(/[/?#]/);
  if (delimiter !== -1 && delimiter < colon) return cleaned; // a colon in a path, query or fragment
  const scheme = cleaned.slice(0, colon);
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*$/.test(scheme) && ALLOWED_SCHEMES.has(scheme.toLowerCase())) return cleaned;
  return "#";
}

export type AttrValue = string | number | boolean | null | undefined;
export type Attributes = Readonly<Record<string, AttrValue>>;

const URL_ATTRIBUTES = new Set(["href", "action", "formaction", "src", "cite", "poster", "xlink:href"]);
const ATTRIBUTE_NAME = /^[a-z][a-z0-9-]*$/;

function checkAttributeName(name: string): void {
  if (!ATTRIBUTE_NAME.test(name)) throw new TypeError(`@scshafe/ui/ssr: invalid attribute name ${JSON.stringify(name)}`);
  if (name.startsWith("on")) throw new TypeError(`@scshafe/ui/ssr: event-handler attribute ${name} is refused (no inline script)`);
  if (name === "style") throw new TypeError("@scshafe/ui/ssr: the style attribute is refused (CSP style-src 'self'); use classes");
  if (name === "srcdoc") throw new TypeError("@scshafe/ui/ssr: srcdoc is refused");
}

/** Render attributes: ` name="value"` each, escaped; true renders `name=""`, false/null/undefined
 * nothing; URL attributes go through safeUrl; names are checked (no on*, no style). */
export function attrs(record: Attributes): string {
  let out = "";
  for (const [name, value] of Object.entries(record)) {
    checkAttributeName(name);
    if (value === null || value === undefined || value === false) continue;
    if (value === true) { out += ` ${name}=""`; continue; }
    const text = URL_ATTRIBUTES.has(name) ? safeUrl(value) : String(value);
    out += ` ${name}="${escapeHtml(text)}"`;
  }
  return out;
}

function element(tag: string, attributes: Attributes, content?: Content): SafeHtml {
  return safe(`<${tag}${attrs(attributes)}>${renderContent(content)}</${tag}>`);
}

function voidElement(tag: string, attributes: Attributes): SafeHtml {
  return safe(`<${tag}${attrs(attributes)}/>`);
}

function classes(...names: Array<string | false | null | undefined>): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

function oneOf<T extends string>(value: T | undefined, allowed: ReadonlyArray<T>, fallback: T, what: string): T {
  const resolved = value ?? fallback;
  if (!allowed.includes(resolved)) throw new TypeError(`@scshafe/ui/ssr: ${what} must be one of ${allowed.join(", ")} (got ${JSON.stringify(resolved)})`);
  return resolved;
}

/** Extra data-* attributes; keys must be `data-…`. */
export type DataAttributes = Readonly<Record<`data-${string}`, string | number | boolean | undefined>>;

function dataAttributes(data: DataAttributes | undefined): Attributes {
  const out: Record<string, AttrValue> = {};
  for (const [name, value] of Object.entries(data ?? {})) {
    if (!/^data-[a-z0-9-]+$/.test(name)) throw new TypeError(`@scshafe/ui/ssr: data attribute names must match data-[a-z0-9-]+ (got ${JSON.stringify(name)})`);
    out[name] = value === undefined ? undefined : String(value);
  }
  return out;
}

/** Pass-through attributes for form controls and links (name, form, pattern, …); checked like
 * every attribute. Attributes a helper sets itself win. */
export type ExtraAttributes = Attributes;

// ---------------------------------------------------------------------------------------------
// Layout primitives (Stack, Inline, Grid, Pane, Scroll) — same classes as src/layout

export type SpaceToken = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type ClampToken = "2xs" | "xs" | "sm" | "md" | "lg" | "xl";
export type LayoutTag = "div" | "section" | "article" | "header" | "footer" | "main" | "nav" | "aside" | "ul" | "ol" | "li";

const SPACE: ReadonlyArray<SpaceToken> = ["none", "xs", "sm", "md", "lg", "xl", "2xl"];
const CLAMP: ReadonlyArray<ClampToken> = ["2xs", "xs", "sm", "md", "lg", "xl"];
const LAYOUT_TAGS: ReadonlyArray<LayoutTag> = ["div", "section", "article", "header", "footer", "main", "nav", "aside", "ul", "ol", "li"];

export interface BaseLayoutProps {
  children?: Content;
  as?: LayoutTag;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  dataSuiComponent?: string;
  data?: DataAttributes;
}

function layout(props: BaseLayoutProps, defaultTag: LayoutTag, marker: string, className: string): SafeHtml {
  const tag = oneOf(props.as, LAYOUT_TAGS, defaultTag, "as");
  return element(tag, {
    class: className,
    id: props.id,
    role: props.role,
    "aria-label": props["aria-label"],
    "aria-labelledby": props["aria-labelledby"],
    "aria-describedby": props["aria-describedby"],
    "data-sui-component": props.dataSuiComponent ?? marker,
    ...dataAttributes(props.data)
  }, props.children);
}

export interface StackProps extends BaseLayoutProps {
  gap?: SpaceToken;
  align?: "start" | "center" | "end" | "stretch";
  itemHeight?: ClampToken;
}

export function stack(props: StackProps = {}): SafeHtml {
  const gap = oneOf(props.gap, SPACE, "md", "gap");
  const align = oneOf(props.align, ["start", "center", "end", "stretch"], "stretch", "align");
  const itemHeight = props.itemHeight === undefined ? undefined : oneOf(props.itemHeight, CLAMP, "md", "itemHeight");
  return layout(props, "div", "Stack", classes("sui-stack", `sui-stack-gap--${gap}`, `sui-stack-align--${align}`, itemHeight && `sui-stack-item-height--${itemHeight}`));
}

export interface InlineProps extends BaseLayoutProps {
  gap?: SpaceToken;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
}

export function inline(props: InlineProps = {}): SafeHtml {
  const gap = oneOf(props.gap, SPACE, "sm", "gap");
  const align = oneOf(props.align, ["start", "center", "end", "stretch", "baseline"], "center", "align");
  const justify = oneOf(props.justify, ["start", "center", "end", "between", "around", "evenly"], "start", "justify");
  return layout(props, "div", "Inline", classes("sui-inline", `sui-inline-gap--${gap}`, `sui-inline-align--${align}`, `sui-inline-justify--${justify}`, props.wrap && "sui-inline--wrap"));
}

/** Grid columns as classes (layout.css): 1–12 equal columns, or auto-fit with a minimum column
 * width token xs 8rem / sm 12rem / md 16rem / lg 20rem / xl 24rem. */
export type GridColumns =
  | { kind: "equal"; count: number }
  | { kind: "autoFit"; minSize: "xs" | "sm" | "md" | "lg" | "xl" };

export interface GridProps extends BaseLayoutProps {
  columns: GridColumns;
  gap?: SpaceToken;
  rowGap?: SpaceToken;
  columnGap?: SpaceToken;
  rowHeight?: ClampToken;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "stretch";
}

function gridColumnsClass(columns: GridColumns): string {
  if (columns?.kind === "equal") {
    const count = columns.count;
    if (!Number.isInteger(count) || count < 1 || count > 12) throw new TypeError(`@scshafe/ui/ssr: grid columns.count must be an integer 1–12 (got ${count})`);
    return `sui-grid-columns--${count}`;
  }
  if (columns?.kind === "autoFit") return `sui-grid-auto-fit--${oneOf(columns.minSize, ["xs", "sm", "md", "lg", "xl"], "md", "columns.minSize")}`;
  throw new TypeError("@scshafe/ui/ssr: grid columns must be { kind: \"equal\", count } or { kind: \"autoFit\", minSize }");
}

export function grid(props: GridProps): SafeHtml {
  const gap = oneOf(props.gap, SPACE, "md", "gap");
  const rowGap = props.rowGap === undefined ? undefined : oneOf(props.rowGap, SPACE, "md", "rowGap");
  const columnGap = props.columnGap === undefined ? undefined : oneOf(props.columnGap, SPACE, "md", "columnGap");
  const rowHeight = props.rowHeight === undefined ? undefined : oneOf(props.rowHeight, CLAMP, "md", "rowHeight");
  const align = oneOf(props.align, ["start", "center", "end", "stretch"], "stretch", "align");
  const justify = oneOf(props.justify, ["start", "center", "end", "stretch"], "stretch", "justify");
  return layout(props, "div", "Grid", classes(
    "sui-grid",
    rowGap ? `sui-grid-row-gap--${rowGap}` : `sui-grid-gap--${gap}`,
    columnGap ? `sui-grid-col-gap--${columnGap}` : `sui-grid-gap--${gap}`,
    `sui-grid-align--${align}`,
    `sui-grid-justify--${justify}`,
    rowHeight && `sui-grid-row-height--${rowHeight}`,
    gridColumnsClass(props.columns)
  ));
}

export interface PaneProps extends BaseLayoutProps {
  header?: Content;
  footer?: Content;
  bodyScroll?: "auto" | "always" | "never";
  height?: "fill" | "auto";
  padding?: SpaceToken;
}

export function pane(props: PaneProps = {}): SafeHtml {
  const bodyScroll = oneOf(props.bodyScroll, ["auto", "always", "never"], "auto", "bodyScroll");
  const height = oneOf(props.height, ["fill", "auto"], "fill", "height");
  const padding = oneOf(props.padding, SPACE, "md", "padding");
  const body = [
    props.header !== undefined ? element("div", { class: "sui-pane-header" }, props.header) : null,
    element("div", { class: classes("sui-pane-body", `sui-pane-body-scroll--${bodyScroll}`, `sui-pane-body-padding--${padding}`) }, props.children),
    props.footer !== undefined ? element("div", { class: "sui-pane-footer" }, props.footer) : null
  ];
  return layout({ ...props, children: body }, "section", "Pane", classes("sui-pane", `sui-pane-height--${height}`));
}

export interface ScrollProps extends BaseLayoutProps {
  axis?: "y" | "x" | "both";
  height?: "fill" | "auto";
  width?: "fill" | "auto";
}

export function scroll(props: ScrollProps = {}): SafeHtml {
  const axis = oneOf(props.axis, ["y", "x", "both"], "y", "axis");
  const height = oneOf(props.height, ["fill", "auto"], "fill", "height");
  const width = oneOf(props.width, ["fill", "auto"], "fill", "width");
  return layout(props, "div", "Scroll", classes("sui-scroll", `sui-scroll-axis--${axis}`, `sui-scroll-height--${height}`, `sui-scroll-width--${width}`));
}

// ---------------------------------------------------------------------------------------------
// The shell: the workspace frame contract of layout.css, and a whole document

export interface AppShellProps {
  /** Chrome above the shell (a header, the navigation). */
  chrome?: Content;
  children?: Content;
  /** .sui-app-shell--contained: the shell does not scroll; an inner Scroll / .sui-fill does. */
  contained?: boolean;
  /** Label of the <main> landmark the shell renders. */
  ariaLabel?: string;
}

/** .sui-app-frame > chrome + <main class="sui-app-shell">. */
export function appShell(props: AppShellProps = {}): SafeHtml {
  return element("div", { class: "sui-app-frame", "data-sui-component": "AppFrame" }, [
    props.chrome,
    element("main", {
      class: classes("sui-app-shell", props.contained && "sui-app-shell--contained"),
      "aria-label": props.ariaLabel,
      "data-sui-component": "AppShell"
    }, props.children)
  ]);
}

export interface WorkspaceProps {
  /** The tab strip above the focus area (e.g. navTabs). */
  tabs?: Content;
  children?: Content;
}

/** .sui-workspace > tabs + .sui-focus-area > .sui-workspace-panel > children. Mark the one
 * growing child with `fill` or use `scroll`. */
export function workspace(props: WorkspaceProps = {}): SafeHtml {
  return element("div", { class: "sui-workspace", "data-sui-component": "Workspace" }, [
    props.tabs,
    element("div", { class: "sui-focus-area" }, element("div", { class: "sui-workspace-panel" }, props.children))
  ]);
}

/** A .sui-fill block: the one child of a workspace panel that takes the remaining height. */
export function fill(children?: Content): SafeHtml {
  return element("div", { class: "sui-fill" }, children);
}

export interface DocumentProps {
  title: string;
  lang?: string;
  /** Stylesheet URLs, e.g. "/assets/tokens.css", "/assets/layout.css", "/assets/components.css". */
  stylesheets?: ReadonlyArray<string>;
  /** Pin a theme with data-sui-theme; omitted, the stylesheets follow prefers-color-scheme. */
  theme?: "light" | "dark";
  /** Extra <head> markup (SafeHtml only, e.g. `html\`<meta …>\``). */
  head?: SafeHtml;
  body: Content;
}

/** A complete HTML document: doctype, lang, charset, viewport, title, stylesheet links. */
export function documentPage(props: DocumentProps): SafeHtml {
  const theme = props.theme === undefined ? undefined : oneOf(props.theme, ["light", "dark"], "light", "theme");
  const lang = props.lang ?? "en";
  if (!/^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{1,8})*$/.test(lang)) throw new TypeError(`@scshafe/ui/ssr: invalid lang ${JSON.stringify(lang)}`);
  const head = [
    safe('<meta charset="utf-8"/>'),
    safe('<meta name="viewport" content="width=device-width, initial-scale=1"/>'),
    element("title", {}, props.title),
    ...(props.stylesheets ?? []).map((href) => voidElement("link", { rel: "stylesheet", href })),
    props.head ?? null
  ];
  return safe(`<!doctype html>${element("html", { lang, "data-sui-theme": theme }, [element("head", {}, head), element("body", {}, props.body)])}`);
}

// ---------------------------------------------------------------------------------------------
// Navigation: Tab (button, or a link with href), NavTabs

export interface TabProps {
  id: string;
  label: Content;
  active?: boolean;
  disabled?: boolean;
  badge?: Content;
  /** Render a link (<a href>) instead of a button; the server-rendered navigation. */
  href?: string;
}

export function tab(props: TabProps): SafeHtml {
  const active = props.active ?? false;
  const disabled = props.disabled ?? false;
  const body = [
    element("span", { class: "sui-tab-label" }, props.label),
    props.badge !== null && props.badge !== undefined ? element("span", { class: "sui-tab-badge" }, props.badge) : null
  ];
  const className = classes("sui-tab", active && "sui-tab-active");
  if (props.href !== undefined) {
    return element("a", {
      class: className,
      href: disabled ? undefined : props.href,
      "aria-current": active ? "page" : undefined,
      "aria-disabled": disabled ? "true" : undefined,
      "data-sui-component": "Tab",
      "data-sui-tab-id": props.id
    }, body);
  }
  return element("button", {
    type: "button",
    class: className,
    "aria-pressed": active ? "true" : "false",
    "aria-disabled": disabled ? "true" : undefined,
    disabled,
    "data-sui-component": "Tab",
    "data-sui-tab-id": props.id
  }, body);
}

export interface NavTabsProps {
  ariaLabel: string;
  items: ReadonlyArray<TabProps>;
}

/** A <nav> of link tabs (.sui-nav-tabs): the server-rendered tab strip. */
export function navTabs(props: NavTabsProps): SafeHtml {
  return element("nav", { class: "sui-nav-tabs", "aria-label": props.ariaLabel, "data-sui-component": "NavTabs" },
    props.items.map((item) => tab(item)));
}

// ---------------------------------------------------------------------------------------------
// Text and form primitives

export interface TitleProps {
  children?: Content;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function title(props: TitleProps): SafeHtml {
  const level = props.level ?? 3;
  if (![1, 2, 3, 4, 5, 6].includes(level)) throw new TypeError(`@scshafe/ui/ssr: title level must be 1–6 (got ${level})`);
  return element(`h${level}`, { class: `sui-title sui-title-h${level}`, "data-sui-component": "Title", "data-sui-level": level }, props.children);
}

export interface DescriptionProps {
  children?: Content;
  tone?: "default" | "muted";
}

export function description(props: DescriptionProps): SafeHtml {
  const tone = oneOf(props.tone, ["default", "muted"], "muted", "tone");
  return element("p", { class: `sui-description sui-description-${tone}`, "data-sui-component": "Description" }, props.children);
}

export interface LabelProps {
  htmlFor?: string;
  children?: Content;
  required?: boolean;
}

export function label(props: LabelProps): SafeHtml {
  return element("label", { for: props.htmlFor, class: "sui-label", "data-sui-component": "Label" }, [
    props.children,
    props.required ? safe('<span class="sui-label-required" aria-hidden="true"> *</span>') : null
  ]);
}

interface FieldBase {
  id: string;
  /** The field's text label (also its aria-label, as in the React fields). */
  label: string;
  /** The form field name (what a form POST sends). */
  name?: string;
  disabled?: boolean;
  className?: string;
  attributes?: ExtraAttributes;
}

export interface InputFieldProps extends FieldBase {
  value?: string | number;
  type?: string;
  placeholder?: string;
  inputMode?: string;
  autoComplete?: string;
  readOnly?: boolean;
  required?: boolean;
}

const INPUT_TYPES = ["text", "email", "password", "search", "tel", "url", "number", "date", "datetime-local", "time", "month", "week", "hidden", "color", "range"];

export function inputField(props: InputFieldProps): SafeHtml {
  const type = oneOf(props.type, INPUT_TYPES, "text", "type");
  return element("label", { class: classes("sui-input-field", props.className), for: props.id, "data-sui-component": "InputField" }, [
    element("span", { class: "sui-input-field-label" }, [
      props.label,
      props.required ? safe('<span class="sui-input-field-required" aria-hidden="true"> *</span>') : null
    ]),
    voidElement("input", {
      ...props.attributes,
      id: props.id,
      name: props.name,
      type,
      value: String(props.value ?? ""),
      placeholder: props.placeholder,
      inputmode: props.inputMode,
      autocomplete: props.autoComplete,
      disabled: props.disabled ?? false,
      readonly: props.readOnly ?? false,
      required: props.required ?? false,
      "aria-label": props.label
    })
  ]);
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  title?: string;
}

export interface SelectFieldProps extends FieldBase {
  value?: string;
  options: ReadonlyArray<SelectOption>;
  /** data-sui-field, as in the React SelectField. */
  field?: string;
  emptyLabel?: string;
  preserveUnknownValue?: boolean;
}

export function selectField(props: SelectFieldProps): SafeHtml {
  const options = props.options ?? [];
  const value = props.value ?? "";
  const hasValue = options.some((option) => option.value === value);
  const optionTags: Content[] = [];
  if (value && props.preserveUnknownValue && !hasValue) optionTags.push(element("option", { value, selected: true }, value));
  if (options.length === 0) optionTags.push(element("option", { value: "", selected: value === "" }, props.emptyLabel ?? "None"));
  for (const option of options) {
    optionTags.push(element("option", { value: option.value, selected: option.value === value, disabled: option.disabled ?? false, title: option.title }, option.label));
  }
  return element("label", { class: classes("sui-select-field", props.className), "data-sui-field": props.field, for: props.id, "data-sui-component": "SelectField" }, [
    element("span", {}, props.label),
    element("select", {
      ...props.attributes,
      id: props.id,
      name: props.name,
      disabled: (props.disabled ?? false) || options.length === 0,
      "aria-label": props.label
    }, optionTags)
  ]);
}

export interface TextAreaFieldProps extends FieldBase {
  value?: string;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  required?: boolean;
}

export function textAreaField(props: TextAreaFieldProps): SafeHtml {
  const value = String(props.value ?? "");
  const rows = props.rows ?? 3;
  if (!Number.isInteger(rows) || rows < 1) throw new TypeError(`@scshafe/ui/ssr: rows must be a positive integer (got ${rows})`);
  return element("label", { class: classes("sui-text-area-field", props.className), for: props.id, "data-sui-component": "TextAreaField" }, [
    element("span", { class: "sui-visually-hidden" }, props.label),
    // The HTML parser drops one leading newline in a textarea; keep the value's own.
    element("textarea", {
      ...props.attributes,
      id: props.id,
      name: props.name,
      placeholder: props.placeholder,
      rows,
      disabled: props.disabled ?? false,
      readonly: props.readOnly ?? false,
      required: props.required ?? false,
      "aria-label": props.label
    }, (value.startsWith("\n") ? "\n" : "") + value)
  ]);
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps {
  label?: Content;
  children?: Content;
  variant?: ButtonVariant;
  size?: "mini";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  /** Render a link styled as a button (<a href>); type/name/value do not apply. */
  href?: string;
  "aria-label"?: string;
  attributes?: ExtraAttributes;
}

export function button(props: ButtonProps = {}): SafeHtml {
  const variant = oneOf(props.variant, ["primary", "secondary", "ghost", "danger"], "secondary", "variant");
  const className = classes("sui-button", `sui-button-${variant}`, props.size === "mini" && "sui-button-mini", props.className);
  const content = props.children ?? props.label;
  if (props.href !== undefined) {
    return element("a", {
      ...props.attributes,
      class: className,
      href: props.disabled ? undefined : props.href,
      "aria-disabled": props.disabled ? "true" : undefined,
      "aria-label": props["aria-label"],
      "data-sui-component": "Button"
    }, content);
  }
  return element("button", {
    ...props.attributes,
    type: oneOf(props.type, ["button", "submit", "reset"], "button", "type"),
    class: className,
    name: props.name,
    value: props.value,
    disabled: props.disabled ?? false,
    "aria-label": props["aria-label"],
    "data-sui-component": "Button"
  }, content);
}

// ---------------------------------------------------------------------------------------------
// Status: Badge, Status, StatCount, Kbd, ChipList, RecordMeta, MetricCard

export type StatusTone = "blue" | "green" | "yellow" | "orange" | "red" | "purple";
const TONES: ReadonlyArray<StatusTone> = ["blue", "green", "yellow", "orange", "red", "purple"];

function normalizeTone(tone: unknown): StatusTone {
  const value = String(tone ?? "blue").toLowerCase() as StatusTone;
  return TONES.includes(value) ? value : "blue";
}

export interface BadgeProps {
  value: string | number;
  label?: string | null;
  tone?: StatusTone | string;
  emphasis?: boolean | null;
  componentName?: string;
}

export function badge(props: BadgeProps): SafeHtml {
  const tone = normalizeTone(props.tone);
  const text = String(props.value ?? "");
  const showLabel = typeof props.label === "string" && props.label.length > 0;
  const strong = props.emphasis ?? showLabel;
  return element("span", { class: `sui-badge sui-badge--${tone}`, "data-sui-component": props.componentName ?? "Badge", "data-sui-tone": tone }, [
    strong ? element("strong", {}, text) : text,
    showLabel ? [" ", element("span", { class: "sui-badge-label" }, props.label)] : null
  ]);
}

export interface StatusProps {
  state: string;
}

/** Workflow-state badge, tone from the shared toneByState table. */
export function status(props: StatusProps): SafeHtml {
  const state = String(props.state ?? "");
  return badge({ value: state, tone: toneByState.get(state) ?? "blue", componentName: "Status" });
}

export interface StatCountProps {
  state: string;
  count: number | string;
}

export function statCount(props: StatCountProps): SafeHtml {
  return element("span", { class: "sui-stat-count", "data-sui-component": "StatCount" }, [
    status({ state: props.state }),
    badge({ value: props.count, componentName: "StatCountValue" })
  ]);
}

export interface KbdProps {
  children?: Content;
  keys?: ReadonlyArray<string>;
  ariaLabel?: string;
}

export function kbd(props: KbdProps): SafeHtml {
  if (props.keys && props.keys.length > 0) {
    return element("span", { class: "sui-kbd-combo", "data-sui-component": "Kbd", role: "group", "aria-label": props.ariaLabel ?? props.keys.join(" + ") },
      props.keys.map((key) => element("kbd", { class: "sui-kbd" }, key)));
  }
  return element("kbd", { class: "sui-kbd", "data-sui-component": "Kbd", role: props.ariaLabel ? "img" : undefined, "aria-label": props.ariaLabel }, props.children);
}

export interface ChipListItem {
  label: string;
  tooltip?: string;
  status?: string;
}

export interface ChipListProps {
  items: ReadonlyArray<ChipListItem>;
  dataSuiComponent?: string;
}

export function chipList(props: ChipListProps): SafeHtml {
  return inline({
    wrap: true,
    gap: "xs",
    dataSuiComponent: props.dataSuiComponent ?? "ChipList",
    children: props.items.map((item) => element("code", {
      class: "sui-chip",
      "data-sui-chip-tone": item.status ? toneByState.get(item.status) : undefined,
      title: item.tooltip
    }, item.label))
  });
}

export interface RecordMetaEntry {
  label: string;
  value: unknown;
}

export interface RecordMetaProps {
  entries: ReadonlyArray<RecordMetaEntry | null | undefined | false>;
}

/** Provenance pills; renders nothing for no entries (as the React RecordMeta). */
export function recordMeta(props: RecordMetaProps): SafeHtml {
  const entries = (props.entries ?? []).filter((entry): entry is RecordMetaEntry => Boolean(entry));
  if (entries.length === 0) return safe("");
  return element("div", { class: "sui-record-meta", "data-sui-component": "RecordMeta", role: "group", "aria-label": "Record provenance" },
    entries.map((entry) => element("span", { class: "sui-record-meta-pill" }, [
      element("span", {}, entry.label),
      typeof entry.value === "object" && entry.value !== null ? JSON.stringify(entry.value) : String(entry.value ?? "")
    ])));
}

export interface MetricCardProps {
  label: Content;
  value: Content;
  detail?: Content;
  dataSuiComponent?: string;
}

export function metricCard(props: MetricCardProps): SafeHtml {
  return element("article", { class: "sui-metric-card", "data-sui-component": props.dataSuiComponent ?? "MetricCard" }, [
    element("span", {}, props.label),
    element("strong", {}, props.value),
    props.detail ? element("small", {}, props.detail) : null
  ]);
}

// ---------------------------------------------------------------------------------------------
// Empty state, lists, panels, the tab panel header, the data table

export interface EmptyStateProps {
  message?: Content;
  children?: Content;
  className?: string;
  componentName?: string;
  role?: string;
}

export function emptyState(props: EmptyStateProps = {}): SafeHtml {
  return element("div", {
    class: classes("sui-empty-state", props.className),
    "data-sui-component": props.componentName ?? "EmptyState",
    role: props.role
  }, props.children ?? props.message);
}

function hasContent(content: Content): boolean {
  return renderContent(content) !== "";
}

export interface ListProps {
  title?: string | null;
  description?: Content;
  count?: number | null;
  /** Shown when there are no rows. */
  empty?: { message: Content } | null;
  actions?: Content;
  children?: Content;
}

export function list(props: ListProps): SafeHtml {
  const header = props.title || props.actions
    ? element("header", { class: "sui-list-header" }, [
      element("div", { class: "sui-list-heading" }, [
        props.title ? title({ level: 4, children: props.count !== null && props.count !== undefined ? `${props.title} (${props.count})` : props.title }) : null,
        props.description ? description({ children: props.description }) : null
      ]),
      props.actions ? element("div", { class: "sui-list-actions" }, props.actions) : null
    ])
    : null;
  const body = hasContent(props.children ?? null)
    ? element("div", { class: "sui-list-items" }, props.children)
    : props.empty ? emptyState({ message: props.empty.message }) : null;
  return element("section", { class: "sui-list", "data-sui-component": "List" }, [header, body]);
}

export interface ListRowChip {
  value: string;
}

export interface ListRowProps {
  title: Content;
  subtitle?: Content;
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  status?: string | null;
  timestamp?: string | number | Date | null;
  /** The reference time for the relative label (default: now). */
  now?: string | number | Date;
  chips?: ReadonlyArray<string | ListRowChip>;
  media?: Content;
  actions?: Content;
  children?: Content;
  className?: string;
  componentName?: string;
  as?: "div" | "li" | "article" | "section";
  /** Link the row's title (the server-rendered way to open a row). */
  href?: string;
}

export function listRow(props: ListRowProps): SafeHtml {
  const tag = oneOf(props.as, ["div", "li", "article", "section"], "div", "as");
  const chips = props.chips ?? [];
  const hasAside = chips.length > 0 || Boolean(props.actions) || Boolean(props.status) || Boolean(props.timestamp);
  const heading = props.href !== undefined ? element("a", { href: props.href, class: "sui-list-row-anchor" }, props.title) : props.title;
  const aside = hasAside ? element("div", { class: "sui-list-row-aside" }, [
    props.timestamp ? element("small", { class: "sui-card-timestamp", title: timestampLabel(props.timestamp) }, relativeTimeLabel(props.timestamp, props.now ?? Date.now())) : null,
    props.status ? element("span", { class: "sui-card-status" }, status({ state: props.status })) : null,
    chips.length ? element("div", { class: "sui-list-row-chips" }, chips.map((chip) => status({ state: typeof chip === "string" ? chip : chip.value }))) : null,
    props.actions ? element("div", { class: "sui-list-row-actions" }, props.actions) : null
  ]) : null;
  return element(tag, { class: classes("sui-list-row", props.className), "data-sui-component": props.componentName ?? "ListRow" }, [
    element("div", { class: "sui-list-row-top" }, [
      props.media ? element("div", { class: "sui-list-row-media" }, props.media) : null,
      element("div", { class: "sui-list-row-content" }, [
        title({ level: props.titleLevel ?? 5, children: heading }),
        props.subtitle ? description({ children: props.subtitle }) : null
      ]),
      aside
    ]),
    props.children
  ]);
}

export interface PanelProps {
  children?: Content;
  className?: string;
  componentName?: string;
  as?: "section" | "div" | "article" | "aside";
  "aria-label"?: string;
}

export function panel(props: PanelProps = {}): SafeHtml {
  const tag = oneOf(props.as, ["section", "div", "article", "aside"], "section", "as");
  return element(tag, { class: classes("sui-panel", props.className), "data-sui-component": props.componentName ?? "Panel", "aria-label": props["aria-label"] }, props.children);
}

export interface PanelHeaderProps {
  title: Content;
  description?: Content;
  aside?: Content;
  children?: Content;
  className?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  componentName?: string;
}

export function panelHeader(props: PanelHeaderProps): SafeHtml {
  return element("div", { class: classes("sui-panel-header", props.className), "data-sui-component": props.componentName ?? "PanelHeader" }, [
    element("div", {}, [
      title({ level: props.headingLevel ?? 2, children: props.title }),
      props.description ? description({ children: props.description }) : null
    ]),
    props.children ?? (props.aside ? element("span", {}, props.aside) : null)
  ]);
}

export interface TabPanelHeaderProps {
  title: Content;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  aside?: Content;
  statusLabel?: string | null;
  leading?: Content;
  actions?: Content;
  className?: string;
  dataSuiComponent?: string;
}

/** The panel header row; a server-rendered refresh is a link or a form in `actions`. */
export function tabPanelHeader(props: TabPanelHeaderProps): SafeHtml {
  const level = props.headingLevel ?? 4;
  if (![1, 2, 3, 4, 5, 6].includes(level)) throw new TypeError(`@scshafe/ui/ssr: headingLevel must be 1–6 (got ${level})`);
  return element("div", { class: classes("sui-tab-panel-header", props.className), "data-sui-component": props.dataSuiComponent ?? "TabPanelHeader" }, [
    element("div", { class: "sui-tab-panel-title-group" }, [
      props.leading,
      element(`h${level}`, {}, props.title),
      props.aside ? element("span", { class: "sui-tab-panel-aside" }, props.aside) : null
    ]),
    element("div", { class: "sui-tab-panel-actions" }, [
      props.statusLabel ? element("span", { class: "sui-tab-panel-status", role: "status" }, props.statusLabel) : null,
      props.actions
    ])
  ]);
}

export interface DataTableColumn<Row> {
  id: string;
  header: Content;
  align?: "left" | "center" | "right";
  /** Render this column's cells as row headers (<th scope="row">). */
  rowHeader?: boolean;
  render: (row: Row) => Content;
}

export interface DataTableProps<Row> {
  ariaLabel: string;
  tableId: string;
  columns: ReadonlyArray<DataTableColumn<Row>>;
  rows: ReadonlyArray<Row>;
  empty?: Content;
}

/** The PinnedDataTable markup as a static table: same classes and markers, no column resize
 * handles and no width styles (both need client JavaScript / inline styles). */
export function dataTable<Row>(props: DataTableProps<Row>): SafeHtml {
  const head = element("thead", {}, element("tr", {}, props.columns.map((column) => element("th", {
    scope: "col",
    "data-sui-column-id": column.id,
    "data-sui-align": column.align && column.align !== "left" ? column.align : undefined
  }, element("span", { class: "sui-data-table-header-cell" }, element("span", { class: "sui-data-table-cell-content" }, column.header))))));
  const rows = props.rows.length === 0 && props.empty !== undefined
    ? [element("tr", {}, element("td", { colspan: props.columns.length }, emptyState({ message: props.empty })))]
    : props.rows.map((row) => element("tr", {}, props.columns.map((column) => element(column.rowHeader ? "th" : "td", {
      scope: column.rowHeader ? "row" : undefined,
      "data-sui-column-id": column.id,
      "data-sui-align": column.align && column.align !== "left" ? column.align : undefined
    }, element("span", { class: "sui-data-table-cell-content" }, column.render(row))))));
  return element("div", { class: "sui-data-table-scroll", "data-sui-component": "PinnedDataTable", role: "region", "aria-label": props.ariaLabel, tabindex: 0 },
    element("table", { class: "sui-data-table", "data-sui-table-id": props.tableId }, [head, element("tbody", {}, rows)]));
}
