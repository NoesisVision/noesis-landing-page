// /sitemap.xml, at the same address as on the previous noesis.vision (referenced by
// robots.txt and possibly submitted to Search Console). Lists every page except 404.
import { url } from "../config/paths.js";
const pages = Object.keys(import.meta.glob("./**/*.astro"))
  .map((f) => f.replace(/^\.\//, "").replace(/\.astro$/, ""))
  .filter((p) => p !== "404")
  .map((p) => (p === "index" ? "" : p.replace(/\/index$/, "") + "/"))
  .sort();

export function GET({ site }) {
  const urls = pages
    .map((p) => `  <url><loc>${new URL(url("/" + p), site).href}</loc></url>`)
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
