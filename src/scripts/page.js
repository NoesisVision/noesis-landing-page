// Shared behaviour for the Vision and Services pages.
import "./nav.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal sections as they enter the viewport
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.style.opacity = 1;
      e.target.style.transform = "none";
      io.unobserve(e.target);
    });
  },
  { rootMargin: "0px 0px -10% 0px" },
);

if (!reduced) {
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    el.style.opacity = 0;
    el.style.transform = "translateY(28px)";
    el.style.transition = "opacity .9s ease, transform .9s ease";
    io.observe(el);
  });
}

// The dot that lights up before the closing call to action
const endDot = document.querySelector('[data-ref="endDot"]');
const onEndDot = () => {
  const on = endDot.getBoundingClientRect().top < window.innerHeight * 0.72;
  if (!!endDot.__on === on) return;
  endDot.__on = on;
  endDot.style.opacity = on ? 1 : 0;
  endDot.style.background = on ? "#7EE3E8" : "#1F2130";
  endDot.style.borderColor = on ? "#7EE3E8" : "rgba(126,227,232,0.45)";
  endDot.style.boxShadow = on
    ? "0 0 0 6px rgba(126,227,232,0.12), 0 0 22px rgba(126,227,232,0.55)"
    : "none";
  if (on && !reduced && endDot.animate) {
    const ring = document.createElement("div");
    ring.style.cssText =
      "position:absolute;left:50%;top:50%;border-radius:50%;box-sizing:border-box;border:8px solid #7EE3E8;pointer-events:none;transform:translate(-50%,-50%)";
    endDot.appendChild(ring);
    ring.animate(
      [
        { width: "22px", height: "22px", borderWidth: "8px", opacity: 0.2 },
        { width: "82px", height: "82px", borderWidth: "3px", opacity: 0 },
      ],
      { duration: 1500, easing: "cubic-bezier(.33,1,.68,1)", fill: "forwards" },
    ).onfinish = () => ring.remove();
  }
};
if (endDot) {
  window.addEventListener("scroll", onEndDot, { passive: true });
  setTimeout(onEndDot, 300);
}

// Scale the fixed 1920×1080 architecture diagram to its frame
const diag = document.querySelector('[data-ref="diag"]');
if (diag) {
  const fit = () =>
    diag.style.setProperty("--diagScale", diag.clientWidth / 1920);
  new ResizeObserver(fit).observe(diag);
  fit();
}

// FAQ: one answer open at a time
document.querySelectorAll("[data-accordion]").forEach((acc) => {
  const controls = acc.querySelectorAll(".acc-control");
  controls.forEach((ctl) => {
    ctl.addEventListener("click", () => {
      const open = ctl.getAttribute("aria-expanded") === "true";
      controls.forEach((c) => c.setAttribute("aria-expanded", "false"));
      ctl.setAttribute("aria-expanded", String(!open));
    });
  });
});

// Copy buttons on code blocks
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const source = document.querySelector(btn.dataset.copy);
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source.textContent);
      btn.textContent = "Copied";
    } catch (err) {
      btn.textContent = "Press ⌘C";
      const range = document.createRange();
      range.selectNodeContents(source);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 1800);
  });
});

// If a screenshot can't load, show its description instead of an empty frame
document.querySelectorAll("img[data-shot]").forEach((img) => {
  const fallback = () => {
    const note = document.createElement("div");
    note.className = "shot-missing";
    note.textContent = img.alt;
    img.replaceWith(note);
  };
  if (img.complete && img.naturalWidth === 0) fallback();
  else img.addEventListener("error", fallback, { once: true });
});
