#!/bin/sh
# macOS: double-click to view the site in your browser. Needs Node.js (https://nodejs.org).
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is needed to view the site: install it from https://nodejs.org and try again."
  read -r _
  exit 1
fi
exec node serve.mjs "$@"
