// Contact and newsletter dialogs.
// Each form says where it goes with data-provider:
// - "web3forms" (Web3Form.astro, contact): JSON to Web3Forms; needs WEB3FORMS_ACCESS_KEY.
// - "mailerlite" (MailerLiteForm.astro, newsletter): JSON to a MailerLite embedded form's
//   subscribe URL (data-action); needs MAILERLITE_FORM_ACTION.
// Without its key/URL a form runs in demo mode: the "sent" view appears after a short
// delay and nothing is sent.
// Keys and URLs: src/config/integrations.js
import { WEB3FORMS_ENDPOINT } from "../config/integrations.js";
const DEMO_DELAY = 900;
const TIMEOUT_MS = 15000;
const CLOSE_MS = 220;
const ERROR_TEXT =
  "Sorry, that didn't go through. Please check your connection and try again in a moment.";
// fetch() rejects with a TypeError when the request never reaches the server, which is
// what an ad blocker does (AdGuard's Popups filter blocks every mailerlite.com request).
const BLOCKED_TEXT =
  "Sorry, the signup couldn't be sent. If you use an ad or content blocker, it may be blocking it: please allow this site and try again.";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Before anyone signs up, check whether the newsletter request can leave the browser.
// Same URL and request type as the real signup, so a blocker treats it the same way;
// a HEAD request can't subscribe anyone (MailerLite answers it with 405).
// Blocked requests fail almost at once; a slow failure is a network problem, not a blocker.
const PROBE_BLOCKED_MS = 1500;
const PROBE_TIMEOUT_MS = 5000;
const BLOCKED_NOTICE =
  "Your ad or content blocker is stopping newsletter signups on this site. To subscribe, allow this site in the blocker and reload the page.";

const isBlocked = async (url) => {
  if (!navigator.onLine) return false;
  const started = performance.now();
  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return false;
  } catch (err) {
    return (
      err instanceof TypeError && performance.now() - started < PROBE_BLOCKED_MS
    );
  }
};

const checkReachable = async (form) => {
  if (form.dataset.provider !== "mailerlite" || !form.dataset.action) return;
  const submit = form.querySelector('[type="submit"]');
  const blocked = await isBlocked(form.dataset.action);
  if (submit) submit.disabled = blocked;
  if (blocked) setError(form, BLOCKED_NOTICE);
};

const demo = async (what) => {
  console.warn(`${what} not set: demo mode, nothing was sent.`);
  await wait(DEMO_DELAY);
};

const postJson = async (url, body) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await res.json().catch(() => ({}));
  // Same rule as MailerLite's own form script: non-OK status or success: false is an error
  if (!res.ok || json.success === false) {
    throw new Error(
      json.message || json.body?.message || `HTTP ${res.status} from ${url}`,
    );
  }
  return json;
};

// "fields.email" -> { fields: { email } }, the shape MailerLite's own form script sends
const nest = (entries) => {
  const out = {};
  for (const [name, value] of entries) {
    const [obj, key] = name.split(".");
    if (key) (out[obj] ??= {})[key] = value;
    else out[name] = value;
  }
  return out;
};

const senders = {
  web3forms: async (form, data) => {
    if (!data.access_key)
      return demo(
        "Web3Forms access key (WEB3FORMS_ACCESS_KEY in src/config/integrations.js)",
      );
    const json = await postJson(WEB3FORMS_ENDPOINT, data);
    if (!json.success) throw new Error(json.message || "Web3Forms: no success");
  },
  mailerlite: async (form, data) => {
    const url = form.dataset.action;
    if (!url)
      return demo(
        "MailerLite form URL (MAILERLITE_FORM_ACTION in src/config/integrations.js)",
      );
    await postJson(url, nest(Object.entries(data)));
  },
};

const send = async (form) => {
  const data = Object.fromEntries(new FormData(form));
  // A ticked spam trap means a bot: act as if it worked, send nothing.
  if (data.botcheck) return;
  delete data.botcheck;
  const sender = senders[form.dataset.provider];
  if (!sender)
    throw new Error(`Unknown form provider: ${form.dataset.provider}`);
  await sender(form, data);
};

const setError = (form, message) => {
  const box = form.querySelector("[data-form-error]");
  if (!box) return;
  box.textContent = message || "";
  box.hidden = !message;
};

const showView = (dialog, view) => {
  dialog.querySelectorAll("[data-view]").forEach((el) => {
    el.hidden = el.dataset.view !== view;
  });
};

const openModal = (dialog) => {
  showView(dialog, "form");
  const form = dialog.querySelector("form");
  if (form) {
    setError(form, "");
    checkReachable(form);
  }
  document.documentElement.style.overflow = "hidden";
  dialog.showModal();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => dialog.setAttribute("data-shown", "")),
  );
};

const closeModal = (dialog) => {
  if (!dialog.open) return;
  dialog.removeAttribute("data-shown");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(
    () => {
      dialog.close();
      document.documentElement.style.overflow = "";
    },
    reduced ? 0 : CLOSE_MS,
  );
};

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const dialog = document.getElementById(`modal-${btn.dataset.open}`);
    if (!dialog) return;
    e.preventDefault(); // links with data-open (privacy page) shouldn't navigate
    openModal(dialog);
  });
});

document.querySelectorAll("dialog.modal").forEach((dialog) => {
  dialog
    .querySelectorAll('[data-close], [data-action="closeModal"]')
    .forEach((el) => {
      el.addEventListener("click", () => closeModal(dialog));
    });
  // Esc: animate out instead of closing at once
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal(dialog);
  });
  // A click on the backdrop lands on the dialog element itself
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeModal(dialog);
  });

  const form = dialog.querySelector("form[data-provider]");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    if (submit?.hasAttribute("data-busy")) return;
    setError(form, "");
    submit?.setAttribute("data-busy", "");
    submit?.setAttribute("aria-disabled", "true");
    try {
      await send(form);
      form.reset();
      showView(dialog, "sent");
    } catch (err) {
      console.error("Form submission failed:", err);
      // Never reached the server while online: most likely a blocker
      const blocked = err instanceof TypeError && navigator.onLine;
      setError(
        form,
        blocked && form.dataset.provider === "mailerlite"
          ? BLOCKED_TEXT
          : ERROR_TEXT,
      );
    } finally {
      submit?.removeAttribute("data-busy");
      submit?.removeAttribute("aria-disabled");
    }
  });
});
