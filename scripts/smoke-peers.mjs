// Print the exact peer specs (one per line) a consumer installs next to
// @scshafe/ui: `pnpm add --save-exact $(node scripts/smoke-peers.mjs) ...` for
// the base set, `--editor` for the tiptap packages of @scshafe/ui/editor.
import { readReleaseIdentity, smokePeerSpecs } from "./release-identity.mjs";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--editor")) throw new Error("usage: smoke-peers.mjs [--editor]");
const { packageJson } = await readReleaseIdentity();
for (const { spec } of smokePeerSpecs(packageJson, { editor: args.includes("--editor") })) console.log(spec);
