// L4 — the semantic icon-name registry, moved from MC's web/src/icons/icon-names.js.
// Names are SEMANTIC (what the icon means in the UI), not visual (which glyph); the
// library binding lives in iconRegistry.tsx, so call sites stay library-agnostic and
// the closed set lets the registry assert every name is bound at module load.
//
// L4 additions over the MC original: `tab.git` + `tab.delete` (referenced by MC's
// navigation but never declared — they rendered the QuestionMark fallback in
// production) and the `state.*` section backing iconByState (L3's iconized Status).
//
// Hosts with domain vocabulary beyond this set keep their own closed list + registry
// beside it (the mechanism is the contract, not this particular list).

export const ICON_NAMES = [
  // Brand
  "brand.mission",

  // Top-level navigation
  "nav.home",
  "nav.houston",
  "nav.projects",
  "nav.about",
  "nav.settings",
  "nav.attention",
  "nav.menu",

  // Workspace tabs
  "tab.overview",
  "tab.runs",
  "tab.backlog",
  "tab.dependencies",
  "tab.swarm",
  "tab.relations",
  "tab.architecture",
  "tab.components",
  "tab.chats",
  "tab.approvals",
  "tab.reviews",
  "tab.artifacts",
  "tab.implementation-plans",
  "tab.notes",
  "tab.events",
  "tab.git",
  "tab.delete",

  // Operator / composer actions
  "action.refresh",
  "action.send",
  "action.add",
  "action.close",
  "action.confirm",
  "action.edit",
  "action.archive",
  "action.delete",
  "action.expand",
  "action.collapse",
  "action.chevron-left",
  "action.chevron-right",
  "action.settings",
  "action.star",
  "action.open-external",
  "action.copy",
  "action.info",
  "action.more",

  // Workflow-state glyphs (the iconByState vocabulary; consumed by iconized Status in L3)
  "state.running",
  "state.completed",
  "state.failed",
  "state.blocked",
  "state.warning",
  "state.pending",
  "state.review",
  "state.paused",
  "state.draft",
  "state.archived",
  "state.unknown"
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICON_NAME_SET: ReadonlySet<string> = new Set(ICON_NAMES);

export function isIconName(value: unknown): value is IconName {
  return typeof value === "string" && ICON_NAME_SET.has(value);
}
