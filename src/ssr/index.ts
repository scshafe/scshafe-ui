// @scshafe/ui/ssr — the server-rendered adapter (U3). String-template helpers that emit the
// same sui- classes and data-sui-component markers as the React components, so a server-rendered
// app (no React, no client JavaScript) shares layout.css / components.css / tokens.css with the
// React apps. Rules:
//   - every interpolated value is escaped; only SafeHtml (from these helpers, `html`, or the
//     explicit `trustedHtml` escape hatch) passes through unescaped;
//   - URL attributes (href, src, action, srcset, …) accept http(s), mailto, tel and relative
//     URLs only, and no protocol-relative "//host" unless asked; anything else renders as "#";
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

// ---------------------------------------------------------------------------------------------
// URLs

const ALLOWED_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

// One list for `html` and attrs(): the attributes that hold a URL, and those that hold several
// (srcset, with its width or density descriptors, and ping). The content of a
// <meta http-equiv="refresh"> holds one too ("5; url=/next").
const URL_ATTRIBUTES = new Set(["href", "src", "action", "formaction", "cite", "poster", "data", "background", "longdesc", "manifest", "codebase", "xlink:href"]);
const URL_LIST_ATTRIBUTES = new Set(["srcset", "ping"]);

type UrlKind = "url" | "list" | "refresh";

// What a refused value becomes: a dead link, or no URL at all.
const REFUSED_URL_VALUE: Record<UrlKind, string> = { url: "#", list: "", refresh: "" };

export interface SafeUrlOptions {
  /** Accept a protocol-relative URL ("//host/path", also spelled with backslashes), which leaves
   * the page's origin. Off by default: a value meant as a path must not name another host. */
  allowProtocolRelative?: boolean;
}

