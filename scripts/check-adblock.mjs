// Checks the built site (dist/) against real ad-blocker filter lists.
//
// - Cosmetic: every element-hiding rule that would apply on the site's host is run
//   against the DOM of each page (closed modals included), in Chrome.
// - Network: every request a page makes, plus EXTRA_REQUESTS (form submissions),
//   is matched with @ghostery/adblocker.
//
// Usage:  npm run check:adblock            (builds first)
//         node scripts/check-adblock.mjs [--refresh]
// Env:    DIST_DIR     built site to check (default: dist)
//         SITE_HOST    host the rules are evaluated for (default: noesis.vision)
//         CHROME_PATH  Chrome/Chromium executable (default: installed Google Chrome)
//
// Lists are cached in node_modules/.cache/adblock-lists and refreshed once a day.
// Exception rules (#@#) are ignored on purpose, so the result errs on the safe side.
// Exits with 1 if anything would be hidden or blocked.

import { chromium } from "playwright-core";
import { FiltersEngine, Request } from "@ghostery/adblocker";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  COOKIEYES_ID,
  GA_ID,
  WEB3FORMS_ENDPOINT,
} from "../src/config/integrations.js";

const HOST = process.env.SITE_HOST || "noesis.vision";
const DIST = path.resolve(process.env.DIST_DIR || "dist");
const CACHE = path.resolve("node_modules/.cache/adblock-lists");
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const REFRESH = process.argv.includes("--refresh");

const LISTS = {
  easylist: "https://easylist.to/easylist/easylist.txt",
  easyprivacy: "https://easylist.to/easylist/easyprivacy.txt",
  "ubo-privacy":
    "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt",
  "adguard-tracking":
    "https://filters.adtidy.org/extension/ublock/filters/3.txt",
  "fanboy-annoyance": "https://secure.fanboy.co.nz/fanboy-annoyance.txt",
  "ubo-filters":
    "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt",
  "ubo-annoyances-cookies":
    "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances-cookies.txt",
  "ubo-annoyances-others":
    "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances-others.txt",
  "adguard-base": "https://filters.adtidy.org/extension/ublock/filters/2.txt",
  "adguard-social": "https://filters.adtidy.org/extension/ublock/filters/4.txt",
  "adguard-cookies":
    "https://filters.adtidy.org/extension/ublock/filters/18.txt",
  "adguard-popups":
    "https://filters.adtidy.org/extension/ublock/filters/19.txt",
  "adguard-mobile-app":
    "https://filters.adtidy.org/extension/ublock/filters/20.txt",
  "adguard-other-annoyances":
    "https://filters.adtidy.org/extension/ublock/filters/21.txt",
  "adguard-widgets":
    "https://filters.adtidy.org/extension/ublock/filters/22.txt",
};

// Requests made later (e.g. on form submit) that a page-load scan never sees.
// `accepted` = a known, deliberate trade-off: reported as a warning, not a failure.
const EXTRA_REQUESTS = [
  { url: WEB3FORMS_ENDPOINT, type: "xhr", page: "/" },
  {
    url: "https://assets.mailerlite.com/public/1381617/forms/148784982943335986/subscribe",
    type: "xhr",
    page: "/",
    accepted:
      "newsletter goes straight to MailerLite; AdGuard Popups blocks all mailerlite.com requests, so those visitors see the blocker hint",
  },
  // Consent banner and analytics: only on the real domain / after consent, so a page-load
  // scan of the local build never sees them. Blocking any of them means the visitor isn't
  // asked or isn't counted, which is the privacy-safe outcome.
  {
    url: `https://cdn-cookieyes.com/client_data/${COOKIEYES_ID}/script.js`,
    type: "script",
    page: "/",
    accepted:
      "no consent banner, so Google Analytics never loads for that visitor",
  },
  {
    url: "https://log.cookieyes.com/api/v1/consent",
    type: "ping",
    page: "/",
    accepted:
      "the visitor's choice still works, it just isn't logged by CookieYes",
  },
  {
    url: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
    type: "script",
    page: "/",
    accepted: "Google Analytics doesn't load; that visitor isn't counted",
  },
  {
    url: `https://region1.google-analytics.com/g/collect?v=2&tid=${GA_ID}`,
    type: "xhr",
    page: "/",
    accepted: "Google Analytics doesn't load; that visitor isn't counted",
  },
];

// Procedural / non-CSS selectors that querySelectorAll can't evaluate
const PROCEDURAL =
  /:style\(|:has-text|:upward|:xpath|:-abp-|:matches-css|:min-text-length|:watch-attr|:others|:matches-path|:remove-attr|:remove-class|:matches-attr|:matches-media|:contains\(/;

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

async function loadLists() {
  fs.mkdirSync(CACHE, { recursive: true });
  const out = {};
  for (const [name, url] of Object.entries(LISTS)) {
    const file = path.join(CACHE, `${name}.txt`);
    const fresh =
      fs.existsSync(file) &&
      Date.now() - fs.statSync(file).mtimeMs < MAX_AGE_MS;
    if (REFRESH || !fresh) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        fs.writeFileSync(file, await res.text());
      } catch (err) {
        if (!fs.existsSync(file))
          throw new Error(`Could not download ${name}: ${err.message}`, {
            cause: err,
          });
        console.warn(
          `! ${name}: download failed (${err.message}), using cached copy`,
        );
      }
    }
    out[name] = fs.readFileSync(file, "utf8");
  }
  return out;
}

