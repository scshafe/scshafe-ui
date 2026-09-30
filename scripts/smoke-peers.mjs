// Print the exact peer specs (one per line) a consumer installs next to
// @scshafe/ui: `pnpm add --save-exact $(node scripts/smoke-peers.mjs) ...`.
import { readReleaseIdentity, smokePeerSpecs } from "./release-identity.mjs";

const { packageJson } = await readReleaseIdentity();
for (const { spec } of smokePeerSpecs(packageJson)) console.log(spec);
