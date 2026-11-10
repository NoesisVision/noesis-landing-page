# Noesis site

Astro static site with five pages: `/`, `/services`, `/vision`, `/nasde` and `/privacy`. No UI framework and no client-side React. The only JavaScript sent to the browser is a few small scripts in `src/scripts`.

```sh
npm install
npm run dev      # local dev server
npm run build    # static output in dist/
npm start        # build, then serve dist/ and open it in the browser (http://localhost:4321)

npm run lint            # ESLint (JS + Astro)
npm run lint:fix
npm run format          # Prettier
npm run format:check
npm run check:adblock   # build, then check no element is hidden or request blocked by ad blockers
npm run preview:consent # build, then open Chrome showing it as https://noesis.vision with the real cookie banner
npm run og-image        # regenerate public/og-image.png (the card shown when a page is shared)
```

`check:adblock` runs every element-hiding rule from EasyList, EasyPrivacy, Fanboy, uBlock Origin and AdGuard lists (ads, tracking, cookies, social, popups, annoyances) against the built pages in Chrome, and matches every request against the same lists, including the Web3Forms form submission. It exits with 1 on any hit. Lists are cached in `node_modules/.cache/adblock-lists` for a day (`node scripts/check-adblock.mjs --refresh` to force). Needs Google Chrome installed, or `CHROME_PATH` pointing to a Chromium binary. Avoid class names and ids like `cookie-*`, `consent`, `newsletter-popup`, `social-share` or `ad-*`; the check will tell you if one slips in.

Opening `dist/index.html` directly from disk doesn't work: pages link their CSS, JS and other pages from the site root (`/_astro/…`), and browsers don't run module scripts from `file://`. Serve `dist/` instead (`npm start`, `npm run preview`, or any static host).

