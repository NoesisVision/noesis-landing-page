// Staging build for GitHub Pages (https://noesisvision.github.io/noesis-landing-page/):
// the production config, served from a sub-path. `npm run build:github`.
// Links to our own pages and public/ files go through url() (src/config/paths.js) so
// they pick up the base. The staging build is noindex and loads no consent banner or GA.
import config from "./astro.config.mjs";

export default {
  ...config,
  site: "https://noesisvision.github.io",
  base: "/noesis-landing-page/",
};
