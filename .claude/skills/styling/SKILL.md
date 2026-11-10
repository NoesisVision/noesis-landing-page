---
name: styling
description: Visual styling on the Noesis site - colours, typography, layout components (src/components/ui), page and component stylesheets, responsive tokens, icons, motion and the brand book. Use when changing how anything looks, building a new section or component, fixing a visual bug, or checking a change in the browser.
---

# Styling the Noesis site

Plain CSS with no utility framework. Dark theme only (`color-scheme: dark`).

## Where styles live

| File                                    | Holds                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/global.css`                 | fonts (self-hosted Raleway Variable), responsive layout tokens, base elements, hover utilities, FAQ accordion, code blocks |
| `src/styles/components/ui/*.css`        | styles for `src/components/ui/*`, inside `@layer ui` so page CSS always wins                                               |
| `src/styles/components/<component>.css` | one file per component, imported by that component                                                                         |
| `src/styles/pages/<page>.css`           | one file per page, classes prefixed `index-*`, `services-*`, `vision-*`, `nasde-*`, `privacy-*`                            |

Rules:

- **No inline styles.** Only data-driven values go inline, as CSS variables (`--bg`, `--w`, `--modal-size`).
- A style used by two pages or components moves to a component stylesheet with a neutral prefix (e.g. `form-modal-*` in `src/styles/components/form-modal.css`). Don't import one page's CSS into another.
- Never name classes or ids like `cookie-*`, `consent`, `newsletter-popup`, `social-share`, `ad-*`: ad blockers hide them. `npm run check:adblock` catches this.

## Palette (from the brand book)

| Use                            | Value                                            |
| ------------------------------ | ------------------------------------------------ |
| Page background                | `#1f2130` (also `theme-color`)                   |
| Surface (cards, panels, modal) | `#2b2d3c`, borders `rgba(255,255,255,0.06-0.1)`  |
| Accent / brand cyan            | `#7ee3e8`, tints `rgba(126,227,232,0.08-0.4)`    |
| Text                           | `#fff` headings, `#c9ccd6` body, `#9a9eae` muted |

Brand book: `docs/brand/Noesis Ksiega Znaku v4.pdf` (not published). The logo is drawn in `src/components/Logo.astro` and follows it: basic mark from 24 px, the small-size variant below that.

## Building blocks: use `src/components/ui` first

`Page`, `PageHero`, `Section` (`size="md|lg"`), `Container` (`center`), `SectionHead`,
`CtaBlock`, `ButtonRow`, `Eyebrow`, `Heading` (`as`, `size="xl|lg|md"`), `Lead`
(`width={720|760}`), `Text` (`size="md|lg"`), `Highlight`, `Card`, `CardTitle`,
`CardCorner`, `CardGrid`, `StepNumber`, `RailDot`, `WindowBar`. Each takes `as`, `class`,
and passes other attributes through. Buttons: `src/components/Button.astro`
(`variant="light|outline|subtle"`, `size="xs|lg|xl"`, `arrow`, `href`/`open`/`close`,
`track`/`trackSection`). Copy the structure of an existing section on the same page
before inventing a new one.

## Responsive

- One breakpoint, **860px**: `@media (max-width: 859.98px)` for phone. Layout values that differ live as tokens on `:root` in `global.css` (`--railCols`, `--heroPadB`, ...). Add a token there rather than scattering media queries.
- `.wide-only` / `.narrow-only` show markup on one side of the breakpoint.
- Check at 390px and 1280-1920px wide. Keep 16px or more of side padding on phones and no horizontal scroll.

## Icons

`<Icon name="…" size stroke color>` renders [Tabler icons](https://tabler.io/icons) (MIT) from `src/data/icons.json`. No icon library ships to the browser. To add one, copy its node data from the `@tabler/icons` package (`tabler-nodes-outline.json` / `tabler-nodes-filled.json`) into `icons.json` under a PascalCase name, with `"type": "outline"` or `"filled"`.

## Motion

- Section reveals: add `data-reveal="1"` (handled by `src/scripts/page.js`, or `home.js` on Home).
- Every transition or animation needs a `@media (prefers-reduced-motion: reduce)` fallback. The canvas animations already check it.
- Hero graph: `src/scripts/hero-graph.js` (left/right branch settings in `LEFT`/`RIGHT`).

## Focus and accessibility

- Global focus ring: 2px `#7ee3e8` (`:focus-visible` in `global.css`). Don't remove outlines.
- Text contrast: body text on `#1f2130` stays `#c9ccd6` or lighter. Muted `#9a9eae` is for small print only.
- Interactive covers and cards are real `<button>`/`<a>` elements with an accessible name.

## Paths

Paths to `public/` files in markup go through `url()` (`src/config/paths.js`), because staging is served under `/noesis-landing-page/`. In CSS, `url(/fonts/…)` is fine: Vite adds the base itself.

## Verify visually

Build, serve, and screenshot with the Chrome that `playwright-core` drives (already a dev dependency):

```sh
npm run build && npx astro preview --port 4329 &
```

```js
import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "chrome" });
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } }); // and 390x844
await pg.goto("http://localhost:4329/vision/");
await pg.locator(".vision-videos").screenshot({ path: "shot.png" });
```

Use `deviceScaleFactor: 3` and a small `clip` to inspect edges such as rounded corners. Use `reducedMotion: "reduce"` to get the finished state of animations at once. Stop the preview server afterwards.

## Third-party references

- [Tabler icons](https://tabler.io/icons)
- [MDN: CSS cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (`@layer ui`)
- [WCAG contrast checker](https://webaim.org/resources/contrastchecker/)
