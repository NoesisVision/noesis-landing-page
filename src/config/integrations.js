// Every third-party key, ID and service URL the site uses, in one place.
// All of these end up in the public HTML/JS, so none of them is a secret.
// Plain ESM with no Astro imports: used by components, browser scripts and scripts/*.mjs.

// ---------------------------------------------------------------------------------------
// Contact ("Request Contact") and Vision beta ("Join Beta") forms
// ---------------------------------------------------------------------------------------
// Both are the site's own popups (ContactModal.astro, BetaModal.astro), sent through
// Web3Forms. Each has its own Web3Forms form (and key), so their submissions stay
// apart in the Web3Forms dashboard.

// Web3Forms access keys (https://app.web3forms.com > the form). Public by design.
// Empty = demo mode: that popup shows "Thanks" and sends nothing.
export const WEB3FORMS_ACCESS_KEY = "9e7e863b-656f-4635-9c22-8203d4b24677";
export const WEB3FORMS_BETA_ACCESS_KEY = "6efe50bf-282c-4b53-b171-93170630b0da";
export const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

// ---------------------------------------------------------------------------------------
// Newsletter (NewsletterModal.astro)
// ---------------------------------------------------------------------------------------
// MailerLite embedded form's subscribe URL, including ?signature=... (MailerLite > Forms >
// the form > embed code, the form's `action`). Turn reCAPTCHA OFF for that form first:
// its key only works inside MailerLite's iframe, so signups from this site would fail.
// The form noesis.vision used is:
//   https://assets.mailerlite.com/public/1381617/forms/148784982943335986/subscribe?signature=7abd42a91e9a728426c14c0e66d845fcb896b2e188896a27843cadc12328bf43
// Empty = demo mode: the popup shows "Thank you" and sends nothing.
export const MAILERLITE_FORM_ACTION =
  "https://assets.mailerlite.com/public/1381617/forms/148784982943335986/subscribe?signature=7abd42a91e9a728426c14c0e66d845fcb896b2e188896a27843cadc12328bf43";

// ---------------------------------------------------------------------------------------
// Consent banner and analytics (Base.astro, src/scripts/consent-mode.js)
// ---------------------------------------------------------------------------------------
// Loaded only in production builds (`npm run build`), never in `npm run dev`.
// Empty = off. GA needs CookieYes: it only loads after the visitor accepts "analytics".
// The banner only shows on the domain the CookieYes account is set up for (noesis.vision).
export const COOKIEYES_ID = "fbd6d7186dddc4d44c31a17d";
export const GA_ID = "G-2BF7VRSXYF";

// ---------------------------------------------------------------------------------------
// Noesis Vision product (vision page)
// ---------------------------------------------------------------------------------------
export const VISION_DEMO_URL = "http://98.86.2.2:5000";

// ---------------------------------------------------------------------------------------
// Community and social profiles (footer, CTAs, schema.org sameAs)
// ---------------------------------------------------------------------------------------
export const DISCORD_URL = "https://discord.gg/QF5PMX4Dqg";
export const SUBSTACK_URL = "https://noesisvision.substack.com/";
export const YOUTUBE_URL = "https://www.youtube.com/@noesis.vision";
export const LINKEDIN_URL = "https://www.linkedin.com/company/noesis-vision";
export const GITHUB_URL = "https://github.com/NoesisVision";

// ---------------------------------------------------------------------------------------
// Derived values: nothing to edit below
// ---------------------------------------------------------------------------------------
/** Props for a <Button> that opens the contact form: {...contactLink} */
export const contactLink = { open: "contact" };