function checkedUrl(value: unknown, { allowProtocolRelative = false }: SafeUrlOptions = {}): string | null {
  // What the URL parser does first: strip leading/trailing C0 controls and spaces, drop every
  // tab and newline (so "java\tscript:" is still a javascript: URL).
  const cleaned = String(value ?? "").replace(/^[\u0000- ]+|[\u0000- ]+$/g, "").replace(/[\t\n\r]/g, "");
  // Browsers read a backslash as a slash in http(s) URLs, so two of either start a host.
  if (!allowProtocolRelative && /^[/\\]{2}/.test(cleaned)) return null;
  const colon = cleaned.indexOf(":");
  if (colon === -1) return cleaned;
  const delimiter = cleaned.search(/[/?#]/);
  if (delimiter !== -1 && delimiter < colon) return cleaned; // a colon in a path, query or fragment
  const scheme = cleaned.slice(0, colon);
  return /^[a-zA-Z][a-zA-Z0-9+.-]*$/.test(scheme) && ALLOWED_SCHEMES.has(scheme.toLowerCase()) ? cleaned : null;
}

/** A URL safe for href/action/src: http(s), mailto, tel or relative; otherwise "#". A
 * protocol-relative URL ("//host", or with backslashes) is refused unless allowProtocolRelative. */
export function safeUrl(value: unknown, options: SafeUrlOptions = {}): string {
  return checkedUrl(value, options) ?? "#";
}

// The URL a refresh declaration ("5; url=/next", "0;URL='/next'") navigates to, as browsers
// read it: both the text after the delay and, when it is quoted, the text inside the quotes.
function refreshTargets(content: string): string[] {
  const rest = content.replace(/^[\t\n\f\r ]*[0-9.]*[\t\n\f\r ]*[;,]?[\t\n\f\r ]*/, "").replace(/^url[\t\n\f\r ]*=[\t\n\f\r ]*/i, "");
  const quote = rest[0];
  if (quote !== '"' && quote !== "'") return [rest];
  const end = rest.indexOf(quote, 1);
  return [rest, end === -1 ? rest.slice(1) : rest.slice(1, end)];
}

function urlKind(name: string, refresh: boolean): UrlKind | null {
  if (URL_ATTRIBUTES.has(name)) return "url";
  if (URL_LIST_ATTRIBUTES.has(name)) return "list";
  return name === "content" && refresh ? "refresh" : null;
}

function urlValueAllowed(kind: UrlKind, value: string): boolean {
  const candidates = kind === "url" ? [value] : kind === "list" ? value.split(/[\s,]+/).filter(Boolean) : refreshTargets(value).filter(Boolean);
  return candidates.every((candidate) => checkedUrl(candidate) !== null);
}

const isRefresh = (value: unknown): boolean => typeof value === "string" && value.trim().toLowerCase() === "refresh";

// ---------------------------------------------------------------------------------------------
// html``: where each value lands
//
// The template text is tokenized as a browser tokenizes HTML: text; comments and declarations;
// tags with their attribute names and quoted or unquoted values; the raw text of <script>,
// <style> and the other raw-text elements; and the text of <textarea> and <title>. Escaping
// makes a value safe in text and in a QUOTED attribute value, so those are the only places a
// value may go; every other place throws. A URL-bearing attribute is checked once its tag is
// complete, as the browser will read it: its template text (character references decoded) with
// the values in place, so values cannot spell a scheme or a protocol-relative URL between them
// or with the text around them. Markup inside <svg> and <math> is tokenized by other rules, so
// no value may follow an inline <svg> or <math> start tag in the same template (interpolate the
// drawing as its own html`` instead). A template must end as text: not inside a tag, a comment,
// raw text or an open <svg> or <math>, so its result can be placed in another template.

const RAW_TEXT_ELEMENTS = new Set(["script", "style", "xmp", "iframe", "noembed", "noframes", "noscript", "plaintext"]);
const ESCAPABLE_RAW_TEXT_ELEMENTS = new Set(["textarea", "title"]);
const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
// HTML start tags that end <svg> or <math> content (the "breakout" tags of the HTML parser).
const FOREIGN_BREAKOUT = new Set(["b", "big", "blockquote", "body", "br", "center", "code", "dd", "div", "dl", "dt", "em", "embed", "h1", "h2", "h3", "h4", "h5", "h6", "head", "hr", "i", "img", "li", "listing", "menu", "meta", "nobr", "ol", "p", "pre", "ruby", "s", "small", "span", "strong", "strike", "sub", "sup", "table", "tt", "u", "ul", "var"]);
// Elements inside <svg> or <math> whose content is parsed as HTML again.
const HTML_INTEGRATION_POINTS: Record<"svg" | "math", ReadonlySet<string>> = {
  svg: new Set(["foreignobject", "desc", "title"]),
  math: new Set(["mi", "mo", "mn", "ms", "mtext"])
};

// Character references a URL attribute's template text may use around a value. Another named
// reference is refused rather than guessed: some spell ASCII letters or slashes.
const URL_CHARACTER_REFERENCES: Readonly<Record<string, string>> = {
  amp: "&", AMP: "&", lt: "<", LT: "<", gt: ">", GT: ">", quot: '"', QUOT: '"', apos: "'", colon: ":",
  sol: "/", bsol: "\\", Tab: "\t", NewLine: "\n", num: "#", quest: "?", period: ".", excl: "!",
  lpar: "(", rpar: ")", equals: "=", plus: "+", comma: ",", semi: ";", percnt: "%", nbsp: " "
};

function decodeCharacterReferences(text: string, strict: boolean): string {
  return text.replace(/&(?:#([0-9]+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]*));?/g, (match: string, decimal?: string, hex?: string, name?: string) => {
    if (name === undefined) {
      const code = decimal !== undefined ? Number.parseInt(decimal, 10) : Number.parseInt(hex ?? "", 16);
      return code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : "�";
    }
    // Without ";", only legacy references (none of which spells a URL delimiter) decode.
    if (!match.endsWith(";")) return match;
    const decoded = URL_CHARACTER_REFERENCES[name];
    if (decoded !== undefined) return decoded;
    if (strict) throw new TypeError(`@scshafe/ui/ssr html\`\`: the character reference &${name}; cannot be checked in a URL attribute that takes a value`);
    return match;
  });
}

interface TemplateValue {
  /** The value as text, for the URL check; null when it is not a plain string or number. */
  raw: string | null;
  rendered: string;
}

interface TemplateAttribute {
  name: string;
  parts: Array<string | TemplateValue>;
}

interface TemplateTag {
  name: string;
  end: boolean;
  selfClosing: boolean;
  attributes: TemplateAttribute[];
  /** The tag's markup in order: text, and the quoted attribute values to render at its end. */
  chunks: Array<string | TemplateAttribute>;
}

interface ForeignFrame {
  /** "svg" or "math", or an HTML integration point inside them. */
  kind: "svg" | "math" | "html";
  name: string;
  /** HTML elements open inside an integration point; "stuck" once their nesting is unclear. */
  open: string[] | "stuck";
}

type TokenizerState =
  | "data" | "tag-open" | "end-tag-open" | "tag-name" | "before-name" | "name" | "after-name"
  | "before-value" | "double-quoted" | "single-quoted" | "unquoted" | "after-quoted" | "self-closing"
  | "comment-start" | "comment-start-dash" | "comment" | "bogus-comment" | "raw" | "rcdata";

const WHITESPACE = /[\t\n\f ]/;
const LETTER = /[a-zA-Z]/;

class TemplateScanner {
  #out = "";
  #state: TokenizerState = "data";
  #tag: TemplateTag | null = null;
  #attribute: TemplateAttribute | null = null;
  #commentTail = "";
  #rawElement = "";
  #scriptEscape: "none" | "escaped" | "double" = "none";
  #frames: ForeignFrame[] = [];
  #foreignSeen = false;

  text(segment: string): void {
    let index = 0;
    while (index < segment.length) index = this.#step(segment, index);
  }

  value(value: Content): void {
    if (this.#foreignSeen) throw new TypeError("@scshafe/ui/ssr html``: no values inside or after an inline <svg> or <math> (put the drawing in its own html`` and interpolate it)");
    switch (this.#state) {
      case "data":
        this.#out += renderContent(value);
        return;
      case "rcdata":
        if (SafeHtml.is(value)) throw new TypeError(`@scshafe/ui/ssr html\`\`: markup cannot go inside <${this.#rawElement}>`);
        this.#out += renderContent(value);
        return;
      case "raw":
        throw new TypeError(`@scshafe/ui/ssr html\`\`: no values inside <${this.#rawElement}>`);
      case "tag-open":
      case "end-tag-open":
      case "tag-name":
        throw new TypeError("@scshafe/ui/ssr html``: a value cannot be (part of) a tag name");
      case "comment-start":
      case "comment-start-dash":
      case "comment":
      case "bogus-comment":
        throw new TypeError("@scshafe/ui/ssr html``: no values inside an HTML comment or declaration");
      case "before-value":
      case "unquoted":
        throw new TypeError("@scshafe/ui/ssr html``: quote attribute values (attr=\"${…}\")");
      case "double-quoted":
      case "single-quoted":
        this.#attributeValue(value);
        return;
      default:
        throw new TypeError("@scshafe/ui/ssr html``: inside a tag, a value goes in a quoted attribute value (use attrs() for whole attributes)");
    }
  }

  finish(): string {
    const open = this.#state === "data" || this.#state === "tag-open" || this.#state === "end-tag-open"
      ? (this.#frames.length > 0 ? `<${this.#frames[0]?.name}>` : null)
      : this.#state === "raw" || this.#state === "rcdata" ? `<${this.#rawElement}>`
      : this.#state.startsWith("comment") || this.#state === "bogus-comment" ? "a comment" : "a tag";
    if (open) throw new TypeError(`@scshafe/ui/ssr html\`\`: the template ends inside ${open}`);
    // A "<" or "</" at the very end is text.
    if (this.#state !== "data") this.#out += this.#state === "tag-open" ? "&lt;" : "&lt;/";
    return this.#out;
  }

  #attributeValue(value: Content): void {
    const attribute = this.#attribute as TemplateAttribute;
    const name = attribute.name;
    if (/^on/.test(name) || name === "style" || name === "srcdoc") throw new TypeError(`@scshafe/ui/ssr html\`\`: no values in the ${name} attribute`);
    const plain = typeof value === "string" || typeof value === "number";
    const mayHoldUrl = URL_ATTRIBUTES.has(name) || URL_LIST_ATTRIBUTES.has(name) || (name === "content" && this.#tag?.name === "meta");
    if (mayHoldUrl && !plain) throw new TypeError("@scshafe/ui/ssr html``: a URL attribute takes a plain string");
    if (SafeHtml.is(value)) throw new TypeError("@scshafe/ui/ssr html``: markup cannot go in an attribute value");
    attribute.parts.push({ raw: plain ? String(value) : null, rendered: renderContent(value) });
  }

  // One tokenizer step from `index`; returns the index of the next character to read.
  #step(segment: string, index: number): number {
    const char = segment[index] as string;
    const tag = this.#tag;
    switch (this.#state) {
      case "data":
        if (char === "<") this.#state = "tag-open";
        else this.#out += char;
        return index + 1;
      case "tag-open":
        if (char === "!") return this.#markupDeclaration(segment, index + 1);
        if (char === "/") { this.#state = "end-tag-open"; return index + 1; }
        if (LETTER.test(char)) { this.#openTag(false); return index; }
        if (char === "?") { this.#out += "<"; this.#state = "bogus-comment"; return index; }
        this.#out += "<";
        this.#state = "data";
        return index;
      case "end-tag-open":
        if (LETTER.test(char)) { this.#openTag(true); return index; }
        if (char === ">") { this.#out += "</>"; this.#state = "data"; return index + 1; }
        this.#out += "</";
        this.#state = "bogus-comment";
        return index;
      case "tag-name":
        if (WHITESPACE.test(char)) this.#state = "before-name";
        else if (char === "/") this.#state = "self-closing";
        else if (char === ">") { this.#closeTag(); return index + 1; }
        else (tag as TemplateTag).name += char.toLowerCase();
        (tag as TemplateTag).chunks.push(char);
        return index + 1;
      case "before-name":
        if (WHITESPACE.test(char)) { (tag as TemplateTag).chunks.push(char); return index + 1; }
        if (char === "/" || char === ">") { this.#state = "after-name"; return index; }
        this.#startAttribute();
        if (char === "=") { (this.#attribute as TemplateAttribute).name += char; (tag as TemplateTag).chunks.push(char); return index + 1; }
        return index;
      case "name":
        if (WHITESPACE.test(char) || char === "/" || char === ">") { this.#state = "after-name"; return index; }
        (tag as TemplateTag).chunks.push(char);
        if (char === "=") this.#state = "before-value";
        else (this.#attribute as TemplateAttribute).name += char.toLowerCase();
        return index + 1;
      case "after-name":
        if (WHITESPACE.test(char)) { (tag as TemplateTag).chunks.push(char); return index + 1; }
        if (char === "/") { (tag as TemplateTag).chunks.push(char); this.#state = "self-closing"; return index + 1; }
        if (char === "=") { (tag as TemplateTag).chunks.push(char); this.#state = "before-value"; return index + 1; }
        if (char === ">") { this.#closeTag(); return index + 1; }
        this.#startAttribute();
        return index;
      case "before-value":
        if (WHITESPACE.test(char)) { (tag as TemplateTag).chunks.push(char); return index + 1; }
        if (char === '"' || char === "'") {
          (tag as TemplateTag).chunks.push(char, this.#attribute as TemplateAttribute);
          this.#state = char === '"' ? "double-quoted" : "single-quoted";
          return index + 1;
        }
        if (char === ">") { this.#closeTag(); return index + 1; }
        this.#state = "unquoted";
        return index;
      case "double-quoted":
      case "single-quoted":
        if (char === (this.#state === "double-quoted" ? '"' : "'")) {
          (tag as TemplateTag).chunks.push(char);
          this.#state = "after-quoted";
        } else {
          appendText(this.#attribute as TemplateAttribute, char);
        }
        return index + 1;
      case "unquoted":
        if (WHITESPACE.test(char)) { (tag as TemplateTag).chunks.push(char); this.#state = "before-name"; return index + 1; }
        if (char === ">") { this.#closeTag(); return index + 1; }
        (tag as TemplateTag).chunks.push(char);
        appendText(this.#attribute as TemplateAttribute, char);
        return index + 1;
      case "after-quoted":
        if (WHITESPACE.test(char)) { (tag as TemplateTag).chunks.push(char); this.#state = "before-name"; return index + 1; }
        if (char === "/") { (tag as TemplateTag).chunks.push(char); this.#state = "self-closing"; return index + 1; }
        if (char === ">") { this.#closeTag(); return index + 1; }
        this.#state = "before-name";
        return index;
      case "self-closing":
        if (char === ">") { (tag as TemplateTag).selfClosing = true; this.#closeTag(); return index + 1; }
        this.#state = "before-name";
        return index;
      case "comment-start":
        this.#out += char;
        if (char === ">") this.#state = "data";
        else if (char === "-") this.#state = "comment-start-dash";
        else { this.#state = "comment"; this.#commentTail = char; }
        return index + 1;
      case "comment-start-dash":
        this.#out += char;
        if (char === ">") this.#state = "data";
        else { this.#state = "comment"; this.#commentTail = `-${char}`; }
        return index + 1;
      case "comment":
        this.#out += char;
        this.#commentTail = (this.#commentTail + char).slice(-4);
        if (this.#commentTail.endsWith("-->") || this.#commentTail === "--!>") this.#state = "data";
        return index + 1;
      case "bogus-comment":
        this.#out += char;
        if (char === ">") this.#state = "data";
        return index + 1;
      case "raw":
      case "rcdata":
        return this.#rawStep(segment, index);
    }
  }

  // After "<!": a comment, a declaration (<!DOCTYPE …>) or a CDATA section.
  #markupDeclaration(segment: string, index: number): number {
    if (segment.startsWith("[CDATA[", index)) throw new TypeError("@scshafe/ui/ssr html``: no CDATA sections (their end depends on where the parser is)");
    this.#out += "<!";
    if (segment.startsWith("--", index)) {
      this.#out += "--";
      this.#state = "comment-start";
      return index + 2;
    }
    this.#state = "bogus-comment";
    return index;
  }

  // Raw text (<script>, <style>, …) and the text of <textarea> and <title> end only at their own
  // end tag; a <script> also has the escaped states a "<!--" inside it opens.
  #rawStep(segment: string, index: number): number {
    const char = segment[index] as string;
    const name = this.#rawElement;
    const endsHere = (text: string): boolean => {
      if (segment.slice(index, index + text.length).toLowerCase() !== text) return false;
      const next = segment[index + text.length];
      return next !== undefined && (WHITESPACE.test(next) || next === "/" || next === ">");
    };
    if (name === "script") {
      if (this.#scriptEscape === "none" && segment.startsWith("<!--", index)) {
        this.#out += "<!--";
        this.#scriptEscape = "escaped";
        this.#commentTail = "--";
        return index + 4;
      }
      if (this.#scriptEscape !== "none") {
        this.#commentTail = (this.#commentTail + char).slice(-3);
        if (this.#commentTail === "-->") { this.#scriptEscape = "none"; this.#out += char; return index + 1; }
        if (this.#scriptEscape === "escaped" && endsHere("<script")) { this.#scriptEscape = "double"; this.#out += char; return index + 1; }
        if (this.#scriptEscape === "double" && endsHere("</script")) { this.#scriptEscape = "escaped"; this.#out += char; return index + 1; }
      }
    }
    if (name !== "plaintext" && this.#scriptEscape !== "double" && endsHere(`</${name}`)) {
      this.#scriptEscape = "none";
      this.#state = "end-tag-open";
      return index + 2;
    }
    this.#out += char;
    return index + 1;
  }

  #openTag(end: boolean): void {
    this.#tag = { name: "", end, selfClosing: false, attributes: [], chunks: [end ? "</" : "<"] };
    this.#state = "tag-name";
  }

  #startAttribute(): void {
    const attribute: TemplateAttribute = { name: "", parts: [] };
    (this.#tag as TemplateTag).attributes.push(attribute);
    this.#attribute = attribute;
    this.#state = "name";
  }

  #closeTag(): void {
    const tag = this.#tag as TemplateTag;
    tag.chunks.push(">");
    const httpEquiv = tag.attributes.find((attribute) => attribute.name === "http-equiv");
    const refresh = tag.name === "meta" && httpEquiv !== undefined && isRefresh(composedText(httpEquiv, false));
    for (const chunk of tag.chunks) this.#out += typeof chunk === "string" ? chunk : renderAttribute(chunk, refresh);
    this.#tag = null;
    this.#attribute = null;
    this.#state = "data";
    this.#afterTag(tag);
  }

  // What the tag does to the parser: raw text after <script> and its kin, and the <svg> and
  // <math> content where other rules apply.
  #afterTag(tag: TemplateTag): void {
    const frames = this.#frames;
    const top = frames.at(-1);
    const foreign = top !== undefined && top.kind !== "html";
    const name = tag.name;
    if (tag.end) {
      if (top?.kind === "html" && Array.isArray(top.open) && top.open.length > 0) {
        const at = top.open.lastIndexOf(name);
        if (at === top.open.length - 1) top.open.pop();
        else if (at !== -1) top.open = "stuck";
        return;
      }
      if (top?.kind === "html" && top.open === "stuck") return;
      if (foreign && (name === "p" || name === "br")) { this.#leaveForeign(); return; }
      const at = frames.map((frame) => frame.name).lastIndexOf(name);
      if (at !== -1) frames.length = at;
      return;
    }
    if (foreign && (FOREIGN_BREAKOUT.has(name) || (name === "font" && tag.attributes.some((attribute) => ["color", "face", "size"].includes(attribute.name))))) {
      this.#leaveForeign();
    }
    const current = frames.at(-1);
    if (current !== undefined && current.kind !== "html") {
      if (tag.selfClosing) return;
      const encoding = tag.attributes.find((attribute) => attribute.name === "encoding");
      const htmlAnnotation = current.kind === "math" && name === "annotation-xml" && encoding !== undefined && /^(text\/html|application\/xhtml\+xml)$/i.test(composedText(encoding, false));
      if (HTML_INTEGRATION_POINTS[current.kind].has(name) || htmlAnnotation) frames.push({ kind: "html", name, open: [] });
      else if (name === "svg" || name === "math") frames.push({ kind: name, name, open: [] });
      return;
    }
    if (name === "svg" || name === "math") {
      this.#foreignSeen = true;
      if (!tag.selfClosing) frames.push({ kind: name, name, open: [] });
      return;
    }
    if (RAW_TEXT_ELEMENTS.has(name) || ESCAPABLE_RAW_TEXT_ELEMENTS.has(name)) {
      this.#state = RAW_TEXT_ELEMENTS.has(name) ? "raw" : "rcdata";
      this.#rawElement = name;
      return;
    }
    if (current?.kind === "html" && Array.isArray(current.open) && !VOID_ELEMENTS.has(name)) current.open.push(name);
  }

  #leaveForeign(): void {
    const frames = this.#frames;
    while (frames.length > 0 && frames.at(-1)?.kind !== "html") frames.pop();
  }
}

// Template text joins the attribute's last text part, so a character reference is decoded whole.
function appendText(attribute: TemplateAttribute, text: string): void {
  const last = attribute.parts.length - 1;
  if (typeof attribute.parts[last] === "string") attribute.parts[last] += text;
  else attribute.parts.push(text);
}

function composedText(attribute: TemplateAttribute, strict: boolean): string {
  return attribute.parts.map((part) => typeof part === "string" ? decodeCharacterReferences(part, strict) : part.raw ?? "").join("");
}

function renderAttribute(attribute: TemplateAttribute, refresh: boolean): string {
  const hasValue = attribute.parts.some((part) => typeof part !== "string");
  const kind = hasValue ? urlKind(attribute.name, refresh) : null;
  if (kind) {
    if (attribute.parts.some((part) => typeof part !== "string" && part.raw === null)) throw new TypeError("@scshafe/ui/ssr html``: a URL attribute takes a plain string");
    if (!urlValueAllowed(kind, composedText(attribute, true))) return REFUSED_URL_VALUE[kind];
  }
  return attribute.parts.map((part) => typeof part === "string" ? part : part.rendered).join("");
}

/** Tagged template: `html\`<p>${name}</p>\`` escapes every value that is not SafeHtml. A value
 * may sit in text or in a quoted attribute value. In a URL attribute (href, src, action,
 * formaction, cite, poster, data, srcset, ping, …, and the content of a refresh <meta>) it must
 * be a plain string, and the attribute's whole value, template text and values together, must
 * pass safeUrl, or it becomes "#" (srcset, ping, refresh: empty). Refused (throws): a tag name,
 * an unquoted attribute value, a bare position inside a tag, markup in an attribute value, an
 * on*, style or srcdoc attribute, the inside of a comment, <script>, <style> or another
 * raw-text element, anything inside or after an inline <svg> or <math>, a CDATA section, and a
 * template that ends inside a tag, a comment, raw text or an open <svg>/<math>. */
export function html(strings: TemplateStringsArray, ...values: ReadonlyArray<Content>): SafeHtml {
  const scanner = new TemplateScanner();
  for (let index = 0; index < strings.length; index += 1) {
    scanner.text(strings[index] ?? "");
    if (index < values.length) scanner.value(values[index]);
  }
  return safe(scanner.finish());
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

export type AttrValue = string | number | boolean | null | undefined;
export type Attributes = Readonly<Record<string, AttrValue>>;

const ATTRIBUTE_NAME = /^[a-z][a-z0-9-]*$/;

function checkAttributeName(name: string): void {
  if (!ATTRIBUTE_NAME.test(name)) throw new TypeError(`@scshafe/ui/ssr: invalid attribute name ${JSON.stringify(name)}`);
  if (name.startsWith("on")) throw new TypeError(`@scshafe/ui/ssr: event-handler attribute ${name} is refused (no inline script)`);
  if (name === "style") throw new TypeError("@scshafe/ui/ssr: the style attribute is refused (CSP style-src 'self'); use classes");
  if (name === "srcdoc") throw new TypeError("@scshafe/ui/ssr: srcdoc is refused");
}

/** Render attributes: ` name="value"` each, escaped; true renders `name=""`, false/null/undefined
 * nothing; URL attributes go through safeUrl (srcset and ping check every URL, and so does the
 * content of a refresh <meta>, rendered empty when one is refused); names are checked (no on*, no
 * style). */
export function attrs(record: Attributes): string {
  const refresh = isRefresh(record["http-equiv"]);
  let out = "";
  for (const [name, value] of Object.entries(record)) {
    checkAttributeName(name);
    if (value === null || value === undefined || value === false) continue;
    if (value === true) { out += ` ${name}=""`; continue; }
    const kind = urlKind(name, refresh);
    let text = String(value);
    if (kind === "url") text = safeUrl(text);
    else if (kind && !urlValueAllowed(kind, text)) text = REFUSED_URL_VALUE[kind];
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

export interface CheckboxFieldProps {
  id: string;
  /** The visible label; it names the checkbox through `<label for>`. */
  label: Content;
  /** The form field name (a checked box sends name=value; an unchecked one sends nothing). */
  name?: string;
  /** What a checked box sends (the browser default is "on"). */
  value?: string;
  checked?: boolean;
  /** Help text under the label, tied to the checkbox with aria-describedby. */
  description?: Content;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  attributes?: ExtraAttributes;
}

/** A labelled checkbox (the React CheckboxField's markup). */
export function checkboxField(props: CheckboxFieldProps): SafeHtml {
  const descriptionId = hasContent(props.description ?? null) ? `${props.id}-description` : undefined;
  const describedBy = [props.attributes?.["aria-describedby"], descriptionId].filter(Boolean).join(" ") || undefined;
  return element("div", { class: classes("sui-checkbox-field", props.className), "data-sui-component": "CheckboxField" }, [
    voidElement("input", {
      ...props.attributes,
      id: props.id,
      type: "checkbox",
      class: "sui-checkbox-field-input",
      name: props.name,
      value: props.value,
      checked: props.checked ?? false,
      disabled: props.disabled ?? false,
      required: props.required ?? false,
      "aria-describedby": describedBy
    }),
    element("label", { class: "sui-checkbox-field-label", for: props.id }, [
      props.label,
      props.required ? safe('<span class="sui-checkbox-field-required" aria-hidden="true"> *</span>') : null
    ]),
    descriptionId ? element("span", { class: "sui-checkbox-field-description", id: descriptionId }, props.description) : null
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
// Banner: an inline notice (the React Banner's markup)

/** info, ok (success), warn (warning), danger (error): the native SuiBanner's tones. */
export type BannerTone = "info" | "ok" | "warn" | "danger";

const BANNER_TONES: Readonly<Record<BannerTone, { mark: string; label: string }>> = {
  info: { mark: "i", label: "Information" },
  ok: { mark: "✓", label: "Success" },
  warn: { mark: "!", label: "Warning" },
  danger: { mark: "!", label: "Error" }
};

export interface BannerProps {
  tone?: BannerTone;
  title?: Content;
  /** The message. `children` takes its place when given. */
  text?: Content;
  children?: Content;
  /** Links or form buttons beside the message. */
  actions?: Content;
  /** The Dismiss link's target, where the page is without the notice (e.g. the same page without the query
   * parameter that raised it). No client JavaScript, so dismissing is a navigation. */
  dismissHref?: string;
  /** The dismiss link's accessible name. */
  dismissLabel?: string;
  /** The live-region role; by default warn and danger are "alert", info and ok "status". `null` renders none. */
  role?: "alert" | "status" | "note" | null;
  /** The visually hidden prefix (default by tone, e.g. "Warning"); `null` renders none. */
  toneLabel?: string | null;
  id?: string;
  className?: string;
}

export function banner(props: BannerProps): SafeHtml {
  const tone: BannerTone = Object.hasOwn(BANNER_TONES, String(props.tone ?? "info")) ? (props.tone ?? "info") : "info";
  const details = BANNER_TONES[tone];
  const role = props.role === null ? undefined : oneOf(props.role ?? undefined, ["alert", "status", "note"], tone === "warn" || tone === "danger" ? "alert" : "status", "role");
  const prefix = props.toneLabel === undefined ? details.label : props.toneLabel;
  const message = props.children ?? props.text;
  return element("div", {
    id: props.id,
    class: classes("sui-banner", `sui-banner--${tone}`, props.className),
    role,
    "data-sui-component": "Banner",
    "data-sui-tone": tone
  }, [
    element("span", { class: "sui-banner-mark", "aria-hidden": "true" }, details.mark),
    element("div", { class: "sui-banner-body" }, [
      prefix ? element("span", { class: "sui-visually-hidden" }, `${prefix}: `) : null,
      hasContent(props.title ?? null) ? element("strong", { class: "sui-banner-title" }, props.title) : null,
      hasContent(message ?? null) ? element("div", { class: "sui-banner-text" }, message) : null
    ]),
    hasContent(props.actions ?? null) ? element("div", { class: "sui-banner-actions" }, props.actions) : null,
    props.dismissHref !== undefined ? element("a", { class: "sui-banner-dismiss", href: props.dismissHref, "aria-label": props.dismissLabel ?? "Dismiss" }, "×") : null
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