Every build also puts a small server into `dist/`, so the built site can be viewed anywhere with just [Node.js](https://nodejs.org), no `npm install`: run `node serve.mjs` inside `dist/` (or double-click `serve.command` on macOS, `serve.cmd` on Windows). It opens http://localhost:4321 (or the next free port); `--port 8080` and `--no-open` are optional. The source is in `scripts/serve/`, copied by `astro.config.mjs`. These three files also end up on the host if you upload `dist/`; they're harmless there, but you can leave them out.

## Deployment

The repository deploys from GitHub Actions:

- **Staging:** every push to `main` builds with `npm run build:github` (`astro.config.github.mjs`) and publishes to GitHub Pages at https://noesisvision.github.io/noesis-landing-page/. Staging pages are `noindex` and load no cookie banner or analytics.
- **Production:** pushing a tag (e.g. `git tag 2026-11-10-1800 && git push origin 2026-11-10-1800`) builds with `npm run build` and syncs `dist/` to the S3 bucket behind CloudFront (noesis.vision). `_astro/` gets a one-year immutable cache, HTML always revalidates, and other files are cached for 24 hours. Files no longer in the build are deleted.

Two hosting settings are made once in AWS, not by the workflow: the www → noesis.vision 301 redirect (a CloudFront Function, `infra/cloudfront/redirect-www.js`) and S3 serving `404.html` for missing pages. Steps are in [`infra/README.md`](infra/README.md).

Because the same code is served from `/` and from `/noesis-landing-page/`, links to the site's own pages and `public/` files go through `url()` from `src/config/paths.js` (see `CLAUDE.md`).

## SEO and accessibility

- `astro.config.mjs` sets `site: "https://noesis.vision"`, used for canonical URLs (with a trailing slash, e.g. `/services/`), Open Graph URLs and `/sitemap.xml`.
- `src/layouts/Base.astro` adds the description, canonical link, Open Graph/Twitter tags, `theme-color` and JSON-LD (the Organization from `src/config/seo.js` on every page, plus the page's own `jsonLd`). Pages pass `title`, `description` and `jsonLd`; titles and descriptions are reused from the previous noesis.vision. `/vision` builds its FAQ markup from the FAQ on the page.
- `public/robots.txt` (same rules as before), `src/pages/sitemap.xml.js` (every page except 404, at the same URL as before) and `src/pages/404.astro` (`noindex`).
- Every page has a "Skip to content" link and its content in `<main id="main">`. In-page links (`nav.js`) move keyboard focus to the section, not just scroll. Links inside paragraphs are underlined; use `.visually-hidden` for extra link text such as "Learn more about …".
- To re-check: Lighthouse (Chrome DevTools) and axe DevTools both report no issues on all pages.

## Layout

- `src/pages`: the pages
- `src/assets/images`: founder photos (`founders/`, referenced by name in `src/data/index.json`) and Nasde screenshots (`nasde/`). Astro converts them to WebP at build time: screenshots via `<Image>` with responsive `srcset`, founder photos via `getImage()` because they are CSS backgrounds. Add new images here, not in `public/`.
- `src/data`: page content as JSON (services, founders, FAQ and so on), plus icon paths in `icons.json`
- `src/components`: `Nav`, `Footer`, `Button`, `Field`, `Modal`, `ContactModal`, `NewsletterModal`, `Web3Form` (form with the Web3Forms hidden fields), `MailerLiteForm`, `Burger`, `Icon`, `Logo`, `ArchitectureDiagram`
- `src/components/ui`: shared building blocks used instead of utility classes: `Page`, `PageHero`, `Section`, `Container`, `SectionHead`, `CtaBlock`, `ButtonRow`, `Eyebrow`, `Heading`, `Lead`, `Text`, `Highlight`, `Card`, `CardTitle`, `CardCorner`, `CardGrid`, `StepNumber`, `RailDot`, `WindowBar`. Each takes `as` (element), `class` (extra classes) and passes other attributes through, e.g. `<Heading as="h1" size="xl">`, `<Lead width={760}>`, `<Card as="a" href="…">`.
- Logo: `src/components/Logo.astro` draws the mark from the brand book (Księga znaku v4, `docs/brand/`, not published with the site): basic version from 24 px, the small-size version (outline 2, nodes r 1.6) below 24 px. `public/favicon.svg` is the small-size version in black (light mode) or white (dark mode); `public/apple-touch-icon.png` is the brand book app icon (deep navy #1F2130 background, mark at 70%).
- `src/scripts`: `home.js` (scroll flow line), `hero-graph.js` (hero animation), `page.js` (reveals, FAQ, diagram scaling), `nav.js`, `modal.js` (dialogs and form sending)
- `src/styles/global.css`: fonts, responsive layout tokens (breakpoint 860px), hover utilities, FAQ styles, `.hl` (also used in HTML strings in `src/data`)
- `src/styles/components/`: one stylesheet per component; `ui/` holds the `src/components/ui` styles inside `@layer ui`, so page CSS always overrides them
- `src/styles/pages/`: one stylesheet per page (`index-*`, `services-*`, `vision-*`, `nasde-*`, `privacy-*` classes). No inline styles: only data-driven values are passed as CSS variables (`--bg`, `--w`, `--modal-size`)

## Before going live

- **Forms:** the contact popup (`ContactModal`, rendered by `Nav` on every page) and the newsletter popup (`NewsletterModal`, on Home, Vision and Services) keep the site's own design and are in demo mode until configured (they show the "sent" view and send nothing). Fill them in `src/config/integrations.js` (every key, ID and service URL the site uses lives there) and rebuild:
  - **Contact** goes through [Web3Forms](https://web3forms.com): set `WEB3FORMS_ACCESS_KEY`. The key is public by design. To go back to the old Tally form, set `CONTACT_FORM = "tally"` in `src/config/integrations.js`: every "Request Contact" button then links to Tally and the popup is left out.
  - **Newsletter** goes straight to the MailerLite form noesis.vision uses: set `MAILERLITE_FORM_ACTION` (the value is in the comment above it). First turn **reCAPTCHA off** for that form in MailerLite. Its key is MailerLite's and only works inside their iframe, so this site's own form can't pass it. The hidden honeypot field (and MailerLite's double opt-in, if enabled) replace it. Make one real test signup after setting it up.
  - AdGuard's Popups filter blocks every request to mailerlite.com, so visitors using it can't subscribe. When the newsletter modal opens, `modal.js` sends one empty `HEAD` request to the subscribe URL (MailerLite answers 405, so it can't subscribe anyone). If the blocker stops it, the modal shows a notice and disables "Join now!" before the visitor types anything. `check:adblock` reports the blocked request as an accepted warning.
- **Placeholders:** the code-to-map animation on Home is still a placeholder, as in the design.
- **Consent and analytics:** the CookieYes banner and Google Analytics 4 (`G-2BF7VRSXYF`) are reused from the previous noesis.vision and load only in production builds (`COOKIEYES_ID` / `GA_ID` in `src/config/integrations.js`). Google's script loads only after the visitor accepts analytics (Consent Mode v2 "basic", `src/scripts/consent-mode.js`, inlined in `<head>`). The preference centre only shows categories that have cookies (Necessary, Analytics), and the Google signals of the hidden ones (ads, functional) always stay denied, so "Accept All" grants analytics only. Click events are in `src/scripts/analytics.js`. Buttons with `track`/`trackSection` send the same click events as before (`cta_contact_form`, `internal_nav`, `newsletter_open`, ...). The banner only appears on noesis.vision, so it doesn't show on localhost: use `npm run preview:consent`, which serves the build as https://noesis.vision in a fresh Chrome profile (self-signed certificate) and intercepts Google Analytics and CookieYes logging so nothing reaches the real accounts (`--check` runs it headless as a self-test). its look and text are set in the CookieYes dashboard. `/privacy` lists the cookies and has a "Cookie settings" button: update both if the CookieYes categories or cookies change.

## Claude Code skills

Project skills in `.claude/skills/` describe this site's conventions for [Claude Code](https://claude.com/claude-code): `seo`, `integrations`, `styling` and `content`. Each one also links the vendor docs and third-party skills that are useful for that area. Three third-party skills are installed unchanged next to them (and left out of Prettier): `seo-geo` from [resciencelab/opc-skills](https://github.com/resciencelab/opc-skills) (keyword research, audits, AI-search optimisation) `google-analytics` from [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) (reading GA4 data; needs a service account) and `content-creation` from [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (drafting marketing copy).
