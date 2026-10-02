// Packed-install smoke, base phase: the editor's tiptap peers are optional and
// not installed yet (check-pack-install.mjs proves none resolves), so the
// @scshafe/ui/editor subpath must be unavailable while the root and every
// other subpath work (exports.smoke.mjs, render.smoke.mjs).
let code = null;
try {
  await import("@scshafe/ui/editor");
} catch (error) {
  code = error.code;
}
if (code !== "ERR_MODULE_NOT_FOUND") {
  throw new Error("@scshafe/ui/editor should need tiptap here (got " + code + ")");
}
console.log("No tiptap installed: the editor subpath is unavailable, as intended.");
