// Replaces the CookieYes banner text with our own wording (the dashboard default mentions
// personalised ads, which this site doesn't have). CookieYes renders the banner itself, so
// this swaps the description once the banner is in the page, and again if CookieYes
// re-renders it. The proper long-term place for this text is the CookieYes dashboard.

const buildText = () => {
  const p = document.createElement("p");
  const link = document.createElement("a");
  link.href = "/privacy";
  link.textContent = "privacy page";
  p.append(
    'We use cookies to understand how our site is used. By clicking "Accept All", you consent to analytics cookies. You can change your choice at any time on our ',
    link,
    ".",
  );
  return p;
};

const apply = () => {
  const des = document.querySelector(".cky-consent-container .cky-notice-des");
  if (!des || des.dataset.noesisText) return;
  des.replaceChildren(buildText());
  des.dataset.noesisText = "1";
};

document.addEventListener("cookieyes_banner_load", apply);
// The banner may already be there, or be added or re-rendered later
apply();
new MutationObserver(apply).observe(document.body, { childList: true });
