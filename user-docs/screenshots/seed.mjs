// Demo data for the user manual screenshots: a company selling cash registers
// ("Caisses & Co") with its clients, articles, a year of paid invoices and one
// quote in every state. Run it against an EMPTY database, see README.md.
import fs from "fs";
import { execSync } from "child_process";

const B = process.env.API || "http://localhost:3000";
const EMAIL = "dev-marie@linventaire.app"; // dev- emails get the OTP 12345678 in development
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let TOKEN = "";

const j = async (method, url, body, attempt = 0) => {
  // Some triggers run after the response: go slowly and retry on server errors
  await sleep(250);
  const r = await fetch(B + url, {
    method,
    headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let d;
  try { d = JSON.parse(t); } catch { d = t; }
  if (!r.ok && r.status >= 500 && attempt < 4) { await sleep(1500); return j(method, url, body, attempt + 1); }
  if (!r.ok) throw new Error(method + " " + url + " " + r.status + " " + t.slice(0, 500));
  return d;
};

const emailValidation = async () => {
  const { token } = await j("POST", "/api/auth/v1/mfa/methods/email/request", { email: EMAIL });
  return (await j("POST", "/api/auth/v1/mfa/methods/email/validate", { code: "12345678", token })).validation_token;
};
const login = async () => {
  try {
    return await j("POST", "/api/auth/v1/login", { type: "email", value: await emailValidation() });
  } catch (e) {
    if (!/No user found/.test(e.message)) throw e;
    await j("POST", "/api/users/v1/users", { email_validation: await emailValidation(), full_name: "Marie Martin", language: "fr" });
    return await j("POST", "/api/auth/v1/login", { type: "email", value: await emailValidation() });
  }
};

TOKEN = (await login()).token;
const S = { token: TOKEN };
const R = (t, id) => `/api/rest/v1/${S.client_id}/${t}` + (id ? "/" + id : "");
const post = (t, b) => j("POST", R(t), b);
const put = (t, id, b) => j("PUT", R(t, id), b);
const get = (t, id) => j("GET", R(t, id));

// --- Company, tags, contacts and articles
{
const addr = (l, zip, city) => ({ address_line_1: l, address_line_2: "", region: "", country: "FR", zip, city });

// Company
const client = await j("POST", "/api/clients/v1/clients", {
  company: { name: "Caisses & Co", legal_name: "Caisses & Co SAS", registration_number: "85234761900018", tax_number: "FR42852347619" },
  address: addr("12 rue des Artisans", "69003", "Lyon"),
  preferences: { language: "fr", currency: "EUR", timezone: "Europe/Paris" },
  payment: { mode: ["bank_transfer", "check"], delay: 30, delay_type: "direct", bank_name: "Banque Populaire", bank_iban: "FR7610907000011234567890185", bank_bic: "CCBPFRPPXXX", late_penalty: "3 fois le taux légal", recovery_fee: "" },
  invoices: { heading: "", footer: "Merci pour votre confiance.", payment_terms: "", tva: "", branding: true, color: "#2563eb", template: "" },
});
S.client_id = client.client_id;

const tags = {};
for (const [n, c] of [["Urgent", "#ef4444"], ["Boulangerie", "#f59e0b"], ["Restauration", "#10b981"], ["Maintenance", "#6366f1"]]) tags[n] = (await post("tags", { name: n, color: c })).id;

const C = {};
const company = (k, name, extra = {}) => post("contacts", { type: "company", is_client: true, business_name: name, business_registered_name: name, language: "fr", currency: "EUR", ...extra }).then((c) => (C[k] = c.id));
await company("dupain", "Boulangerie Dupain", { business_registered_id: "81234567600017", e_invoices_active: true, e_invoices_identifier: "812345676", email: "contact@boulangerie-dupain.fr", phone: "+33 4 78 12 34 56", address: addr("8 place du Marché", "69002", "Lyon"), tags: [tags.Boulangerie] });
await company("cafe", "Café des Arts", { business_registered_id: "79876543400021", e_invoices_active: true, e_invoices_identifier: "798765434", email: "bonjour@cafedesarts.fr", phone: "+33 4 72 00 11 22", address: addr("27 quai Saint-Antoine", "69002", "Lyon"), tags: [tags.Restauration] });
await company("pharma", "Pharmacie du Centre", { business_registered_id: "53412987900019", e_invoices_active: true, e_invoices_identifier: "534129879", email: "pharmacie.centre@orange.fr", address: addr("3 avenue Jean Jaurès", "69007", "Lyon") });
await company("bistrot", "Le Petit Bistrot", { business_registered_id: "90123456700013", e_invoices_active: true, e_invoices_identifier: "901234567", email: "lepetitbistrot@gmail.com", address: addr("14 rue Mercière", "69002", "Lyon"), tags: [tags.Restauration] });
await company("fleurs", "Fleurs & Saisons", { business_registered_id: "84567123900018", e_invoices_active: true, e_invoices_identifier: "845671239", email: "contact@fleurs-saisons.fr", address: addr("5 rue Victor Hugo", "69002", "Lyon") });
C.jean = (await post("contacts", { type: "person", is_client: true, person_first_name: "Jean", person_last_name: "Dupain", email: "jean@boulangerie-dupain.fr", phone: "+33 6 12 34 56 78", language: "fr", has_parents: true, parents: [C.dupain], parents_roles: { [C.dupain]: { role: "Gérant", notes: "" } } })).id;
C.distri = (await post("contacts", { type: "company", is_supplier: true, business_name: "Distrib'Caisse", business_registered_name: "Distrib'Caisse SARL", business_registered_id: "44455566800011", e_invoices_active: true, e_invoices_identifier: "444555668", email: "commandes@distribcaisse.fr", address: addr("ZI des Platières", "69440", "Mornant"), language: "fr" })).id;
C.techno = (await post("contacts", { type: "company", is_supplier: true, business_name: "TechnoPOS", business_registered_name: "TechnoPOS SAS", business_registered_id: "33322211500011", e_invoices_active: true, e_invoices_identifier: "333222115", email: "pro@technopos.fr", address: addr("40 rue de la Villette", "69003", "Lyon"), language: "fr" })).id;

const A = {};
const art = (k, b) => post("articles", { tva: "S:20", ...b }).then((a) => (A[k] = a.id));
await art("caisse", { type: "product", name: "Caisse tactile 15\"", description: "Terminal point de vente tactile 15 pouces, logiciel de caisse certifié NF525 inclus.", internal_reference: "CT-15", supplier_reference: "TP-POS15", price: 1290, unit: "unit", suppliers: [C.techno, C.distri], suppliers_details: { [C.techno]: { reference: "TP-POS15", price: 820, delivery_time: 5, delivery_quantity: 1 }, [C.distri]: { reference: "DC-15T", price: 860, delivery_time: 2, delivery_quantity: 1 } } });
await art("tiroir", { type: "product", name: "Tiroir-caisse", description: "Tiroir-caisse métallique 5 billets / 8 pièces, ouverture automatique.", internal_reference: "TC-01", price: 149, unit: "unit", suppliers: [C.distri], suppliers_details: { [C.distri]: { reference: "DC-TIR5", price: 78, delivery_time: 2, delivery_quantity: 1 } } });
await art("imprimante", { type: "product", name: "Imprimante tickets thermique", description: "Imprimante thermique 80 mm, USB et Ethernet.", internal_reference: "IMP-80", price: 249, unit: "unit", suppliers: [C.techno], suppliers_details: { [C.techno]: { reference: "TP-TM80", price: 139, delivery_time: 5, delivery_quantity: 1 } } });
await art("balance", { type: "product", name: "Balance connectée", description: "Balance poids-prix connectée à la caisse, 15 kg.", internal_reference: "BAL-15", price: 590, unit: "unit", suppliers: [C.distri], suppliers_details: { [C.distri]: { reference: "DC-BAL15", price: 340, delivery_time: 7, delivery_quantity: 1 } } });
await art("rouleaux", { type: "consumable", name: "Rouleaux thermiques 80 mm (lot de 50)", internal_reference: "RL-80", price: 45, unit: "unit", suppliers: [C.distri], suppliers_details: { [C.distri]: { reference: "DC-RL80", price: 21, delivery_time: 2, delivery_quantity: 10 } } });
await art("install", { type: "service", name: "Installation et paramétrage", description: "Installation sur site, paramétrage du catalogue et formation de l'équipe.", internal_reference: "SRV-INST", price: 75, unit: "h" });
await art("formation", { type: "service", name: "Formation utilisateurs", internal_reference: "SRV-FORM", price: 90, unit: "h" });
await art("maintenance", { type: "service", name: "Contrat de maintenance", description: "Assistance téléphonique, mises à jour et intervention sur site sous 24 h.", internal_reference: "SRV-MAINT", price: 39, unit: "unit", subscription: "monthly", tags: [tags.Maintenance] });

Object.assign(S, { C, A, tags });
}

// --- History: paid sales and purchase invoices over the last months, for the dashboard
{
const { C, A } = S;
const accounts = (await j("POST", R("accounting_accounts") + "/search", { options: { limit: 100 } })).list;
const acc = (contact) => accounts.find((a) => a.contact === contact)?.id;
const bank = accounts.find((a) => a.standard_identifier === "512").id;
const arts = {}; for (const k of Object.keys(A)) arts[k] = await get("articles", A[k]);
const line = (k, quantity) => { const a = arts[k]; return { article: a.id, type: a.type, name: a.name, unit: a.unit, quantity, unit_price: a.price, tva: a.tva }; };
const payment = { mode: ["bank_transfer"], delay: 30, delay_type: "direct", bank_name: "Banque Populaire", bank_iban: "FR7610907000011234567890185", bank_bic: "CCBPFRPPXXX", late_penalty: "3 fois le taux légal" };
const clients = [C.cafe, C.pharma, C.bistrot, C.fleurs, C.dupain];
let seed = 7; const rnd = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n); };
const today = new Date();
const months = [];
for (let y = 2025; y <= today.getFullYear(); y++) for (let m = 0; m < 12; m++) { const d = new Date(y, m, 1); if (d < new Date(today.getFullYear(), today.getMonth() - 1, 1)) months.push([y, m]); }
for (const [y, m] of months) {
  const growth = y === 2026 ? 1.3 : 1;
  for (let k = 0; k < 2; k++) {
    const d = new Date(y, m, 5 + 10 * k + rnd(5)).getTime();
    const client = clients[rnd(clients.length)];
    const content = [line("caisse", 1 + Math.round(rnd(2) * growth)), line("install", 2 + rnd(4)), ...(rnd(2) ? [line("imprimante", 1)] : [])];
    const inv = await post("invoices", { type: "invoices", client, language: "fr", currency: "EUR", payment_information: payment, emit_date: d, name: "Équipement caisse", content });
    await put("invoices", inv.id, { state: "sent" });
    const full = await get("invoices", inv.id);
    await post("accounting_transactions", { transaction_date: d + 20 * 86400000, reference: "VIR " + full.reference, debit: bank, credit: acc(client), amount: full.total.total_with_taxes, currency: "EUR", rel_invoices: [inv.id] });
  }
  const d = new Date(y, m, 12).getTime();
  const supplier = rnd(2) ? C.techno : C.distri;
  const sinv = await post("invoices", { type: "supplier_invoices", supplier, language: "fr", currency: "EUR", emit_date: d, name: "Achat matériel", reference: "FA-" + y + "-" + (m + 1) + "-" + rnd(900),
    content: [{ article: A.caisse, type: "product", name: 'Caisse tactile 15"', unit: "unit", quantity: 1 + rnd(3), unit_price: 820, tva: "S:20" }] });
  await put("invoices", sinv.id, { state: "sent" });
  const sfull = await get("invoices", sinv.id);
  await post("accounting_transactions", { transaction_date: d + 25 * 86400000, reference: "PRLV " + sfull.reference, debit: acc(supplier), credit: bank, amount: sfull.total.total_with_taxes, currency: "EUR", rel_invoices: [sinv.id] });
  process.stdout.write(".");
}
console.log(" history done");
}

