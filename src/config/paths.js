// The site's base path: "/" in production (noesis.vision), "/noesis-landing-page/" in the
// GitHub Pages staging build (astro.config.github.mjs). Every link to our own pages or
// public/ files must go through url(), or it breaks on staging.
// Works in .astro files and in browser scripts (Vite fills in import.meta.env).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Root path → path under the site's base: url("/services") → "/noesis-landing-page/services" on staging */
export const url = (path) => (path.startsWith("/") ? BASE + path : path);

/** True for the staging build: kept out of search engines, no consent banner or analytics */
export const IS_STAGING = BASE !== "";
