---
name: content
description: Adding or editing content on the Noesis site - copy, FAQ entries, services, founders, Nasde/Vision sections, images, videos, links and whole new pages. Use when the user wants to add, change or remove text, a section, an image, a video, a link or a page.
---

# Adding content to the Noesis site

Pages: `/` (`index`), `/services`, `/vision`, `/nasde`, `/privacy`, plus `404`. All copy is English.

## Where content lives

Most repeating content is JSON in `src/data/`. Edit the JSON, not the page markup:

| File                     | Content                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/data/index.json`    | Home: `founders` (`name`, `bio`, `photo`, layout keys), `services`, `stats`                                                   |
| `src/data/services.json` | Services: `audience`, `flowItems`, `measures`, `pillars`, `problems`                                                          |
| `src/data/vision.json`   | Vision: `apps`, `pillars`, `steps`, `uses`, `faq` (`q`/`a`), `videos`                                                         |
| `src/data/nasde.json`    | Nasde: `steps`, `uses`, `startCards`, `docLinks`, `pipeline`, `ladder`, `keyChecks`, `results`, `moreBenchmarks`, `startCode` |

One-off text (hero, CTA blocks) is written directly in `src/pages/<page>.astro`.

- Some JSON strings contain HTML rendered with `set:html` (e.g. `nasde.json` titles and bodies). Keep that HTML minimal (`<strong class="hl">`, `<a href>`) and only from trusted sources.
- Highlights in running text: `<Highlight>` in markup, `<strong class="hl">` inside JSON HTML.
- FAQ entries on `/vision` also feed its `FAQPage` JSON-LD automatically.

## Images

- Put them in `src/assets/images/` (`founders/`, `nasde/`, ...), **not** `public/`. Astro converts them to WebP at build time.
- Content images: `import { Image } from "astro:assets"` with real `alt` text and `widths`/`sizes` (see `nasde.astro`). Images used as CSS backgrounds go through `getImage()` (see founder photos in `index.astro`).
- Founder photo: add the file to `src/assets/images/founders/` and set `photo` in `index.json` to the file name without extension.

## Videos

- Files in `public/videos/` (served as is). Use web-safe names with no spaces.
- Each video needs a poster `.jpg` (1280x720, a frame without important text in the bottom strip, where the play button and title sit). On `/vision`, add an entry to `videos` in `vision.json` with `label`, `duration`, `src`, `poster`. The cover and player come from `src/scripts/video.js`.
- Videos load with `preload="none"`, so keep big files out of the page weight until play. ffmpeg isn't installed here. A frame can be grabbed in headless Chrome by drawing the `<video>` to a canvas.

## Links and buttons

- **Links to our own pages and `public/` files go through `url()`** from `src/config/paths.js`: `href={url("/services")}`, `src={url(v.src)}`. The site is also built under `/noesis-landing-page/` for staging, where a bare root path breaks. Root paths in `src/data/*.json` are fine as long as the page wraps them with `url()`.
- External service URLs (Tally, Discord, demo, socials) come from `src/config/integrations.js` (see the `integrations` skill). Docs and article links can stay inline.
- "Request Contact" buttons: `<Button {...contactLink}>`. Newsletter: `<Button open="news">` and render `<NewsletterModal />` on that page.
- Add `track`/`trackSection` to CTA buttons, reusing the existing event names.
- Links inside paragraphs are underlined automatically. For extra link context use `.visually-hidden` text, e.g. "Learn more <span class="visually-hidden">about Nasde</span>".

## New page checklist

1. `src/pages/<name>.astro`: copy the frame of `services.astro` (`Base` → `Page` → `Nav current=…` → `<main id="main">` → `Footer`) and add `src/styles/pages/<name>.css`.
2. `title`, `description`, `jsonLd` (see the `seo` skill). The sitemap updates itself.
3. Add `current` to the `Props` union in `Nav.astro` and link the page from the nav and/or footer.
4. Load scripts: `import "../scripts/page.js"` (nav, reveals, FAQ). Add `video.js` etc. if used.
5. If it has content in data files, add `src/data/<name>.json`.
6. Check the staging build too: `npm run build:github`. No root paths should be left in `dist/**/*.html` except under `/noesis-landing-page/`.
7. Mention any new third-party service on `/privacy`.

## Writing style

Direct, concrete, engineering-leader audience (CTOs, VP Engineering, tech leads). Short sentences, real outcomes over buzzwords, and consistent terms across pages: _harness engineering_, _skills_, _measurement_, _agentic development_, _Nasde_, _Noesis Vision_.

## Before finishing

```sh
npm run format && npm run lint && npm run build
```

Then open the page at phone and desktop width (see the `styling` skill), and run `npm run check:adblock` if you added class names or third-party requests.

## Third-party references

- **Copywriting skill**: `content-creation` from [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (marketing). Installed in this project at `.claude/skills/content-creation/`. Use it for drafting landing-page copy, headlines, CTAs, newsletters and social posts, then place the text with the conventions above.
- [Astro images guide](https://docs.astro.build/en/guides/images/)
