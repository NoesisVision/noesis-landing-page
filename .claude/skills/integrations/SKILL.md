---
name: integrations
description: Third-party services on the Noesis site - Web3Forms contact form, MailerLite newsletter, Tally forms, CookieYes consent banner, Google Analytics 4 (Consent Mode v2) and click tracking, the live demo, Discord/social links. Use when changing a key, ID or service URL, switching the contact form, adding a tracked button, adding a new third-party script or service, or debugging forms, consent or analytics.
---

# Integrations on the Noesis site

## One place for every key and URL

`src/config/integrations.js` holds every key, ID and service URL. Never hard-code them
elsewhere: import from this file in components, pages, browser scripts (`src/scripts/*`)
and Node scripts (`scripts/*.mjs`). It's plain ESM with no Astro imports, so all of these
can use it. Everything in it ends up public, so never put a real secret there.

| Setting                                                                        | Used by                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `CONTACT_FORM` (`"web3forms"` / `"tally"`), `contactLink`, `USE_CONTACT_MODAL` | every "Request Contact" button, `ContactModal`, privacy page             |
| `WEB3FORMS_ACCESS_KEY`, `WEB3FORMS_ENDPOINT`                                   | `Web3Form.astro`, `src/scripts/modal.js`                                 |
| `TALLY_CONTACT_URL`, `TALLY_BETA_URL`                                          | contact (Tally mode), Vision beta buttons                                |
| `MAILERLITE_FORM_ACTION`                                                       | `MailerLiteForm.astro` (newsletter)                                      |
| `COOKIEYES_ID`, `GA_ID`                                                        | `Base.astro`, `src/scripts/consent-mode.js`, `scripts/check-adblock.mjs` |
| `VISION_DEMO_URL`                                                              | Vision "Try Live Demo Now"                                               |
| `DISCORD_URL`, `SUBSTACK_URL`, `YOUTUBE_URL`, `LINKEDIN_URL`, `GITHUB_URL`     | footer, CTAs, Organization `sameAs`                                      |

## Forms

- **Contact** (`ContactModal.astro`, rendered by `Nav.astro` on every page): JSON POST to Web3Forms from `modal.js`. An empty key means demo mode: it shows "sent" and sends nothing (a console warning says so). Open it with `<Button {...contactLink}>`. Never write `open="contact"` or the Tally URL directly, or the `CONTACT_FORM` switch stops covering that button.
- **Newsletter** (`NewsletterModal.astro`, on Home, Vision, Services, opened by `<Button open="news">`): JSON POST to the MailerLite embedded form's subscribe URL. reCAPTCHA must be off for that MailerLite form. A honeypot (`botcheck`) replaces it. `modal.js` sends a HEAD probe when the popup opens, to warn visitors whose blocker (AdGuard Popups) stops mailerlite.com.
- Any page with a popup must load `src/scripts/modal.js`. `nav.js` already imports it, so every page that loads `nav.js` or `page.js` has it.
- After setting a real key or URL: make one real submission and confirm it arrives (Web3Forms email / MailerLite subscriber list).

## Consent and analytics

- CookieYes plus GA4 load only in production builds (`npm run build`), never in `npm run dev`.
- `consent-mode.js` is inlined first in `<head>`: every consent type starts denied. GA's script loads only after CookieYes reports `analytics_storage: granted`. Ad and functional signals are forced back to denied, because those categories are hidden in the banner (`src/styles/components/consent.css`).
- The banner only appears on noesis.vision. Run `npm run preview:consent` to see the real banner locally: it serves the build as https://noesis.vision in a fresh Chrome and blocks GA/CookieYes logging, and `--check` runs it headless.

### Click tracking

`src/scripts/analytics.js` sends a GA event for clicks on any element with `data-track`:
`<Button track="cta_contact_form" trackSection="services-hero">` → event `cta_contact_form`
with `section`, `page` and `cta_text`. Reuse the existing event names, which match the previous site's GA history: `cta_contact_form`, `cta_tally_beta`, `cta_demo`, `cta_discord`, `cta_github`, `cta_docs`, `newsletter_open`, `internal_nav`, `scroll_to_section`. Use `trackSection` for where on the page the button is (`<page>-hero`, `<page>-cta`, `navbar`, ...).

## Adding a new third-party service: checklist

1. Put its key/ID/URL in `src/config/integrations.js` with a comment (what it is, where to find it in the vendor's dashboard, what empty means).
2. If it sets cookies or tracks visitors, it must wait for consent like GA does (see `consent-mode.js`), and its CookieYes category must be shown in the banner.
3. Update `/privacy` (`src/pages/privacy.astro`): what data goes to which service, and the cookie list.
4. Add its requests to `EXTRA_REQUESTS` in `scripts/check-adblock.mjs` if they happen after page load, then run `npm run check:adblock`. Avoid class names and ids that blockers hide (`cookie-*`, `consent`, `newsletter-popup`, `social-share`, `ad-*`).
5. Prefer posting to the vendor's API from our own markup over embedding their iframe or widget script. That keeps the site's design, avoids extra cookies, and survives more blockers.
6. Update the README sections "Before going live" and "Consent and analytics".

## Third-party references

- [Web3Forms docs](https://docs.web3forms.com/)
- [MailerLite: embedded forms](https://www.mailerlite.com/help/how-to-create-an-embedded-form)
- [CookieYes help](https://www.cookieyes.com/documentation/), [Google Consent Mode v2](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 events reference](https://developers.google.com/analytics/devguides/collection/ga4/events)
- **Reading GA data**: the `google-analytics` skill from [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates). Installed in this project at `.claude/skills/google-analytics/`. It needs Python packages (`pip install -r .claude/skills/google-analytics/requirements.txt`) and a GA service account (`GOOGLE_ANALYTICS_PROPERTY_ID`, `GOOGLE_APPLICATION_CREDENTIALS`). Use it to analyse traffic and the `cta_*` events above, not to change the site.
