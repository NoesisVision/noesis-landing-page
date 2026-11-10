#!/usr/bin/env node
// Serves this folder (the built site) at http://localhost:4321. Node.js only, no npm install.
//
//   node serve.mjs [--port 8080] [--no-open]
//
// Copied into dist/ by astro.config.mjs on every build. Works from any directory, and
// after dist/ is copied or zipped elsewhere. Opening index.html straight from disk doesn't
// work: the pages load CSS, JS and other pages from the site root.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const argPort = args.includes("--port")
  ? Number(args[args.indexOf("--port") + 1])
  : NaN;
const START_PORT = argPort || Number(process.env.PORT) || 4321;
const OPEN = !args.includes("--no-open");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json",
};

// URL path -> file inside ROOT, or null. "/services" and "/services/" -> services/index.html
const resolveFile = (urlPath) => {
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const full = path.join(ROOT, path.normalize(rel));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null; // no ../ escapes
  for (const candidate of [
    full,
    path.join(full, "index.html"),
    `${full}.html`,
  ]) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      /* try the next one */
    }
  }
  return null;
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  const urlPath = new URL(req.url, "http://localhost").pathname;
  let file = resolveFile(urlPath);
  let status = 200;
  if (!file) {
    status = 404;
    file = resolveFile("/404.html");
  }
  if (!file) {
    res.writeHead(404, { "Content-Type": TYPES[".txt"] });
    return res.end("Not found");
  }
  res.writeHead(status, {
    "Content-Type":
      TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": fs.statSync(file).size,
    "Cache-Control": "no-cache",
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
});

const openBrowser = (url) => {
  const cmd =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true })
    .on("error", () => {})
    .unref();
};

// One "listening" handler that reads the port actually bound (a retry on a busy port
// must not leave the earlier attempt's callback behind).
server.on("listening", () => {
  const url = `http://localhost:${server.address().port}/`;
  console.log(`Serving ${ROOT}\n→ ${url}\nPress Ctrl+C to stop.`);
  if (OPEN) openBrowser(url);
});
const listen = (port, triesLeft) => {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && triesLeft > 0)
      return listen(port + 1, triesLeft - 1);
    console.error(`Couldn't start the server: ${err.message}`);
    process.exit(1);
  });
  server.listen(port, "127.0.0.1");
};
listen(START_PORT, 20);