// --- Quotes in every state
{
const { C, A, tags } = S;
const arts = {};
for (const k of Object.keys(A)) arts[k] = await get("articles", A[k]);
const line = (k, quantity, extra = {}) => { const a = arts[k]; return { article: a.id, type: a.type, name: a.name, description: a.description || "", unit: a.unit, quantity, unit_price: a.price, tva: a.tva, subscription: a.subscription || "", ...extra }; };
const payment = { mode: ["bank_transfer", "check"], delay: 30, delay_type: "direct", bank_name: "Banque Populaire", bank_iban: "FR7610907000011234567890185", bank_bic: "CCBPFRPPXXX", late_penalty: "3 fois le taux légal", recovery_fee: "" };
const day = 86400000; const now = Date.now();
const doc = (b) => post("invoices", { language: "fr", currency: "EUR", payment_information: payment, format: { footer: "Merci pour votre confiance.", branding: true, color: "#2563eb" }, delivery_delay: 15, ...b });
const Q = {};

// Main storyline: bakery, accepted, being fulfilled
Q.dupain = await doc({ type: "quotes", client: C.dupain, contact: C.jean, name: "Équipement caisses boulangerie", emit_date: now - 12 * day, tags: [tags.Boulangerie],
  content: [line("caisse", 2), line("tiroir", 2), line("imprimante", 2), line("balance", 1, { optional: true, optional_checked: true }), line("install", 6), line("maintenance", 2)],
  subscription: { invoice_date: "first_day", invoice_state: "sent", start_type: "after_first_invoice", end_type: "none", renew_as: "draft" } });
// Sent, waiting for signature
Q.cafe = await doc({ type: "quotes", client: C.cafe, name: "Caisse et imprimante bar", emit_date: now - 3 * day, tags: [tags.Restauration], content: [line("caisse", 1), line("imprimante", 1), line("rouleaux", 2), line("install", 3)] });
// Draft
Q.pharma = await doc({ type: "quotes", client: C.pharma, name: "Remplacement caisse comptoir", emit_date: now, content: [line("caisse", 1), line("tiroir", 1), line("install", 2)] });
// Delivered, to invoice
Q.bistrot = await doc({ type: "quotes", client: C.bistrot, name: "Tiroirs-caisse et formation", emit_date: now - 40 * day, tags: [tags.Restauration], content: [line("tiroir", 2), line("formation", 2)] });
// Fully invoiced
Q.fleurs = await doc({ type: "quotes", client: C.fleurs, name: "Caisse boutique", emit_date: now - 75 * day, content: [line("caisse", 1), line("imprimante", 1), line("install", 2)] });

for (const k of ["dupain", "cafe", "bistrot", "fleurs"]) await put("invoices", Q[k].id, { state: "sent" });
for (const k of ["dupain", "bistrot", "fleurs"]) await put("invoices", Q[k].id, { state: "purchase_order" });
for (const k of Object.keys(Q)) Q[k] = await get("invoices", Q[k].id);
console.log(Object.values(Q).map((q) => q.reference + " " + q.state).join(" | "));
Object.assign(S, { Q });
}

