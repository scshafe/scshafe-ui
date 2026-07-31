import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Status } from "../primitive/StatusComponent.js";
import { MarkdownContent } from "../MarkdownContentComponent.js";
import { Tooltip } from "./TooltipComponent.js";
export function MessageBubble({ message, tooltip }) {
    const role = message.role ?? "assistant";
    const defaultTooltip = {
        component: "MessageBubble",
        layer: "widget",
        description: "Chat-style message wrapper with role, status, and content slots.",
        values: { role, title: message.title, partCount: message.parts?.length ?? 0, status: message.status ?? "none" }
    };
    return _jsx(Tooltip, { tooltip: tooltip, fallback: defaultTooltip, as: "div", children: _jsxs("article", { className: `project-chat-message project-chat-message-${role}${message.isFinal ? " project-chat-message-final" : ""}`, "data-mc-component": "MessageBubble", children: [_jsx("span", { className: "project-chat-message-avatar", "aria-hidden": "true", children: message.avatar ?? role.slice(0, 2).toUpperCase() }), _jsxs("div", { className: "project-chat-message-bubble", children: [_jsxs("div", { className: "project-chat-message-toolbar", children: [_jsxs("span", { children: [_jsx("strong", { children: message.title }), message.timeLabel ? _jsx("small", { children: message.timeLabel }) : null] }), message.status ? _jsx("span", { className: "project-chat-message-toolbar-actions", children: _jsx(Status, { state: message.status, tooltip: message.statusTooltip }) }) : null] }), _jsx("div", { className: "project-chat-message-parts", "aria-label": message.ariaLabel ?? `${message.title} content`, children: (message.parts ?? []).map((part) => _jsxs("section", { className: "project-chat-message-part", children: [part.label ? _jsx("small", { className: "project-chat-message-part-label", children: part.label }) : null, part.markdown ? _jsx(MarkdownContent, { value: part.content, className: "project-chat-markdown" }) : _jsx("p", { children: part.content })] }, part.id)) })] })] }) });
}
