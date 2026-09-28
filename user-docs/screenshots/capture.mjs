// Screenshots of the user manual (../public/images), taken from the app running
// with the demo data of seed.mjs. See README.md.
// Usage: node capture.mjs [shot names...] (all shots by default)
import fs from "fs";
import { execSync } from "child_process";
import { chromium } from "playwright";

const APP = process.env.APP || "http://localhost:3006";
const OUT = new URL("../public/images/", import.meta.url).pathname;
const FONTS = new URL("./node_modules/@fontsource-variable/inter/files/", import.meta.url).pathname;
const S = JSON.parse(fs.readFileSync(new URL("./state.json", import.meta.url)));
const PG = `-h ${process.env.PGHOST || "localhost"} -U ${process.env.PGUSER || "postgres"} ${process.env.PGDATABASE || "linventaire"}`;
const sql = (q) => execSync(`psql ${PG} -tAc "${q}"`).toString().trim();
const inv = (ref) => sql(`select id from invoices where reference='${ref}' and not is_deleted`);
const idOf = (table, col, val) => sql(`select id from ${table} where ${col}='${val}' limit 1`);
const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });

// Headed browser (use xvfb-run on a server): headless Chromium cannot display the PDF of the signing page
const b = await chromium.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
  locale: "fr-FR",
  timezoneId: "Europe/Paris",
  colorScheme: "light",
  // Mac user agent: the app shows ⌘ shortcuts
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
});
await ctx.addInitScript(([t]) => localStorage.setItem("user_authorization", JSON.stringify(t)), [S.token]);
await ctx.addInitScript(() => {
  // Hide development tools (React Query devtools, DevPage link) and use Inter
  // everywhere, so that screenshots look the same on every machine
  const css =
    '.tsqd-parent-container, .tsqd-open-btn-container, [class*="tsqd-"], a[href$="/dev"] { display: none !important; }' +
    ' .radix-themes, :root { --default-font-family: "Inter var", sans-serif !important; }' +
    ' body, button, input, textarea, select { font-family: "Inter var", sans-serif; }';
  const add = () => {
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  };
  if (document.head) add();
  else document.addEventListener("DOMContentLoaded", add);
  // Hide the e-invoice warning shown on every invoice when SuperPDP is not connected
  new MutationObserver(() => {
    document.querySelectorAll("div.text-red-500").forEach((d) => {
      if (d.textContent.trim().startsWith("Impossible de compiler en e-facture")) d.style.display = "none";
    });
  }).observe(document, { childList: true, subtree: true });
});
// The app loads Inter from rsms.me: serve it locally so that screenshots don't depend on the network
await ctx.route("https://rsms.me/**", (route) => {
  const u = route.request().url();
  const headers = { "Access-Control-Allow-Origin": "*" };
  if (u.endsWith(".css")) {
    const latin =
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
    const ext =
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
    const face = (name, file, range) =>
      `@font-face{font-family:'${name}';font-style:normal;font-weight:100 900;font-display:block;src:url(https://rsms.me/inter/${file}) format('woff2');unicode-range:${range};}`;
    const css = ["Inter var", "Inter", "InterVariable"].map((n) => face(n, "latin.woff2", latin) + face(n, "latin-ext.woff2", ext)).join("\n");
    return route.fulfill({ status: 200, contentType: "text/css", body: css, headers });
  }
  const f = u.endsWith("latin-ext.woff2") ? "inter-latin-ext-wght-normal.woff2" : "inter-latin-wght-normal.woff2";
  return route.fulfill({ status: 200, contentType: "font/woff2", body: fs.readFileSync(FONTS + f), headers });
});
await ctx.route("https://do.featurebase.app/**", (route) => route.abort());