// --- Invoices, payment, stock, supplier orders, services, CRM, comment
{
const { C, A, tags, Q } = S;
const day = 86400000; const now = Date.now();
const me = (await j("GET", "/api/users/v1/users/me")).id;
const accounts = (await j("POST", R("accounting_accounts") + "/search", { options: { limit: 100 } })).list;
const acc = (contact) => accounts.find((a) => a.contact === contact)?.id;
const bank = accounts.find((a) => a.standard_identifier === "512").id;
const clone = (q, extra) => { const { id, reference, state, wait_for_completion_since, created_at, updated_at, created_by, updated_by, revisions, display_name, searchable, searchable_generated, state_order, total, transactions, invoiced, articles, cache, next_reminder, reminder_count, ...rest } = q; return { ...rest, ...extra }; };

// Stock locations
const wh = await post("stock_locations", { type: "warehouse", name: "Entrepôt Lyon" });
const shelf = await post("stock_locations", { type: "shelf", name: "Étagère A", parent: wh.id });

// Fleurs: invoiced and paid
const invF = await post("invoices", clone(Q.fleurs, { type: "invoices", state: "draft", from_rel_quote: [Q.fleurs.id], emit_date: now - 50 * day, name: "Caisse boutique", subscription: undefined }));
await put("invoices", invF.id, { state: "sent" });
const invFs = await get("invoices", invF.id);
await post("accounting_transactions", { transaction_date: now - 30 * day, reference: "VIR FLEURS ET SAISONS", debit: bank, credit: acc(C.fleurs), amount: invFs.total.total_with_taxes, currency: "EUR", rel_invoices: [invF.id] });

// Café: an older overdue invoice for consumables
const invC = await post("invoices", { type: "invoices", client: C.cafe, language: "fr", currency: "EUR", payment_information: Q.cafe.payment_information, format: Q.cafe.format, emit_date: now - 45 * day, name: "Rouleaux thermiques",
  content: [Q.cafe.content.find((l) => l.article === A.rouleaux)] });
await put("invoices", invC.id, { state: "sent" });
// Pharmacie: a sent invoice not due yet
const invP = await post("invoices", { type: "invoices", client: C.pharma, language: "fr", currency: "EUR", payment_information: Q.pharma.payment_information, format: Q.pharma.format, emit_date: now - 5 * day, name: "Dépannage imprimante",
  content: [{ ...Q.pharma.content.find((l) => l.article === A.install), quantity: 1 }] });
await put("invoices", invP.id, { state: "sent" });
// Draft invoice
await post("invoices", { type: "invoices", client: C.bistrot, language: "fr", currency: "EUR", payment_information: Q.bistrot.payment_information, format: Q.bistrot.format, emit_date: now, name: "Rouleaux thermiques", content: [{ ...Q.cafe.content.find((l) => l.article === A.rouleaux), quantity: 3 }] });

// Bistrot: delivered stock + done training → À facturer
for (let i = 0; i < 2; i++) await post("stock_items", { state: "delivered", article: A.tiroir, serial_number: "TC-2026-00" + (41 + i), type: "product", quantity: 1, client: C.bistrot, for_rel_quote: Q.bistrot.id, for_rel_quote_content_index: 0, location: shelf.id });
const svcB = await post("service_items", { state: "done", title: "Formation équipe en salle", article: A.formation, quantity_expected: 2, client: C.bistrot, for_rel_quote: Q.bistrot.id, assigned: [me], started_at: now - 20 * day });
await post("service_times", { service: svcB.id, description: "Formation encaissement et clôture de caisse", quantity: 2, unit: "h", date: now - 20 * day, assigned: [me] });

// Dupain: supplier order for the registers and printers, drawers reserved from stock, installation in progress
const order = await post("invoices", { type: "supplier_quotes", supplier: C.techno, language: "fr", currency: "EUR", emit_date: now - 8 * day, from_rel_quote: [Q.dupain.id], name: "Caisses Boulangerie Dupain",
  content: [{ article: A.caisse, type: "product", name: 'Caisse tactile 15"', unit: "unit", quantity: 2, unit_price: 820, tva: "S:20" }, { article: A.imprimante, type: "product", name: "Imprimante tickets thermique", unit: "unit", quantity: 2, unit_price: 139, tva: "S:20" }] });
await put("invoices", order.id, { state: "sent" });
await put("invoices", order.id, { state: "purchase_order" });
for (let i = 0; i < 2; i++) await post("stock_items", { state: "stock", article: A.tiroir, serial_number: "TC-2026-00" + (51 + i), type: "product", quantity: 1, client: C.dupain, for_rel_quote: Q.dupain.id, for_rel_quote_content_index: 1, location: shelf.id });
for (let i = 0; i < 3; i++) await post("stock_items", { state: "stock", article: A.tiroir, serial_number: "TC-2026-00" + (61 + i), type: "product", quantity: 1, location: shelf.id });
await post("stock_items", { state: "stock", article: A.rouleaux, serial_number: "LOT-RL-0926", type: "consumable", quantity: 40, location: wh.id });
await post("stock_items", { state: "stock", article: A.imprimante, serial_number: "TM80-8841207", type: "product", quantity: 1, location: shelf.id });
const svcD = await post("service_items", { state: "todo", title: "Installation caisses Boulangerie Dupain", article: A.install, quantity_expected: 6, client: C.dupain, for_rel_quote: Q.dupain.id, assigned: [me], started_at: now + 3 * day, tags: [tags.Boulangerie] });
await post("service_items", { state: "in_progress", title: "Paramétrage catalogue produits", article: A.install, quantity_expected: 2, client: C.cafe, for_no_quote: false, assigned: [me], started_at: now - 1 * day });
const svcT = await post("service_items", { state: "done", title: "Dépannage téléphonique", article: A.install, quantity_expected: 1, client: C.fleurs, assigned: [me], started_at: now - 2 * day });
await post("service_times", { service: svcT.id, description: "Imprimante ne répond plus, réinstallation du pilote", quantity: 0.5, unit: "h", date: now - 2 * day, assigned: [me] });

// Older supplier order, received and invoiced
const order2 = await post("invoices", { type: "supplier_quotes", supplier: C.distri, language: "fr", currency: "EUR", emit_date: now - 60 * day, name: "Réassort tiroirs et rouleaux",
  content: [{ article: A.tiroir, type: "product", name: "Tiroir-caisse", unit: "unit", quantity: 5, unit_price: 78, tva: "S:20" }, { article: A.rouleaux, type: "consumable", name: "Rouleaux thermiques 80 mm (lot de 50)", unit: "unit", quantity: 10, unit_price: 21, tva: "S:20" }] });
await put("invoices", order2.id, { state: "sent" });
await put("invoices", order2.id, { state: "purchase_order" });
const sinv = await post("invoices", { type: "supplier_invoices", supplier: C.distri, language: "fr", currency: "EUR", emit_date: now - 50 * day, from_rel_quote: [order2.id], name: "Facture Distrib'Caisse", reference: "FA-DC-8812", content: (await get("invoices", order2.id)).content });

// CRM
for (const [state, desc, contact] of [["new", "Boulangerie Martin : 3 points de vente", null], ["qualified", "Brasserie du Parc : renouvellement caisses", C.bistrot], ["proposal", "Café des Arts : caisse bar", C.cafe], ["new", "Salon de coiffure Lumière", null], ["won", "Boulangerie Dupain : équipement complet", C.dupain]])
  await post("crm_items", { state, notes: desc, contacts: contact ? [contact] : [], seller: me, assigned: [me] });

// A comment on the main quote
try { await post("comments", { item_entity: "invoices", item_id: Q.dupain.id, content: "Livraison des caisses prévue jeudi, @Marie Martin peux-tu confirmer l'installation ?", type: "comment" }); } catch (e) { console.log("comment", e.message.slice(0, 200)); }
}

// --- A signing session on the sent quote, to capture the page the client sees
{
const quote = S.Q.cafe;
await put("invoices", quote.id, { recipients: [{ email: "bonjour@cafedesarts.fr", role: "signer" }] });
await j("POST", `/api/signing-sessions/v1/${S.client_id}/send-invoice/${quote.id}`, { recipients: [{ email: "bonjour@cafedesarts.fr", role: "signer" }] });
}

// Without network access the French directory lookup resets the e-invoicing status
// of the contacts, which would show warnings on every screenshot
execSync(`psql -h ${process.env.PGHOST || "localhost"} -U ${process.env.PGUSER || "postgres"} ${process.env.PGDATABASE || "linventaire"} -c "UPDATE contacts SET e_invoices_active = true, e_invoices_identifier = left(business_registered_id, 9) WHERE type = 'company'"`);

fs.writeFileSync(new URL("./state.json", import.meta.url), JSON.stringify(S, null, 1));
console.log("Seeded company", S.client_id);
