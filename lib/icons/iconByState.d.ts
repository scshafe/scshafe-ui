import type { IconName } from "./iconNames.js";
export declare const iconByState: ReadonlyMap<string, IconName>;
/** The glyph for a workflow state, or null when the word is a kind, not a state. */
export declare function iconNameForState(state: unknown): IconName | null;
