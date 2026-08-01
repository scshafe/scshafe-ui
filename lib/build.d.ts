export interface BuildWebAppOptions {
    /** App entry point (e.g. "web/src/main.jsx"). */
    entry: string;
    /** Bundle output (e.g. "web/dist/app.js"); CSS imported from the entry lands beside it. */
    outfile: string;
    /** Skip the mc-ui resolvability preflight (for apps not depending on mc-ui). */
    skipPreflight?: boolean;
    /** Directory require.resolve runs from for the preflight; defaults to the entry's URL base. */
    resolveFrom?: string;
    /** Banner comment for the bundle (defaults to a provenance line naming the entry). */
    banner?: string;
    /** Extra esbuild options merged last (target/format/etc. can be overridden). */
    esbuild?: Record<string, unknown>;
}
export declare function assertMcUiResolvable(resolveFrom: string): void;
export declare function buildWebApp({ entry, outfile, skipPreflight, resolveFrom, banner, esbuild: extra }: BuildWebAppOptions): Promise<import("esbuild").BuildResult<any>>;
