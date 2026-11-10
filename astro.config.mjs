import { defineConfig } from "astro/config";
import { chmod, copyFile } from "node:fs/promises";

// Copies a zero-dependency local server into dist/ (serve.mjs, plus double-click launchers),
// so the built site can be viewed anywhere with Node.js and no npm install.
const serveScript = {
  name: "serve-script",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      for (const file of ["serve.mjs", "serve.command", "serve.cmd"]) {
        await copyFile(
          new URL(`./scripts/serve/${file}`, import.meta.url),
          new URL(file, dir),
        );
      }
      await chmod(new URL("serve.command", dir), 0o755);
      await chmod(new URL("serve.mjs", dir), 0o755);
    },
  },
};

export default defineConfig({
  // Production URL: used for canonical links, Open Graph URLs and /sitemap.xml.
  site: "https://noesis.vision",
  // Pages are built as /services/index.html etc.; canonical URLs use the trailing slash.
  trailingSlash: "ignore",
  integrations: [serveScript],
});
