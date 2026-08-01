// S4 — mc-ui/build: the esbuild wrapper both consumers copied as scripts/build-web.mjs,
// as a library import. Node-only (build-time); `esbuild` resolves from the CONSUMER's
// devDependencies (declared here as an optional peer). Ships the fail-loud mc-ui
// preflight: a clean-environment install only has mc-ui if npm could authenticate to
// the private repo, and without the check esbuild fails deep in the bundle with a
// cryptic "Could not resolve".

import { createRequire } from "node:module";

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

export function assertMcUiResolvable(resolveFrom: string): void {
  const require = createRequire(resolveFrom.endsWith("/") ? resolveFrom : `${resolveFrom}/`);
  try {
    require.resolve("mc-ui");
  } catch {
    throw new Error(
      [
        "build-web preflight: the 'mc-ui' package did not resolve.",
        "This app's web bundle depends on the private component library",
        "github.com/scshafe/mc-ui (a pinned git+ssh ref in package.json).",
        "",
        "Fix: run `npm install`. If that cannot fetch mc-ui, this environment",
        "cannot authenticate to the private repo — provision the operator SSH",
        "key or a read-only deploy key, then re-install."
      ].join("\n")
    );
  }
}

export async function buildWebApp({ entry, outfile, skipPreflight = false, resolveFrom, banner, esbuild: extra = {} }: BuildWebAppOptions) {
  if (!skipPreflight) assertMcUiResolvable(resolveFrom ?? process.cwd());
  // esbuild comes from the consumer's devDependencies (optional peer) — resolved
  // lazily so importing mc-ui/build without esbuild installed only fails on use.
  const { build } = await import("esbuild");
  return build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outfile,
    logLevel: "warning",
    banner: { js: banner ?? `/* Built by mc-ui/build. Source entry: ${entry}. */` },
    ...extra
  } as any);
}
