# CLAUDE.md

Guidance for Claude Code in this repository: the noesis.vision website (Astro, static).

## Git workflow

- Always present the commit message to the user before committing. Never commit without explicit approval.
- Never push without being asked. Pushing to `main` deploys staging; pushing a tag deploys production.

## Commands

See the README. The ones used most:

- `npm run dev`: local dev server
- `npm run build`: production build (`dist/`)
- `npm run build:github`: staging build for GitHub Pages, under `/noesis-landing-page/`
- `npm run format && npm run lint`: Prettier and ESLint, run before finishing
- `npm run check:adblock`: after adding class names or third-party requests

## Internal links: base path

The same code is built for two places: production at `https://noesis.vision/` and staging at `https://noesisvision.github.io/noesis-landing-page/`. **Every link or path to our own pages or `public/` files goes through `url()` from `src/config/paths.js`.** Never hard-code a root path such as `href="/services"` or `src="/videos/…"`.

```astro
import {url} from "../config/paths.js";
<a href={url("/services")}>…</a>
<video src={url(v.src)} />
```

- Root paths stored in `src/data/*.json` are fine. Wrap them with `url()` where they're rendered.
- Images imported from `src/assets`, and `url(/…)` in CSS, are prefixed by Astro and Vite automatically.
- The staging build is `noindex` and loads no consent banner or Google Analytics (`IS_STAGING`).

## Deployment

- **Staging**: every push to `main` → `.github/workflows/deploy.yml` → GitHub Pages.
- **Production**: pushing any tag (for example `2026-11-10-1800`) → `.github/workflows/deploy-prod.yml` → S3 bucket behind CloudFront (noesis.vision). Hashed files in `_astro/` are cached for a year, HTML always revalidates, and everything else is cached for 24 hours. Files missing from the build are deleted from the bucket.
- **Hosting settings** that aren't in the workflow (www redirect, 404 error document): `infra/README.md`.

## Where to look

- `README.md`: project layout, SEO, forms, consent, what's left before going live.
- `.claude/skills/`: `seo`, `integrations`, `styling`, `content` (this site's conventions), plus third-party `seo-geo`, `google-analytics` and `content-creation`.
