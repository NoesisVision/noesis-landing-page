# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing page for **Noesis Vision** — tools and practices for agentic development. Built with Astro 3 + TailwindCSS 3, multi-page static site.

## Commands

- `npm run dev` — Start dev server (localhost:4321)
- `npm run build` — Production build to `./dist/`
- `npm run build:github` — Build for GitHub Pages deployment (uses `astro.config.github.mjs` with `/noesis-landing-page/` base path)
- `npm run preview` — Preview production build locally

No test framework or linter is configured.

## Architecture

- **Multi-page site**:
  - `src/pages/index.astro` — Homepage (company vision, two pillars, founders)
  - `src/pages/vision.astro` — Product page (architecture visualization tool)
  - `src/pages/services.astro` — SDLC transformation services
- **Layout**: `src/layouts/Layout.astro` wraps all pages with head (SEO meta, JSON-LD schema, OG tags), nav, and footer
- **Components hierarchy**:
  - `sections/` — Full page sections imported into page files
  - `shared/` — Reusable UI primitives (Button, Container, Title, Paragraph, BtnLink, etc.)
  - `blocks/` — Composite sub-components (e.g., GroupFooterNav)
  - `cards/` and `elements/` — Smaller building blocks (Navbar, Footer)
  - `diagrams/` — SVG diagram components (currently unused, PNG restored)
- **Data**: `src/utils/data.ts` exports `services` and `useCases` arrays consumed by section components
- **Styling**: TailwindCSS with CSS custom properties for theming (dark mode via `class` strategy). Theme colors defined in `tailwind.config.cjs` reference CSS variables from Layout.astro global styles

## Internal Links — Base Path Awareness

**CRITICAL**: All internal links must use `import.meta.env.BASE_URL` prefix to work on both local dev (`base: '/'`) and GitHub Pages (`base: '/noesis-landing-page/'`).

Pattern used in components:
```astro
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
// Then: href={`${base}/vision`}
```

Never hardcode absolute paths like `href="/vision"` — they will break on GitHub Pages.

## Deployment

- **GitHub Pages** (staging): https://noesisvision.github.io/noesis-landing-page/
  - Workflow: `deploy.yml` (uses `build:github` script)
  - Config: `astro.config.github.mjs` with `site: 'https://noesisvision.github.io'` and `base: '/noesis-landing-page/'`
- **Production**: `deploy-prod.yml` workflow, config `astro.config.mjs` with `base: '/'`
- **Remote**: `git@github.com:NoesisVision/noesis-landing-page.git`

## SEO/GEO

- `robots.txt` — explicitly allows AI search engine bots (GPTBot, ClaudeBot, PerplexityBot, etc.)
- `sitemap.xml` — static, must be updated manually when pages change
- JSON-LD structured data per page (Organization global, SoftwareApplication + FAQPage on /vision, Service on /services)
- Open Graph + Twitter Card meta tags in Layout