function hostMatches(domain) {
  return HOST === domain || HOST.endsWith(`.${domain}`);
}

function cosmeticRules(lists) {
  const rules = [];
  for (const [list, text] of Object.entries(lists)) {
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("!") || line.startsWith("[")) continue;
      const m = line.match(/^([^#]*?)(?:##|#\?#)(.+)$/);
      if (!m) continue;
      const [, domains] = m;
      let selector = m[2];
      if (selector.startsWith("+js") || selector.startsWith("^")) continue;
      const ds = domains === "*" ? [] : domains.split(",").filter(Boolean);
      const included = ds.filter((d) => !d.startsWith("~"));
      const applies = included.length
        ? included.some(hostMatches)
        : !ds.some((d) => hostMatches(d.slice(1)));
      if (!applies) continue;
      selector = selector.replace(/:remove\(\)$/, "");
      if (PROCEDURAL.test(selector)) continue;
      rules.push({ selector, list });
    }
  }
  return rules;
}

function serve(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let file = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
      if (fs.existsSync(file) && fs.statSync(file).isDirectory())
        file = path.join(file, "index.html");
      if (!file.startsWith(dir) || !fs.existsSync(file)) {
        res.writeHead(404);
        return res.end();
      }
      const type = TYPES[path.extname(file)];
      res.writeHead(200, type ? { "content-type": type } : {});
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error(
    "dist/ not found. Run `npm run build` first (or use `npm run check:adblock`).",
  );
  process.exit(2);
}

const lists = await loadLists();
const rules = cosmeticRules(lists);
const engine = FiltersEngine.parse(Object.values(lists).join("\n"), {
  loadCosmeticFilters: false,
});
const pages = fs
  .readdirSync(DIST, { recursive: true })
  .filter((f) => f.endsWith("index.html"))
  .map(
    (f) =>
      "/" +
      f
        .replace(/index\.html$/, "")
        .split(path.sep)
        .join("/"),
  )
  .sort();

console.log(
  `${Object.keys(lists).length} lists, ${rules.length} cosmetic rules apply on ${HOST}; checking ${pages.join(" ")}`,
);

const server = await serve(DIST);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: "chrome" },
);

let problems = 0;
let warnings = 0;
// Checked against each list on its own as well as all together: with everything combined,
// an exception rule in one list can hide a block that a visitor using only another list hits.
const listEngines = Object.entries(lists).map(([name, text]) => [
  name,
  FiltersEngine.parse(text, { loadCosmeticFilters: false }),
]);
for (const r of EXTRA_REQUESTS) {
  const req = Request.fromRawDetails({
    url: r.url,
    type: r.type,
    sourceUrl: `https://${HOST}${r.page}`,
  });
  const blockedBy = listEngines
    .filter(([, e]) => e.match(req).match)
    .map(([name]) => name);
  if (engine.match(req).match && !blockedBy.length)
    blockedBy.push("all lists combined");
  const where = `blocked by ${blockedBy.join(", ")}`;
  if (blockedBy.length && r.accepted) {
    warnings++;
    console.log(`⚠ ${r.url} (${r.type}) ${where}\n    accepted: ${r.accepted}`);
  } else if (blockedBy.length) {
    problems++;
    console.log(`✗ ${r.url} (${r.type}) ${where}`);
  } else if (r.accepted) {
    console.log(`✓ ${r.url} is no longer blocked: remove "accepted" from it`);
  }
}
try {
  for (const url of pages) {
    const page = await browser.newPage();
    const requests = [];
    page.on("request", (r) =>
      requests.push({
        url: r.url().replace(origin, `https://${HOST}`),
        type: r.resourceType() === "document" ? "main_frame" : r.resourceType(),
      }),
    );
    await page.goto(origin + url, { waitUntil: "networkidle" });

    for (const r of requests) {
      const { match, filter } = engine.match(
        Request.fromRawDetails({ ...r, sourceUrl: `https://${HOST}${url}` }),
      );
      if (match) {
        problems++;
        console.log(
          `✗ ${url} request blocked: ${r.url}\n    rule: ${filter.toString()}`,
        );
      }
    }

    const hits = await page.evaluate((rules) => {
      const found = [];
      for (const { selector, list } of rules) {
        let els;
        try {
          els = document.querySelectorAll(selector);
        } catch {
          continue;
        }
        for (const el of els) {
          const cls =
            typeof el.className === "string" ? el.className.trim() : "";
          found.push({
            selector,
            list,
            modal: el.closest("dialog")?.id || "",
            el:
              el.tagName.toLowerCase() +
              (el.id ? `#${el.id}` : "") +
              (cls ? "." + cls.split(/\s+/).join(".") : ""),
            text: (el.textContent || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 50),
          });
        }
      }
      return found;
    }, rules);
    for (const h of hits) {
      problems++;
      console.log(
        `✗ ${url} ${h.modal ? `[modal #${h.modal}] ` : ""}${h.el} "${h.text}" hidden\n    rule: ${h.list} ##${h.selector}`,
      );
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (problems) {
  console.log(
    `\n${problems} problem(s): rename the matching class/id or restructure the element.`,
  );
  process.exit(1);
}
console.log(
  warnings
    ? `✓ Nothing else is hidden or blocked (${warnings} accepted warning(s) above).`
    : "✓ Nothing is hidden or blocked.",
);
