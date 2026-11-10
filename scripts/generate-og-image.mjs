// Renders public/og-image.png, the 1200×630 card shown when a page is shared
// (Open Graph / Twitter). Brand book v4: deep navy background, cyan mark, Raleway 600.
// Usage: npm run og-image
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/og-image.png");
// Embedded as a data URL: a page set with setContent() may not load file:// fonts
const FONT = `data:font/woff2;base64,${fs.readFileSync(path.resolve("public/fonts/raleway-latin-wght-normal.woff2")).toString("base64")}`;
const TAGLINE =
  "Harness engineering, skills and AI measurement for production-grade agentic development";

const mark = (color) =>
  `<svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke-linejoin="round" stroke-linecap="round">
    <path d="M12 1.75L20.75 6.75V17.25L12 22.25L3.25 17.25V6.75Z" stroke="${color}" stroke-width="1.5"/>
    <path d="M8.5 15.5V8.5L15.5 15.5V8.5" stroke="${color}" stroke-width="1.5"/>
    ${[
      [8.5, 8.5],
      [8.5, 15.5],
      [15.5, 8.5],
      [15.5, 15.5],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="${color}"/>`)
      .join("")}
  </svg>`;

const html = `<!doctype html><html><head><style>
  @font-face { font-family: Raleway; src: url(${FONT}) format("woff2"); font-weight: 100 900; }
  html, body { margin: 0; width: 1200px; height: 630px; }
  body {
    box-sizing: border-box; padding: 88px 96px; display: flex; flex-direction: column; justify-content: space-between;
    background: radial-gradient(circle at 85% 20%, rgba(126, 227, 232, 0.10), transparent 55%), #1f2130;
    color: #fff; font-family: Raleway, sans-serif;
  }
  .brand { display: flex; align-items: center; gap: 48px; }
  .name { font-size: 124px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; }
  .tagline { max-width: 900px; font-size: 38px; line-height: 1.3; color: #c9ccd6; }
  .url { font-size: 28px; font-weight: 600; color: #7ee3e8; letter-spacing: 0.02em; }
</style></head><body>
  <div class="brand">${mark("#7EE3E8")}<div class="name">Noesis</div></div>
  <div><div class="tagline">${TAGLINE}</div></div>
  <div class="url">noesis.vision</div>
</body></html>`;

const browser = await chromium.launch(
  process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: "chrome" },
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(async () => {
  await document.fonts.load("600 124px Raleway");
  await document.fonts.ready;
});
const usesRaleway = await page.evaluate(() =>
  document.fonts.check("600 124px Raleway"),
);
if (!usesRaleway)
  throw new Error("Raleway didn't load; the card would use a fallback font");
await page.screenshot({ path: OUT });
await browser.close();
console.log(
  `Wrote ${path.relative(process.cwd(), OUT)} (${fs.statSync(OUT).size} bytes)`,
);