const p = await ctx.newPage();
const base = APP + "/" + S.client_id;
const size = (width, height) => p.setViewportSize({ width, height });
const go = async (path, wait = 2500) => {
  await p.mouse.move(0, 0);
  await p.goto(base + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(wait);
};
const shot = async (name, opts = {}) => {
  const vp = p.viewportSize();
  let clip = opts.clip;
  if (opts.dialog) {
    // Modal: the dialog with a margin around it
    const bb = await p
      .getByText(opts.dialog, { exact: true })
      .last()
      .locator('xpath=ancestor::div[contains(@class,"align-bottom")][1]')
      .boundingBox();
    const pad = 40;
    clip = { x: Math.max(0, bb.x - pad), y: Math.max(0, bb.y - pad), width: Math.min(vp.width, bb.width + 2 * pad), height: Math.min(vp.height, bb.height + 2 * pad) };
  }
  // By default: the page without the sidebar
  if (!clip && !opts.page) clip = { x: 256, y: 0, width: vp.width - 256, height: opts.h || vp.height };
  await p.screenshot({ path: OUT + name + ".png", clip });
  console.log("ok", name);
};

const shots = {
  async "tableau-de-bord"() {
    await size(1440, 900);
    await go("/home");
    await shot("tableau-de-bord", { h: 800 });
  },
  async "devis-liste"() {
    await size(1840, 900);
    await go("/i/quotes");
    await shot("devis-liste", { h: 580 });
  },
  async "devis-accepte"() {
    await size(1280, 860);
    await go("/i/all/" + inv("D-2026-1"));
    await shot("devis-accepte");
  },
  async "devis-creation"() {
    await size(1280, 860);
    await go("/i/all/" + inv("D-2026-3") + "/form");
    await shot("devis-creation");
  },
  async "devis-envoi"() {
    await size(1280, 860);
    await go("/i/all/" + inv("D-2026-3"));
    await p.getByText("Envoyer", { exact: true }).last().click();
    await p.waitForTimeout(600);
    await p.getByText("Envoyer par email...").click();
    await p.waitForTimeout(1500);
    await shot("devis-envoi", { dialog: "Envoyer le document" });
  },
  async "devis-signature"() {
    await size(1440, 860);
    const s = sql("select id from signing_sessions where recipient_email='bonjour@cafedesarts.fr' order by created_at desc limit 1");
    await p.goto(APP + "/signing-session/" + s + "/view", { waitUntil: "networkidle" });
    await p.waitForTimeout(6000);
    await p.locator('input[placeholder="Ex: Votre numéro de commande"]:visible').first().fill("BC-2026-118");
    // Draw a signature
    const c = await p.locator("canvas:visible").first().boundingBox();
    await p.mouse.move(c.x + 40, c.y + c.height * 0.6);
    await p.mouse.down();
    for (let t = 0; t <= 60; t++) {
      const u = t / 60;
      await p.mouse.move(
        c.x + 30 + u * (c.width - 80) + 14 * Math.sin(u * 18),
        c.y + c.height * 0.55 - 22 * Math.sin(u * 9) * (1 - u * 0.5) + 10 * Math.cos(u * 18)
      );
    }
    await p.mouse.up();
    await p.locator("text=J'ai lu et j'accepte >> visible=true").first().click();
    await p.locator("text=Signature du document >> visible=true").first().click();
    await p.mouse.move(5, 500);
    await p.waitForTimeout(8000);
    await shot("devis-signature", { page: true });
  },
  async "fournir-produits"() {
    await size(1440, 900);
    await go("/i/" + inv("D-2026-1") + "/furnish", 3500);
    await shot("fournir-produits", { h: 620 });
  },
  async facturer() {
    await size(1280, 860);
    await go("/i/all/" + inv("D-2026-4"));
    await p.getByRole("button", { name: "Facturer" }).last().click();
    await p.waitForTimeout(1500);
    await shot("facturer", { dialog: "Créer une facture" });
  },
  async paiement() {
    await size(1280, 860);
    await go("/i/all/" + sql("select id from invoices where type='invoices' and state='sent' and name='Dépannage imprimante'"));
    await p.getByRole("button", { name: "Enregistrer un paiement" }).last().click();
    await p.waitForTimeout(2000);
    await shot("paiement", { clip: { x: 175, y: 45, width: 1060, height: 560 } });
  },
  async "facture-payee"() {
    await size(1280, 860);
    await go("/i/all/" + sql("select id from invoices where type='invoices' and name='Caisse boutique'"));
    await shot("facture-payee");
  },
  async article() {
    await size(1280, 900);
    await go("/products/" + idOf("articles", "internal_reference", "CT-15"));
    await shot("article");
  },
  async contact() {
    await size(1280, 900);
    await go("/contacts/" + idOf("contacts", "business_name", "Boulangerie Dupain"));
    await shot("contact");
  },
  async service() {
    await size(1680, 900);
    await go("/service");
    await shot("service", { h: 520 });
  },
  async stock() {
    await size(1440, 900);
    await go("/stock");
    await shot("stock", { h: 820 });
  },
  async commande() {
    await size(1280, 860);
    await go("/i/all/" + inv("C1"));
    await shot("commande");
  },
  async activite() {
    await size(1280, 860);
    await go("/i/all/" + inv("D-2026-1"));
    await p.getByText("Activité", { exact: true }).last().scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
    await p.mouse.move(800, 500);
    await p.mouse.wheel(0, 2000);
    await p.waitForTimeout(1200);
    await shot("activite");
  },
  async abonnement() {
    await size(1280, 860);
    await go("/i/all/" + inv("D-2026-1"));
    await p.getByText("Récurrence", { exact: true }).first().scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
    await p.mouse.move(800, 500);
    await p.mouse.wheel(0, 250);
    await p.waitForTimeout(800);
    await shot("abonnement");
  },
  async recherche() {
    await size(1280, 860);
    await go("/i/quotes");
    await p.keyboard.press("Meta+Shift+F");
    await p.waitForTimeout(800);
    await p.keyboard.type("total", { delay: 80 });
    await p.waitForTimeout(1500);
    await shot("recherche", { h: 330 });
  },
  async video() {
    // Thumbnail of the presentation video, drawn over the dashboard screenshot
    await size(1280, 720);
    await p.goto(new URL("./video-thumbnail.html", import.meta.url).href);
    await p.waitForTimeout(1000);
    await shot("video", { page: true });
  },
  async crm() {
    await size(1440, 900);
    await go("/crm");
    await shot("crm", { h: 480 });
  },
};

for (const [name, run] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue;
  try {
    await run();
  } catch (e) {
    console.log("FAIL", name, e.message.split("\n")[0]);
  }
}
await b.close();
