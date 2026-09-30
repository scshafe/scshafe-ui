// L4 — the single seam binding icon-library choices to the semantic names.
// NO other file in the package
// or a host imports an icon library directly — call sites use names via <Icon/>.
// Today's binding: iconoir-react (regular weight), an OPTIONAL peer resolved from
// the consumer. Swap the imports below to switch libraries; everything else keeps
// working as long as the closed set stays mapped.

import {
  Archive,
  Bell,
  Check,
  Clock,
  Code,
  Copy,
  Cpu,
  Cube,
  EditPencil,
  Eye,
  GitBranch,
  GraphUp,
  Home,
  InfoCircle,
  ListSelect,
  Menu,
  MessageText,
  MoreHoriz,
  NavArrowDown,
  NavArrowLeft,
  NavArrowRight,
  NavArrowUp,
  Network,
  OpenNewWindow,
  PageEdit,
  Pause,
  Play,
  Plus,
  Prohibition,
  QuestionMark,
  Refresh,
  Rocket,
  SendDiagonal,
  Settings,
  Star,
  TaskList,
  TransitionRight,
  Trash,
  ViewGrid,
  WarningTriangle,
  Xmark
} from "iconoir-react";
import { ICON_NAMES, type IconName } from "./iconNames.js";

type IconComponent = (props: Record<string, unknown>) => any;

const REGISTRY: Record<IconName, IconComponent> = {
  // Brand
  "brand.mission": Rocket,

  // Top-level navigation
  "nav.home": Home,
  "nav.houston": Rocket,
  "nav.projects": ViewGrid,
  "nav.about": InfoCircle,
  "nav.settings": Settings,
  "nav.attention": Bell,
  "nav.menu": Menu,

  // Workspace tabs
  "tab.overview": Home,
  "tab.runs": TransitionRight,
  "tab.backlog": TaskList,
  "tab.dependencies": GraphUp,
  "tab.swarm": Network,
  "tab.relations": Cube,
  "tab.architecture": Cube,
  "tab.components": Cpu,
  "tab.chats": MessageText,
  "tab.approvals": Check,
  "tab.reviews": Star,
  "tab.artifacts": Code,
  "tab.implementation-plans": ListSelect,
  "tab.notes": PageEdit,
  "tab.events": Bell,
  "tab.git": GitBranch,
  "tab.delete": Trash,

  // Operator / composer actions
  "action.refresh": Refresh,
  "action.send": SendDiagonal,
  "action.add": Plus,
  "action.close": Xmark,
  "action.confirm": Check,
  "action.edit": EditPencil,
  "action.archive": Archive,
  "action.delete": Trash,
  "action.expand": NavArrowDown,
  "action.collapse": NavArrowUp,
  "action.chevron-left": NavArrowLeft,
  "action.chevron-right": NavArrowRight,
  "action.settings": Settings,
  "action.star": Star,
  "action.open-external": OpenNewWindow,
  "action.copy": Copy,
  "action.info": InfoCircle,
  "action.more": MoreHoriz,

  // Workflow-state glyphs
  "state.running": Play,
  "state.completed": Check,
  "state.failed": Xmark,
  "state.blocked": Prohibition,
  "state.warning": WarningTriangle,
  "state.pending": Clock,
  "state.review": Eye,
  "state.paused": Pause,
  "state.draft": EditPencil,
  "state.archived": Archive,
  "state.unknown": QuestionMark
};

// Module-load exhaustiveness check: fail fast if a name was added without a
// binding, or a binding without declaring its name.
(function assertRegistryExhaustive() {
  const declared = new Set<string>(ICON_NAMES);
  const bound = new Set(Object.keys(REGISTRY));
  const missing = [...declared].filter((name) => !bound.has(name));
  const extra = [...bound].filter((name) => !declared.has(name));
  if (missing.length || extra.length) {
    const detail = [
      missing.length ? `missing bindings: ${missing.join(", ")}` : null,
      extra.length ? `extra bindings (declare in iconNames.ts): ${extra.join(", ")}` : null
    ].filter(Boolean).join("; ");
    throw new Error(`@scshafe/ui/icons registry is out of sync with its names: ${detail}`);
  }
})();

export function iconComponentFor(name: string): IconComponent | null {
  return (REGISTRY as Record<string, IconComponent>)[name] ?? null;
}

export function iconRegistryKeys(): string[] {
  return Object.keys(REGISTRY);
}

// Fallback so a stray invalid name degrades to a visible question mark
// instead of crashing (the closed set + assertion mean it should never show).
export const FALLBACK_ICON_COMPONENT: IconComponent = QuestionMark;

export const ICON_LIBRARY_ID = "iconoir-react@regular";
