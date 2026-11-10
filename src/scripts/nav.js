// Nav background on scroll, the phone menu and smooth section links.
// The contact popup (ContactModal.astro) is rendered by Nav.astro on every page.
import "./modal.js";
const root = document.documentElement;
const burger = document.querySelector("[data-burger]");
const menu = document.querySelector("[data-mobile-menu]");

const onScroll = () =>
  root.toggleAttribute("data-scrolled", (window.scrollY || 0) > 12);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// On the home page, highlight Founders instead of Home while that section is in view
// (desktop links and the phone menu alike).
const homeLinks = document.querySelectorAll('[data-nav="home"].is-active');
const foundersLinks = document.querySelectorAll('[data-nav="founders"]');
const foundersSection = document.getElementById("founders");
if (homeLinks.length && foundersSection) {
  const onFounders = () => {
    const r = foundersSection.getBoundingClientRect();
    const inView = r.top <= window.innerHeight * 0.5 && r.bottom > 60;
    foundersLinks.forEach((a) => a.classList.toggle("is-active", inView));
    homeLinks.forEach((a) => a.classList.toggle("is-active", !inView));
  };
  window.addEventListener("scroll", onFounders, { passive: true });
  window.addEventListener("resize", onFounders);
  onFounders();
}

const setMenu = (open) => {
  if (!menu || !burger) return;
  menu.hidden = !open;
  burger.setAttribute("aria-expanded", String(open));
  root.toggleAttribute("data-menu-open", open);
};

burger?.addEventListener("click", () => setMenu(menu.hidden));
// Close the phone menu on a click/tap anywhere outside it (or the burger).
document.addEventListener("click", (e) => {
  if (!menu || menu.hidden) return;
  const panel = menu.querySelector(".nav-mobile-panel") || menu;
  if (panel.contains(e.target) || burger?.contains(e.target)) return;
  setMenu(false);
});
document
  .querySelectorAll('[data-action="closeMenu"]')
  .forEach((el) => el.addEventListener("click", () => setMenu(false)));
window.addEventListener("resize", () => {
  if (window.innerWidth >= 860) setMenu(false);
});

(function () {
  /* Section links: smooth scrolling, including arriving from another page at a section such as Founders. */
  var KEY = "noesis-scroll-target";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var moveTo = function (el) {
    el.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    // Move keyboard focus too, so Tab continues from the section (and screen readers read
    // it), as a normal in-page link would. Sections aren't focusable by default.
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  };

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || a.target === "_blank") return;
      var u;
      try {
        u = new URL(a.href);
      } catch (err) {
        return;
      }
      var id = decodeURIComponent(u.hash.slice(1));
      if (!id) return;
      if (u.pathname === location.pathname) {
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        moveTo(el);
        try {
          history.pushState(null, "", "#" + id);
        } catch (err) {
          /* history unavailable in this frame */
        }
      } else {
        // Remember the section too, in case the hash does not survive the page change.
        try {
          sessionStorage.setItem(KEY, id);
        } catch (err) {
          /* storage unavailable */
        }
      }
    },
    true,
  );

  var stored = null;
  try {
    stored = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch (err) {
    /* storage unavailable */
  }
  var target = document.getElementById(
    decodeURIComponent(location.hash.slice(1)) || stored || "",
  );
  if (!target) return;

  // Start at the top, let the page transition finish, then glide down to the section.
  try {
    history.scrollRestoration = "manual";
  } catch (err) {
    /* not supported */
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  var started = false;
  var go = function () {
    if (started) return;
    started = true;
    var fonts =
      document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve();
    fonts.then(function () {
      setTimeout(function () {
        moveTo(target);
      }, 120);
    });
  };
  window.addEventListener(
    "pagereveal",
    function (e) {
      if (e.viewTransition) e.viewTransition.finished.then(go, go);
      else go();
    },
    { once: true },
  );
  setTimeout(go, 700);
})();
