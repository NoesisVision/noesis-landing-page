// Google Consent Mode v2 + Google Analytics loader. Inlined into <head> by Base.astro,
// before the CookieYes script, so it runs first. Classic script on purpose (no imports).
//
// 1. Every consent type starts denied.
// 2. CookieYes reports the visitor's choice by pushing gtag('consent', 'update', ...) into
//    dataLayer (a tick after its own events, so this listens to dataLayer itself rather
//    than to the events). After each of those updates:
//    - the signals for categories this site doesn't use are set back to denied (CookieYes
//      grants them on "Accept All", but they're hidden in the preference centre, see
//      consent.css), so consent covers only what the visitor could see;
//    - if analytics was granted, Google's script is loaded (once), after the grant.
// GA_ID comes from <html data-ga-id> (Base.astro). Without it nothing is loaded.
(function () {
  var GA_ID = document.documentElement.getAttribute("data-ga-id");
  var NOT_USED = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
  };

  var dataLayer = (window.dataLayer = window.dataLayer || []);
  window.gtag = function () {
    dataLayer.push(arguments);
  };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
  });

  var loadAnalytics = function () {
    if (window.__noesisAnalyticsLoaded || !GA_ID) return;
    window.__noesisAnalyticsLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  };

  // Watch every push. When gtag.js loads it wraps dataLayer.push and keeps calling the
  // function it found (this one), so later CookieYes updates still come through here.
  var arrayPush = Array.prototype.push;
  var ownUpdate = false;
  dataLayer.push = function () {
    var result = arrayPush.apply(dataLayer, arguments);
    if (ownUpdate) return result;
    for (var i = 0; i < arguments.length; i++) {
      var cmd = arguments[i];
      if (cmd && cmd[0] === "consent" && cmd[1] === "update" && cmd[2]) {
        ownUpdate = true;
        try {
          window.gtag("consent", "update", NOT_USED);
        } finally {
          ownUpdate = false;
        }
        if (cmd[2].analytics_storage === "granted") loadAnalytics();
      }
    }
    return result;
  };
})();
