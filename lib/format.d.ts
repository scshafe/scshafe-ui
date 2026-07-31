import type { StatusTone } from "./layout/layoutShared.js";
export declare const toneByState: ReadonlyMap<string, StatusTone>;
export declare function esc(value: unknown): string;
export interface ClassTokenOptions {
    lowercase?: boolean;
    collapse?: boolean;
}
export declare function classToken(value: unknown, { lowercase, collapse }?: ClassTokenOptions): string;
export declare function plural(value: number, label: string): string;
export declare function timestamp(value: string | number | Date | null | undefined): string;
export declare function shortRef(value: unknown): string;
