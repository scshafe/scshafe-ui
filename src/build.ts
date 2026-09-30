// @scshafe/ui/build: the esbuild wrapper apps otherwise copy as scripts/build-web.mjs,
// as a library import. Node-only (build-time); `esbuild` resolves from the CONSUMER's
// devDependencies (declared here as an optional peer). Ships a fail-loud preflight:
// a clean-environment install only has @scshafe/ui if the package manager could
// authenticate to GitHub Packages, and without the check esbuild fails deep in the
// bundle with a cryptic "Could not resolve".

import { createRequire } from "node:module";

export interface BuildWebAppOptions {
  /** App entry point (e.g. "web/src/main.jsx"). */
  entry: string;
  /** Bundle output (e.g. "web/dist/app.js"); CSS imported from the entry lands beside it. */
  outfile: string;
  /** Skip the @scshafe/ui resolvability preflight (for apps not depending on @scshafe/ui). */
  skipPreflight?: boolean;
  /** Directory require.resolve runs from for the preflight; defaults to the entry's URL base. */
  resolveFrom?: string;
  /** Banner comment for the bundle (defaults to a provenance line naming the entry). */
  banner?: string;
  /** Extra esbuild options merged last (target/format/etc. can be overridden). */
  esbuild?: Record<string, unknown>;
}

export function assertSuiResolvable(resolveFrom: string): void {
  const require = createRequire(resolveFrom.endsWith("/") ? resolveFrom : `${resolveFrom}/`);
  try {
    require.resolve("@scshafe/ui");
  } catch {
    throw new Error(
      [
        "build-web preflight: the '@scshafe/ui' package did not resolve.",
        "This app's web bundle depends on @scshafe/ui, a private package on",
        "GitHub Packages (https://npm.pkg.github.com).",
        "",
        "Fix: commit an .npmrc with `@scshafe:registry=https://npm.pkg.github.com`,",
        "provide a read:packages credential in the user-level npmrc (or",
        "NODE_AUTH_TOKEN in CI), then run `pnpm install --frozen-lockfile`."
      ].join("\n")
    );
  }
}

export async function buildWebApp({ entry, outfile, skipPreflight = false, resolveFrom, banner, esbuild: extra = {} }: BuildWebAppOptions) {
  if (!skipPreflight) assertSuiResolvable(resolveFrom ?? process.cwd());
  // esbuild comes from the consumer's devDependencies (optional peer) — resolved
  // lazily so importing @scshafe/ui/build without esbuild installed only fails on use.
  const { build } = await import("esbuild");
  return build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outfile,
    logLevel: "warning",
    banner: { js: banner ?? `/* Built by @scshafe/ui/build. Source entry: ${entry}. */` },
    ...extra
  } as any);
}
