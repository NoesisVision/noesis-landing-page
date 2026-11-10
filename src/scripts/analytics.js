// Click events for Google Analytics, same names and parameters as on the previous
// noesis.vision, e.g. <Button track="cta_contact_form" trackSection="navbar">.
// Consent and loading Google's script are handled by consent-mode.js (inlined in <head>):
// events are only sent once the visitor has accepted analytics and GA has loaded.

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (!el || !window.__noesisAnalyticsLoaded) return;
  window.gtag("event", el.dataset.track, {
    page: location.pathname,
    section: el.dataset.trackSection || "",
    cta_text: el.textContent.trim(),
  });
});
