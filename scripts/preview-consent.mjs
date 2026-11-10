// Shows the production build as https://noesis.vision in Chrome, so the CookieYes banner
// (which only appears on the domain its account is set up for) and the consent flow can be
// tried before deploying.
//
// Usage:  npm run preview:consent              (builds first, opens a Chrome window)
//         node scripts/preview-consent.mjs [--check]
//
// - Serves dist/ over HTTPS with a self-signed certificate for noesis.vision
//   (made once with openssl, cached in node_modules/.cache/preview-consent).
// - Chrome runs with a fresh profile each time, so the banner shows on every run, and only
//   its own requests to noesis.vision go to the local server.
// - Nothing is sent to the real Google Analytics property or the CookieYes consent log:
//   those requests are answered locally and printed here instead.
// - --check: headless self-test (banner shows, nothing from Google before consent,
//   Accept All loads Google Analytics); exits with 1 if something is off.

import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";

const HOSTS = ["noesis.vision", "www.noesis.vision"];
const DIST = path.resolve(process.env.DIST_DIR || "dist");
const CACHE = path.resolve("node_modules/.cache/preview-consent");
const CHECK = process.argv.includes("--check");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error(
    "dist/ not found. Run `npm run preview:consent` (it builds first).",
  );
  process.exit(2);
}
const builtHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
if (!builtHtml.includes("cdn-cookieyes.com")) {
  console.error(
    "This build has no CookieYes script (COOKIEYES_ID in src/config/integrations.js is empty?), so there is no banner to preview.",
  );
  process.exit(2);
}

// ---- certificate ----
fs.mkdirSync(CACHE, { recursive: true });
const key = path.join(CACHE, "key.pem");
const cert = path.join(CACHE, "cert.pem");
if (!fs.existsSync(key) || !fs.existsSync(cert)) {
  try {
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        key,
        "-out",
        cert,
        "-days",
        "825",
        "-subj",
        "/CN=noesis.vision",
        "-addext",
        `subjectAltName=${HOSTS.map((h) => `DNS:${h}`).join(",")}`,
      ],
      { stdio: "ignore" },
    );
  } catch (err) {
    console.error(
      "Couldn't create a local certificate: is `openssl` installed?",
      err.message,
    );
    process.exit(2);
  }
}

// ---- local HTTPS server for dist/ ----
const server = https.createServer(
  { key: fs.readFileSync(key), cert: fs.readFileSync(cert) },
  (req, res) => {
    let file = path.join(
      DIST,
      decodeURIComponent(new URL(req.url, "https://x").pathname),
    );
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    if (!file.startsWith(DIST) || !fs.existsSync(file)) {
      const notFound = path.join(DIST, "404.html");
      res.writeHead(404, { "content-type": TYPES[".html"] });
      return res.end(
        fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found",
      );
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  },
);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

// ---- Chrome ----
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "noesis-consent-"));
const launch = {
  channel: process.env.CHROME_PATH ? undefined : "chrome",
  executablePath: process.env.CHROME_PATH || undefined,
  headless: CHECK,
  ignoreHTTPSErrors: true,
  viewport: null,
  args: [
    `--host-resolver-rules=${HOSTS.map((h) => `MAP ${h}:443 127.0.0.1:${port}`).join(",")}`,
  ],
};
let context;
try {
  context = await chromium.launchPersistentContext(profile, launch);
} catch (err) {
  console.error(
    "Couldn't start Chrome. Install Google Chrome or set CHROME_PATH.\n",
    err.message,
  );
  server.close();
  process.exit(2);
}

// What would have gone to Google / CookieYes, answered locally instead
const seen = [];
const report = (line) => {
  seen.push(line);
  console.log(`  ↳ ${line}`);
};
await context.route(
  /^https:\/\/[^/]*(google-analytics\.com|analytics\.google\.com)\//,
  (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const lines = [url.search, ...(req.postData() || "").split("\n")].filter(
      Boolean,
    );
    for (const line of lines) {
      const p = new URLSearchParams(line.replace(/^\?/, ""));
      const event = p.get("en");
      if (!event) continue;
      const params = [...p]
        .filter(([k]) => k.startsWith("ep."))
        .map(([k, v]) => `${k.slice(3)}=${v}`);
      report(
        `Google Analytics (not sent): ${event}${params.length ? ` ${params.join(" ")}` : ""}`,
      );
    }
    route.fulfill({ status: 204 });
  },
);
await context.route(/^https:\/\/log\.cookieyes\.com\//, (route) => {
  report(
    `CookieYes log (not sent): ${new URL(route.request().url()).pathname}`,
  );
  route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
});
context.on("request", (req) => {
  if (/googletagmanager\.com\/gtag\/js/.test(req.url()))
    report("Google Analytics script loaded");
});

const page = context.pages()[0] || (await context.newPage());
const cleanup = () => {
  server.close();
  // Chrome may still be writing to the profile for a moment after the window closes
  try {
    fs.rmSync(profile, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    });
  } catch {
    console.warn(`Couldn't remove the temporary Chrome profile: ${profile}`);
  }
};

if (!CHECK) {
  console.log(
    `\nShowing dist/ as https://noesis.vision in Chrome (fresh profile, so the banner shows).\n` +
      `Google Analytics and CookieYes logging are intercepted and printed here, never sent.\n` +
      `Close the browser window or press Ctrl+C to stop.\n`,
  );
  await page.goto("https://noesis.vision/");
  context.on("close", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    await context.close().catch(() => {});
    cleanup();
    process.exit(0);
  });
} else {
  let failed = 0;
  const ok = (cond, msg) => {
    console.log(`${cond ? "✓" : "✗"} ${msg}`);
    if (!cond) failed++;
  };
  await page.goto("https://noesis.vision/", { waitUntil: "networkidle" });
  const banner = page.locator(".cky-consent-container");
  await banner.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  ok(await banner.isVisible(), "consent banner shows at https://noesis.vision");
  ok(
    !seen.some((l) => l.startsWith("Google")),
    "nothing from Google before a choice",
  );
  await page
    .getByRole("button", { name: /accept all/i })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(3000);
  ok(
    seen.includes("Google Analytics script loaded"),
    "Accept All loads Google Analytics",
  );
  ok(
    seen.some((l) => l.includes("page_view")),
    "page view intercepted, not sent",
  );
  await context.close();
  cleanup();
  console.log(
    failed ? `\n${failed} check(s) failed` : "\n✓ Consent preview works.",
  );
  process.exit(failed ? 1 : 0);
}
