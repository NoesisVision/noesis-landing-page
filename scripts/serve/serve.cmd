@echo off
rem Windows: double-click to view the site in your browser. Needs Node.js (https://nodejs.org).
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is needed to view the site: install it from https://nodejs.org and try again. & pause & exit /b 1)
node serve.mjs %*
