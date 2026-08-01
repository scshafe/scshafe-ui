export interface BundleEntryOptions {
    /** App root whose node_modules should resolve imports (temp entry is created inside it). */
    appRoot: string;
    /** Inline entry source (imports resolve against appRoot's node_modules). */
    source: string;
    /** Modules left as external imports (default: react family). */
    external?: string[];
    /** Extra esbuild options merged last. */
    esbuild?: Record<string, unknown>;
}
export interface BundledEntry {
    bundlePath: string;
    cleanup: () => void;
}
export declare function bundleEntry({ appRoot, source, external, esbuild: extra }: BundleEntryOptions): Promise<BundledEntry>;
export interface RunNodeChildOptions {
    /** Script path to run with the current node executable. */
    scriptPath: string;
    /** Value JSON-serialized onto the child's stdin. */
    input?: unknown;
    /** Kill the child after this many ms (default 30000). */
    timeoutMs?: number;
}
export declare function runNodeChild({ scriptPath, input, timeoutMs }: RunNodeChildOptions): Promise<any>;
export interface SpaRenderHarnessOptions {
    appRoot: string;
    /** Absolute path to the module exporting the store factory. */
    storeModule: string;
    /** Export name of the store factory taking { preloadedState } (default "createMcStore"-style factories accept it). */
    storeExport: string;
    /** Absolute path to the module exporting the root component. */
    appModule: string;
    /** Export name of the root component. */
    appExport: string;
    /** Wrap in McProviders (default true; set false for a plain react-redux Provider). */
    mcProviders?: boolean;
}
export declare function createSpaRenderHarness({ appRoot, storeModule, storeExport, appModule, appExport, mcProviders }: SpaRenderHarnessOptions): Promise<{
    renderApp: (preloadedState: unknown) => Promise<string>;
    cleanup: () => void;
}>;
