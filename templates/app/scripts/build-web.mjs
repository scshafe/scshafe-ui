import { buildWebApp } from "mc-ui/build";

// Bundles src/main.jsx (plus the CSS it imports) into dist/, with the fail-loud
// mc-ui preflight. Serve dist/app.js + dist/app.css from your app server.
await buildWebApp({
  entry: "src/main.jsx",
  outfile: "dist/app.js",
});
