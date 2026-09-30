// P1 — generic formatting helpers, so the format-dependent Bucket-D components
// (Status / ChipList / RecordMeta) can live in this package without reverse-importing an
// app. Only DOMAIN-FREE helpers live here; hosts keep their domain formatters beside them
// and may re-export these from "@scshafe/ui/format". Import via the subpath (`import { timestamp } from "@scshafe/ui/format"`) or the root.
import type { StatusTone } from "./layout/layoutShared.js";

// The default workflow-state → tone vocabulary. Opinionated but generic: hosts with their own
// state words extend it (`new Map([...toneByState, ["my_state", "green"]])`) and pass the
// result where a component accepts a tones map, or just reuse these entries.
export const toneByState: ReadonlyMap<string, StatusTone> = new Map(Object.entries({
  draft: "blue", planning: "blue", awaiting_plan_review: "yellow", queued: "purple", running: "green", idle: "blue", stale: "orange",
  awaiting_decision: "yellow", reviewing: "purple", revising: "orange", paused: "orange",
  completed: "green", cancelled: "red", failed: "red", dead_lettered: "red", archived: "blue",
  proposed: "blue", ready: "green", blocked: "orange", assigned: "purple", in_progress: "green",
  submitted: "purple", under_review: "purple", needs_revision: "orange", accepted: "green",
  rejected: "red", retry_scheduled: "orange", deferred: "yellow", requested: "yellow",
  planned: "blue", active: "green", deprecated: "orange", done: "green",
  drives: "purple", updates: "blue", validates: "green", blocks: "orange", depends_on: "yellow",
  approved: "green", denied: "red", expired: "orange", used: "purple", incomplete: "orange",
  unsafe: "red", needs_human: "yellow", implementation_brief: "blue", patch: "purple",
  log_excerpt: "yellow", test_result: "green", screenshot: "purple", review_report: "purple",
  handoff: "blue", final_report: "green", other: "blue", ux_docs: "purple", security: "orange",
  policy: "yellow", artifact: "blue", human: "yellow", pass: "green", warn: "yellow", fail: "red", partial: "yellow"
}) as Array<[string, StatusTone]>);

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };

export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ESCAPES[char] ?? char);
}

export interface ClassTokenOptions {
  lowercase?: boolean;
  collapse?: boolean;
}

export function classToken(value: unknown, { lowercase = false, collapse = false }: ClassTokenOptions = {}): string {
  const pattern = collapse ? /[^a-zA-Z0-9_-]+/g : /[^a-zA-Z0-9_-]/g;
  const token = String(value ?? "unknown").replace(pattern, "-");
  return lowercase ? token.toLowerCase() : token;
}

export function plural(value: number, label: string): string {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

export function timestamp(value: string | number | Date | null | undefined): string {
  return value ? new Date(value).toLocaleString() : "—";
}

export function shortRef(value: unknown): string {
  const text = String(value ?? "");
  return text.length > 18 ? `${text.slice(0, 18)}…` : text;
}

export function relativeTimeLabel(value: string | number | Date | null | undefined, now: string | number | Date = Date.now()): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  const base = new Date(now).getTime();
  if (!Number.isFinite(then) || !Number.isFinite(base)) return "";
  const seconds = Math.round((base - then) / 1000);
  const ago = seconds >= 0;
  const span = Math.abs(seconds);
  const unit = span < 60 ? [span, "s"] as const
    : span < 3600 ? [Math.round(span / 60), "m"] as const
    : span < 86400 ? [Math.round(span / 3600), "h"] as const
    : span < 2592000 ? [Math.round(span / 86400), "d"] as const
    : [Math.round(span / 2592000), "mo"] as const;
  if (span < 10) return "now";
  return ago ? `${unit[0]}${unit[1]} ago` : `in ${unit[0]}${unit[1]}`;
}
