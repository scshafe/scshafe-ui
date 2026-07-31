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
  return <Tooltip tooltip={tooltip} fallback={defaultTooltip} as="div">
    <article
      className={`project-chat-message project-chat-message-${role}${message.isFinal ? " project-chat-message-final" : ""}`}
      data-mc-component="MessageBubble"
    >
      <span className="project-chat-message-avatar" aria-hidden="true">{message.avatar ?? role.slice(0, 2).toUpperCase()}</span>
      <div className="project-chat-message-bubble">
        <div className="project-chat-message-toolbar">
          <span><strong>{message.title}</strong>{message.timeLabel ? <small>{message.timeLabel}</small> : null}</span>
          {message.status ? <span className="project-chat-message-toolbar-actions"><Status state={message.status} tooltip={message.statusTooltip} /></span> : null}
        </div>
        <div className="project-chat-message-parts" aria-label={message.ariaLabel ?? `${message.title} content`}>
          {(message.parts ?? []).map((part) => <section key={part.id} className="project-chat-message-part">
            {part.label ? <small className="project-chat-message-part-label">{part.label}</small> : null}
            {part.markdown ? <MarkdownContent value={part.content} className="project-chat-markdown" /> : <p>{part.content}</p>}
          </section>)}
        </div>
      </div>
    </article>
  </Tooltip>;
}
