---
name: seo
description: SEO and AI-search (GEO) work on the Noesis site - page titles and descriptions, canonical URLs, Open Graph/Twitter cards, JSON-LD (schema.org), sitemap, robots.txt, the social share image, and audits. Use when adding or renaming a page, changing a page's title/description, adding structured data (FAQ, Service, SoftwareApplication), or checking search visibility.
---

# SEO on the Noesis site

Astro static site, production URL `https://noesis.vision` (set as `site` in `astro.config.mjs`).
Pages are built as `/<page>/index.html`; canonical URLs always end with `/`.

## Where things live

| What                                                                   | Where                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `<title>`, meta description, canonical, OG/Twitter tags, `theme-color` | `src/layouts/Base.astro` (from props)                                                        |
| Site name, default description, share image, Organization JSON-LD      | `src/config/seo.js`                                                                          |
| Social profile URLs used in Organization `sameAs`                      | `src/config/integrations.js`                                                                 |
| Page-specific JSON-LD                                                  | a `jsonLd` array in each page's frontmatter, passed to `<Base>`                              |
| Sitemap                                                                | `src/pages/sitemap.xml.js` - generated from `src/pages/**/*.astro`, every page except `404`  |
| robots.txt                                                             | `public/robots.txt` (allows all bots, explicitly AI crawlers, points to the sitemap)         |
| Share card image (1200x630)                                            | `public/og-image.png`, regenerated with `npm run og-image` (`scripts/generate-og-image.mjs`) |

## Page head checklist

Every page renders `<Base title=… description=… jsonLd={…}>`:

- **title**: unique, ~50-60 characters, pattern `Topic | Noesis Vision` (see existing pages).
- **description**: unique, ~140-160 characters, says what the page offers and who it's for.
- **jsonLd**: plain schema.org objects with `"@context": "https://schema.org"`. Base escapes `<` for you. Existing types: `Organization` (global), `WebPage` (/), `Service` (/services), `SoftwareApplication` + `FAQPage` (/vision), `SoftwareApplication` (/nasde), see each page's frontmatter.
- **noindex**: only for pages that must stay out of search (404). It also drops the canonical link.
- Exactly one `<h1>` per page (`<Heading as="h1" size="xl">`), then `h2`/`h3` in order.
- Content in `<main id="main">` (the skip link targets it).

### Structured data must match visible content

Build JSON-LD from the same data the page renders, never from a second copy. Example: `/vision` maps `faq` from `src/data/vision.json` into both the accordion and the `FAQPage` entity. Google ignores or penalises markup that isn't on the page.

## Adding or renaming a page

1. Add `src/pages/<name>.astro` with `title`, `description`, and `jsonLd` if a schema.org type fits.
2. The sitemap picks it up automatically. Check `dist/sitemap.xml` after `npm run build`.
3. Renaming or removing a page breaks indexed URLs: add a redirect at the host. Astro `redirects` in `astro.config.mjs` only emit meta-refresh pages for a static build.
4. Link it from `Nav.astro` and/or `Footer.astro` so it isn't an orphan.

## Verify

```sh
npm run build
grep -o '<title>[^<]*' dist/<page>/index.html
grep -o '<meta name="description"[^>]*>' dist/<page>/index.html
grep -o 'application/ld+json">[^<]*' dist/<page>/index.html   # JSON-LD
cat dist/sitemap.xml
```

Then, against the live site:

- [Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/) for JSON-LD
- [PageSpeed Insights](https://pagespeed.web.dev/) / Lighthouse (Chrome DevTools) for Core Web Vitals, SEO and accessibility scores. The README notes all pages currently pass Lighthouse and axe with no issues, so keep it that way.
- Share previews: [opengraph.xyz](https://www.opengraph.xyz/) or the LinkedIn [Post Inspector](https://www.linkedin.com/post-inspector/)
- Google Search Console for indexing and the submitted sitemap

## Rules for this site

- The staging build (`npm run build:github`, GitHub Pages) is automatically `noindex`, with canonical and sitemap URLs on github.io. Only the production build is meant for search engines.
- Keep URLs, titles and descriptions that came from the previous noesis.vision unless asked: they're already indexed.
- Images: content images go through Astro's `<Image>` with meaningful `alt` (see the `content` skill). Decorative ones get `alt=""`.
- Fast pages are part of SEO: no new client-side frameworks, keep scripts in `src/scripts` small, and use `preload="none"` plus a poster for videos.

## Third-party references

- **GEO / keyword research skill**: `seo-geo` from [resciencelab/opc-skills](https://github.com/resciencelab/opc-skills). Installed in this project at `.claude/skills/seo-geo/`. Its `scripts/seo_audit.py` works without an account. The keyword and backlink scripts need DataForSEO credentials (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`). Use it for keyword research, AI-citation optimisation and audits, then apply the results with the conventions above.
- Google Search Central: [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- [schema.org](https://schema.org/) type reference
