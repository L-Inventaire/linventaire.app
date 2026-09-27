# Screenshots of the user manual

The images of `../public/images/` are real screenshots of the app, taken with demo data: a company selling cash registers ("Caisses & Co") with its clients (a bakery, a café...), articles, a year of paid invoices and one quote in every state (draft, sent, accepted, to invoice, completed). Regenerate them when the UI changes.

- `seed.mjs` creates the demo data through the API (and one SQL update, see the end of the file). Run it against an **empty** database.
- `capture.mjs` opens the app with Playwright and takes the screenshots. Each screenshot is a named function in `shots`: add one there, then reference `images/<name>.png` in the Markdown.

## Steps

1. An empty database and the backend in development mode, without captcha (users whose email starts with `dev-` then get the OTP `12345678`):

   ```bash
   psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS linventaire" -c "CREATE DATABASE linventaire"
   cd backend && NODE_ENV=development CAPTCHA_TYPE=none yarn dev
   ```

2. The frontend on http://localhost:3006 (`cd frontend && yarn dev`).

3. The demo data, then the screenshots:

   ```bash
   cd user-docs/screenshots
   npm install
   npx playwright install chromium   # once
   node seed.mjs
   node capture.mjs                  # or only some: node capture.mjs devis-envoi facturer
   ```

The browser is **not headless**: headless Chromium cannot display the PDF shown on the signing page. On a server, run it in a virtual display: `xvfb-run -a -s "-screen 0 1920x1080x24" node capture.mjs`. `CHROMIUM_PATH` sets another Chromium executable.

Environment variables: `API` (backend, default `http://localhost:3000`), `APP` (frontend, default `http://localhost:3006`), `PGHOST`, `PGUSER`, `PGDATABASE` (to look up document ids, defaults `localhost`, `postgres`, `linventaire`).

## What the capture script changes in the app

So that screenshots look the same on every machine and only show what a user sees:

- a Mac user agent (the app shows ⌘ shortcuts), French locale, light theme;
- Inter everywhere, served locally instead of rsms.me;
- the development tools (React Query devtools, DevPage link) are hidden;
- the "Impossible de compiler en e-facture pour l'envoi." warning is hidden: it shows on every invoice when SuperPDP is not connected.
