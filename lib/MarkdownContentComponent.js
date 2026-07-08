import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { Tooltip } from "./widget/TooltipComponent.js";
function markdownText(value) {
    return typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
}
function safeMarkdownHref(value) {
    const href = typeof value === "string" ? value.trim() : "";
    if (!href)
        return null;
    if (href.startsWith("#") || href.startsWith("/"))
        return href;
    try {
        const url = new URL(href);
        return ["http:", "https:", "mailto:"].includes(url.protocol) ? href : null;
    }
    catch {
        return null;
    }
}
function earliestToken(text, start) {
    const candidates = ["`", "[", "**", "*"].map((token) => ({ token, index: text.indexOf(token, start) })).filter((entry) => entry.index >= 0);
    if (!candidates.length)
        return null;
    return candidates.sort((left, right) => left.index - right.index || right.token.length - left.token.length)[0];
}
function renderInline(text, keyPrefix = "inline") {
    const source = markdownText(text);
    const nodes = [];
    let index = 0;
    let tokenIndex = 0;
    const pushText = (value) => {
        if (value)
            nodes.push(value);
    };
    while (index < source.length) {
        const found = earliestToken(source, index);
        if (!found) {
            pushText(source.slice(index));
            break;
        }
        if (found.index > index)
            pushText(source.slice(index, found.index));
        const tokenKey = `${keyPrefix}:${tokenIndex++}`;
        if (found.token === "`") {
            const end = source.indexOf("`", found.index + 1);
            if (end > found.index) {
                nodes.push(_jsx("code", { children: source.slice(found.index + 1, end) }, tokenKey));
                index = end + 1;
                continue;
            }
        }
        if (found.token === "[") {
            const labelEnd = source.indexOf("](", found.index + 1);
            const hrefEnd = labelEnd >= 0 ? source.indexOf(")", labelEnd + 2) : -1;
            if (labelEnd > found.index && hrefEnd > labelEnd) {
                const label = source.slice(found.index + 1, labelEnd);
                const href = safeMarkdownHref(source.slice(labelEnd + 2, hrefEnd));
                if (href) {
                    nodes.push(_jsx("a", { href: href, target: href.startsWith("#") || href.startsWith("/") ? undefined : "_blank", rel: href.startsWith("#") || href.startsWith("/") ? undefined : "noreferrer", children: renderInline(label, `${tokenKey}:label`) }, tokenKey));
                }
                else {
                    nodes.push(_jsx(React.Fragment, { children: renderInline(label, `${tokenKey}:label`) }, tokenKey));
                }
                index = hrefEnd + 1;
                continue;
            }
        }
        if (found.token === "**") {
            const end = source.indexOf("**", found.index + 2);
            if (end > found.index + 2) {
                nodes.push(_jsx("strong", { children: renderInline(source.slice(found.index + 2, end), `${tokenKey}:strong`) }, tokenKey));
                index = end + 2;
                continue;
            }
        }
        if (found.token === "*" && source[found.index + 1] !== "*") {
            const end = source.indexOf("*", found.index + 1);
            if (end > found.index + 1) {
                nodes.push(_jsx("em", { children: renderInline(source.slice(found.index + 1, end), `${tokenKey}:em`) }, tokenKey));
                index = end + 1;
                continue;
            }
        }
        pushText(source[found.index]);
        index = found.index + 1;
    }
    return nodes;
}
function renderInlineWithBreaks(text, keyPrefix) {
    return markdownText(text).split("\n").flatMap((line, index, lines) => {
        const nodes = renderInline(line, `${keyPrefix}:line:${index}`);
        return index < lines.length - 1 ? [...nodes, _jsx("br", {}, `${keyPrefix}:br:${index}`)] : nodes;
    });
}
function parseMarkdownBlocks(value) {
    const lines = markdownText(value).split("\n");
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();
        if (!trimmed) {
            index += 1;
            continue;
        }
        const fenceMatch = trimmed.match(/^```([^`]*)$/);
        if (fenceMatch) {
            const language = fenceMatch[1]?.trim().split(/\s+/)[0] ?? "";
            const codeLines = [];
            index += 1;
            while (index < lines.length && !lines[index].trim().startsWith("```")) {
                codeLines.push(lines[index]);
                index += 1;
            }
            if (index < lines.length)
                index += 1;
            blocks.push({ type: "code", language, text: codeLines.join("\n") });
            continue;
        }
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
            index += 1;
            continue;
        }
        const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
        if (unorderedMatch) {
            const items = [];
            while (index < lines.length) {
                const itemMatch = lines[index].trim().match(/^[-*+]\s+(.+)$/);
                if (!itemMatch)
                    break;
                items.push(itemMatch[1]);
                index += 1;
            }
            blocks.push({ type: "list", ordered: false, items });
            continue;
        }
        const orderedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
        if (orderedMatch) {
            const items = [];
            while (index < lines.length) {
                const itemMatch = lines[index].trim().match(/^\d+[.)]\s+(.+)$/);
                if (!itemMatch)
                    break;
                items.push(itemMatch[1]);
                index += 1;
            }
            blocks.push({ type: "list", ordered: true, items });
            continue;
        }
        const quoteMatch = trimmed.match(/^>\s?(.*)$/);
        if (quoteMatch) {
            const quoteLines = [];
            while (index < lines.length) {
                const itemMatch = lines[index].trim().match(/^>\s?(.*)$/);
                if (!itemMatch)
                    break;
                quoteLines.push(itemMatch[1]);
                index += 1;
            }
            blocks.push({ type: "quote", text: quoteLines.join("\n") });
            continue;
        }
        const paragraphLines = [line];
        index += 1;
        while (index < lines.length) {
            const candidate = lines[index];
            const candidateTrimmed = candidate.trim();
            if (!candidateTrimmed)
                break;
            if (/^```/.test(candidateTrimmed) || /^(#{1,6})\s+/.test(candidateTrimmed) || /^[-*+]\s+/.test(candidateTrimmed) || /^\d+[.)]\s+/.test(candidateTrimmed) || /^>\s?/.test(candidateTrimmed))
                break;
            paragraphLines.push(candidate);
            index += 1;
        }
        blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
    }
    return blocks;
}
function MarkdownBlock({ block, index }) {
    const keyPrefix = `markdown:block:${index}`;
    if (block.type === "code")
        return _jsx("pre", { className: "markdown-code-block", children: _jsx("code", { children: block.text }) });
    if (block.type === "heading") {
        const HeadingTag = `h${block.level}`;
        return _jsx(HeadingTag, { children: renderInline(block.text, `${keyPrefix}:heading`) });
    }
    if (block.type === "list") {
        const ListTag = block.ordered ? "ol" : "ul";
        return _jsx(ListTag, { children: block.items.map((item, itemIndex) => _jsx("li", { children: renderInlineWithBreaks(item, `${keyPrefix}:item:${itemIndex}`) }, `${keyPrefix}:item:${itemIndex}`)) });
    }
    if (block.type === "quote")
        return _jsx("blockquote", { children: renderInlineWithBreaks(block.text, `${keyPrefix}:quote`) });
    return _jsx("p", { children: renderInlineWithBreaks(block.text, `${keyPrefix}:paragraph`) });
}
/** @param {{ value?: any, className?: string, tooltip?: any }} props */
export function MarkdownContent({ value, className = "markdown-content", tooltip }) {
    const blocks = parseMarkdownBlocks(value);
    const defaultTooltip = {
        component: "MarkdownContent",
        layer: "widget",
        description: "Safe structured markdown renderer for chat and detail surfaces.",
        values: { blocks: blocks.length, valueLength: markdownText(value).length }
    };
    if (!blocks.length)
        return null;
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsx("div", { className: className, "data-mc-component": "MarkdownContent", children: blocks.map((block, index) => _jsx(MarkdownBlock, { block: block, index: index }, `markdown-block:${index}`)) }) });
}
