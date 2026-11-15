import Framework from "#src/platform/index";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import Services from "#src/services/index";
import { Context, createContext } from "#src/types";
import { computePricesFromInvoice } from "@shared/invoices";
import { captureException } from "@sentry/node";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import {
  ReceivedEInvoice,
  ReceivedEInvoiceDefinition,
} from "../../e-invoices/entities/received-e-invoice";
import { embedFacturXXml } from "../../e-invoices/services/facturx-generator";
import { convertEN16931ToInternal } from "../../e-invoices/services/invoice-converter";
import AccountingEmailExports, {
  AccountingEmailExportsDefinition,
} from "../entities/accounting-email-exports";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { generatePdf } from "./generate-pdf";
import { getInvoicePdfFileName } from "./utils";

/**
 * Copy of the invoices and credit notes sent by email to the accountant (or to
 * its software), as a Factur-X PDF, configured in "Paramètres › Comptabilité":
 *
 * - Sales (invoices, credit notes): when the document is sent.
 * - Received e-invoices: when they are received, attached to a supplier
 *   invoice or not (the file of the e-invoice).
 * - Purchases (supplier invoices and credit notes): when the document is
 *   booked ("Comptabiliser"). When an e-invoice is attached to it, the file of
 *   the e-invoice is sent instead of our PDF, unless it was already sent.
 *
 * Only the documents and e-invoices after the activation of the address are
 * sent, and each one only once (one row per document or e-invoice in
 * accounting_email_exports, and an e-invoice is never sent a second time with
 * its document).
 */

export type AccountingExportSide = AccountingEmailExports["side"];

// Leaves the time to attach the e-invoice to a supplier invoice just created
// from it (the interface attaches it right after the creation)
const EXPORT_DELAY_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 15 * 60 * 1000; // x attempts
const LOCK_MS = 10 * 60 * 1000;

export const getAccountingExportSide = (
  invoice: Pick<Invoices, "type">
): AccountingExportSide | null => {
  if (["invoices", "credit_notes"].includes(invoice.type)) return "sales";
  if (["supplier_invoices", "supplier_credit_notes"].includes(invoice.type))
    return "purchases";
  return null;
};

/** Address of the accountant for this side, null when disabled */
export const getAccountingExportAddress = (
  client: Pick<Clients, "accounting"> | null | undefined,
  side: AccountingExportSide
): { email: string; enabled_at: number } | null => {
  const config = client?.accounting?.email_export;
  const email = (
    (side === "sales" ? config?.sales_email : config?.purchases_email) || ""
  ).trim();
  const enabled_at =
    (side === "sales"
      ? config?.sales_enabled_at
      : config?.purchases_enabled_at) || 0;
  return email && enabled_at ? { email, enabled_at } : null;
};

const newExportRow = (
  row: Pick<
    AccountingEmailExports,
    | "client_id"
    | "invoice_id"
    | "item_entity"
    | "side"
    | "email"
    | "received_e_invoice_id"
    | "next_attempt_at"
  >
): AccountingEmailExports => ({
  ...row,
  status: "pending",
  source: null,
  attempts: 0,
  locked_until: null,
  sent_at: null,
  error: null,
  created_at: Date.now(),
});

/**
 * Called when a document leaves the draft state: queues its copy, in the same
 * transaction as the change (nothing is sent if it is rolled back).
 */
export const queueAccountingEmailExport = async (
  ctx: Context,
  invoice: Invoices
) => {
  const side = getAccountingExportSide(invoice);
  if (!side) return;

  const db = await Framework.Db.getService();
  const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
    id: invoice.client_id,
  });
  const address = getAccountingExportAddress(client, side);
  if (!address) return;

  // Purchases: only the documents entered after the activation (not the
  // older ones booked now)
  if (
    side === "purchases" &&
    new Date(invoice.created_at || 0).getTime() < address.enabled_at
  )
    return;

  const tnxCtx: Context = {
    ...createContext("SYSTEM", "SYSTEM"),
    client_id: invoice.client_id,
    db_tnx: ctx.db_tnx,
  };

  // Each document is sent once (re-opened then booked again: not sent again)
  const existing = await db.selectOne<AccountingEmailExports>(
    tnxCtx,
    AccountingEmailExportsDefinition.name,
    { client_id: invoice.client_id, invoice_id: invoice.id }
  );
  if (existing) return;

  await db.insert<AccountingEmailExports>(
    tnxCtx,
    AccountingEmailExportsDefinition.name,
    newExportRow({
      client_id: invoice.client_id,
      invoice_id: invoice.id,
      item_entity: "invoices",
      side,
      email: address.email,
      received_e_invoice_id: null,
      next_attempt_at: Date.now() + EXPORT_DELAY_MS,
    })
  );

  // Once the request transaction is committed (the cron catches up restarts)
  setTimeout(
    () => processPendingAccountingExports().catch(captureException),
    EXPORT_DELAY_MS + 1000
  );
};

/**
 * Queues the copy of the received e-invoices not sent yet: received after the
 * activation of the purchases address, and neither queued nor sent with their
 * supplier invoice. Run by the cron, so it also catches up the e-invoices
 * received before this was in place, and never needs the reception to know
 * about it.
 */
export const queueReceivedEInvoicesExports = async () => {
  const ctx = createContext("accounting-export", "SYSTEM");
  const db = await Framework.Db.getService();

  const candidates = await db.custom<{
    rows: { client_id: string; id: string; email: string }[];
  }>(
    ctx,
    `SELECT r.client_id, r.id,
            TRIM(c.accounting->'email_export'->>'purchases_email') AS email
     FROM ${ReceivedEInvoiceDefinition.name} r
     JOIN ${ClientsDefinition.name} c ON c.id = r.client_id
     CROSS JOIN LATERAL (
       SELECT COALESCE(NULLIF(c.accounting->'email_export'->>'purchases_enabled_at', '')::numeric, 0) AS enabled_at
     ) a
     WHERE r.is_deleted = false
       AND TRIM(COALESCE(c.accounting->'email_export'->>'purchases_email', '')) <> ''
       AND a.enabled_at > 0
       AND r.received_at >= a.enabled_at
       AND NOT EXISTS (
         SELECT 1 FROM ${AccountingEmailExportsDefinition.name} e
         WHERE e.client_id = r.client_id
           AND (e.invoice_id = r.id OR e.received_e_invoice_id = r.id)
       )
     ORDER BY r.received_at
     LIMIT 500`,
    []
  );

  for (const candidate of candidates?.rows || []) {
    try {
      await db.insert<AccountingEmailExports>(
        { ...ctx, client_id: candidate.client_id },
        AccountingEmailExportsDefinition.name,
        newExportRow({
          client_id: candidate.client_id,
          invoice_id: candidate.id,
          item_entity: "received_e_invoices",
          side: "purchases",
          email: candidate.email,
          received_e_invoice_id: candidate.id,
          next_attempt_at: Date.now(),
        })
      );
    } catch (e: any) {
      // Queued at the same time by another instance (primary key)
      console.error(
        `Accounting export: could not queue the e-invoice ${candidate.id}`,
        e?.message || e
      );
    }
  }
};

const isPdf = (data: Buffer) =>
  data.subarray(0, 5).toString("ascii") === "%PDF-";

/**
 * Document printed for an e-invoice attached to no supplier invoice: built
 * from the data of the e-invoice, never saved (its supplier may not be in the
 * contacts, its lines match no article).
 */
export const getEInvoiceDocument = (
  ctx: Context,
  client: Clients,
  received: ReceivedEInvoice
): { invoice: Invoices; supplier: Contacts } => {
  const seller = received.en_invoice.seller;
  const address = seller?.postal_address;
  const supplier = {
    id: "",
    client_id: received.client_id,
    type: "company",
    business_name: seller?.name || received.seller_name || "",
    business_registered_name: seller?.name || received.seller_name || "",
    business_registered_id: seller?.legal_registration_identifier?.value || "",
    business_tax_id: seller?.vat_identifier || received.seller_vat || "",
    address: {
      address_line_1: address?.address_line1 || "",
      address_line_2: address?.address_line2 || "",
      region: "",
      zip: address?.post_code || "",
      city: address?.city || "",
      country: address?.country_code || "",
    },
    other_addresses: {},
  } as unknown as Contacts;

  const invoice = convertEN16931ToInternal(
    received.en_invoice,
    {
      supplier,
      articles: new Map(),
      defaultArticle: { id: "", type: "service" } as Articles,
      self: client,
    },
    "in",
    { ...ctx, client_id: received.client_id }
  ) as Invoices;
  invoice.id = received.id;
  invoice.format = {} as Invoices["format"];
  invoice.attachments = [];
  invoice.total = computePricesFromInvoice(invoice);

  return { invoice, supplier };
};

/**
 * File of an e-invoice: the PDF received (already a Factur-X), or for an XML
 * our PDF of the document with the data of the e-invoice embedded (CII as is,
 * UBL converted to CII by SuperPDP). Without a document (e-invoice attached
 * to no supplier invoice), the PDF is made from the e-invoice data.
 */
const getEInvoiceFile = async (
  ctx: Context,
  client: Clients,
  received: ReceivedEInvoice,
  invoice: Invoices | null
): Promise<Buffer> => {
  const superpdp = await Services.EInvoices.getClient(ctx);
  const raw = await superpdp.downloadInvoice(received.superpdp_invoice_id);
  if (isPdf(raw.data)) return raw.data;

  let pdf: Buffer;
  if (invoice) {
    pdf = (
      await generatePdf(ctx, invoice, {
        checkedIndexes: {},
        skipFacturX: true,
      })
    ).pdf;
  } else {
    const document = getEInvoiceDocument(ctx, client, received);
    pdf = (
      await generatePdf(ctx, document.invoice, {
        checkedIndexes: {},
        skipFacturX: true,
        counterParty: document.supplier,
      })
    ).pdf;
  }

  const head = raw.data.subarray(0, 4000).toString("utf-8");
  let cii: Buffer;
  if (head.includes("CrossIndustryInvoice")) {
    cii = raw.data;
  } else if (/<(\w+:)?Invoice[\s>]|<(\w+:)?CreditNote[\s>]/.test(head)) {
    // UBL: converted from the file received, never from our en_invoice copy
    // (it can lack the VAT breakdown and the legal notes, so the result would
    // be refused by the business rules)
    cii = await superpdp.convertUblToCII(raw.data);
  } else {
    cii = await superpdp.convertToCII(received.en_invoice);
  }
  return await embedFacturXXml(pdf, cii);
};

/** PDF of the data we have, when the file of the e-invoice cannot be built */
const getEInvoiceFallbackPdf = async (
  ctx: Context,
  client: Clients,
  received: ReceivedEInvoice,
  invoice: Invoices | null
): Promise<Buffer> => {
  if (invoice) {
    return (await generatePdf(ctx, invoice, { checkedIndexes: {} })).pdf;
  }
  const document = getEInvoiceDocument(ctx, client, received);
  return (
    await generatePdf(ctx, document.invoice, {
      checkedIndexes: {},
      skipFacturX: true,
      counterParty: document.supplier,
    })
  ).pdf;
};

type ExportResult =
  | { status: "sent"; email: string; source: "document" | "e_invoice" }
  | { status: "skipped"; reason: string };

/** The e-invoice was sent (or is being sent) with another row */
const isEInvoiceSentElsewhere = async (
  ctx: Context,
  row: AccountingEmailExports,
  receivedId: string
) => {
  const db = await Framework.Db.getService();
  const rows = await db.select<AccountingEmailExports>(
    ctx,
    AccountingEmailExportsDefinition.name,
    { client_id: row.client_id, received_e_invoice_id: receivedId },
    { limit: 10 }
  );
  return rows.some(
    (r) =>
      r.invoice_id !== row.invoice_id && ["sent", "sending"].includes(r.status)
  );
};

const sendCopy = async (
  ctx: Context,
  client: Clients | null,
  email: string,
  subject: string,
  pdf: Buffer
) => {
  const sent = await Framework.PushEMail.push(
    ctx,
    email,
    "",
    {
      from: client?.company?.name || client?.company?.legal_name,
      subject,
      attachments: [
        { filename: getInvoicePdfFileName({ reference: subject }), content: pdf },
      ],
    },
    client?.smtp
  );
  if (!sent) {
    throw new Error(`L'email n'a pas pu être envoyé à ${email}.`);
  }
};

/** Sends the copy of one document, throws when it could not be sent */
const exportDocument = async (
  ctx: Context,
  row: AccountingEmailExports,
  update: (changes: Partial<AccountingEmailExports>) => Promise<void>
): Promise<ExportResult> => {
  const db = await Framework.Db.getService();

  const invoice = await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
    client_id: row.client_id,
    id: row.invoice_id,
  });
  if (!invoice || ["draft", "recurring"].includes(invoice.state)) {
    return { status: "skipped", reason: "Document supprimé ou en brouillon." };
  }

  const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
    id: row.client_id,
  });
  const address = getAccountingExportAddress(client, row.side);
  if (!address) {
    return { status: "skipped", reason: "Envoi au comptable désactivé." };
  }

  // Purchases: the e-invoice attached to the document has priority
  const received =
    row.side === "purchases"
      ? (
          await db.select<ReceivedEInvoice>(
            ctx,
            ReceivedEInvoiceDefinition.name,
            { client_id: row.client_id, supplier_invoice_id: invoice.id },
            { limit: 10 }
          )
        ).find((r) => r.state !== "rejected")
      : undefined;

  let pdf: Buffer | null = null;
  let source: "document" | "e_invoice" = "document";
  if (received) {
    if (new Date(received.received_at || 0).getTime() < address.enabled_at) {
      return {
        status: "skipped",
        reason: "Facture électronique reçue avant l'activation de l'envoi.",
      };
    }

    // Already sent when it was received, or with another document: never
    // send it twice
    if (await isEInvoiceSentElsewhere(ctx, row, received.id)) {
      return {
        status: "skipped",
        reason: "La facture électronique de ce document a déjà été envoyée.",
      };
    }
    await update({ received_e_invoice_id: received.id });

    try {
      pdf = await getEInvoiceFile(ctx, client!, received, invoice);
      source = "e_invoice";
    } catch (e: any) {
      // Our Factur-X of the document is still a good copy
      console.error(
        `Accounting export: e-invoice file of ${invoice.id} unavailable, sending the document PDF`,
        e?.message || e
      );
    }
  }

  if (!pdf) {
    pdf = (await generatePdf(ctx, invoice, { checkedIndexes: {} })).pdf;
  }

  await sendCopy(ctx, client, address.email, invoice.reference, pdf);
  return { status: "sent", email: address.email, source };
};

/** Sends the copy of one received e-invoice, throws when it could not be sent */
const exportReceivedEInvoice = async (
  ctx: Context,
  row: AccountingEmailExports
): Promise<ExportResult> => {
  const db = await Framework.Db.getService();

  const received = await db.selectOne<ReceivedEInvoice>(
    ctx,
    ReceivedEInvoiceDefinition.name,
    { client_id: row.client_id, id: row.invoice_id }
  );
  if (!received) {
    return { status: "skipped", reason: "Facture électronique supprimée." };
  }

  const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
    id: row.client_id,
  });
  const address = getAccountingExportAddress(client, "purchases");
  if (!address) {
    return { status: "skipped", reason: "Envoi au comptable désactivé." };
  }
  if (new Date(received.received_at || 0).getTime() < address.enabled_at) {
    return {
      status: "skipped",
      reason: "Facture électronique reçue avant l'activation de l'envoi.",
    };
  }

  // Sent in the meantime with its supplier invoice (booked)
  if (await isEInvoiceSentElsewhere(ctx, row, received.id)) {
    return {
      status: "skipped",
      reason: "La facture électronique a déjà été envoyée avec son achat.",
    };
  }

  // Attached to a supplier invoice: the same file as when it is booked
  const invoice = received.supplier_invoice_id
    ? await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
        client_id: row.client_id,
        id: received.supplier_invoice_id,
      })
    : null;

  let pdf: Buffer;
  try {
    pdf = await getEInvoiceFile(ctx, client!, received, invoice);
  } catch (e: any) {
    // The accountant still gets a readable copy rather than nothing
    console.error(
      `Accounting export: e-invoice file of ${received.id} unavailable, sending a PDF of its data`,
      e?.message || e
    );
    captureException(e, {
      tags: { module: "invoices", action: "accounting_email_export_file" },
    });
    pdf = await getEInvoiceFallbackPdf(ctx, client!, received, invoice);
  }
  await sendCopy(
    ctx,
    client,
    address.email,
    received.invoice_number || received.id,
    pdf
  );
  return { status: "sent", email: address.email, source: "e_invoice" };
};

/**
 * Timeline lines (success or failure): on the document, or on the e-invoice
 * and the supplier invoice it is attached to.
 */
const addTimelineEvent = async (
  ctx: Context,
  row: AccountingEmailExports,
  content: string,
  error?: string
) => {
  const items: { entity: string; id: string }[] = [];
  if (row.item_entity === "received_e_invoices") {
    items.push({ entity: "received_e_invoices", id: row.invoice_id });
    const db = await Framework.Db.getService();
    const received = await db.selectOne<ReceivedEInvoice>(
      ctx,
      ReceivedEInvoiceDefinition.name,
      { client_id: row.client_id, id: row.invoice_id }
    );
    if (received?.supplier_invoice_id) {
      items.push({ entity: "invoices", id: received.supplier_invoice_id });
    }
  } else {
    items.push({ entity: "invoices", id: row.invoice_id });
  }

  for (const item of items) {
    await Services.Comments.createEvent(ctx, {
      client_id: row.client_id,
      item_entity: item.entity,
      item_id: item.id,
      type: "event",
      content,
      // A failure notifies the subscribed users, a success is timeline only
      metadata: (error
        ? { event_type: "accounting_export_failed", error }
        : {}) as any,
      documents: [],
      reactions: [],
    });
  }
};

const processExport = async (row: AccountingEmailExports) => {
  const logger = Framework.LoggerDb.get("invoices");
  const ctx: Context = {
    ...createContext("accounting-export", "SYSTEM"),
    client_id: row.client_id,
  };
  const db = await Framework.Db.getService();
  const update = (changes: Partial<AccountingEmailExports>) =>
    db.update<AccountingEmailExports>(
      ctx,
      AccountingEmailExportsDefinition.name,
      { client_id: row.client_id, invoice_id: row.invoice_id },
      changes
    );

  const attempts = (row.attempts || 0) + 1;
  try {
    const result =
      row.item_entity === "received_e_invoices"
        ? await exportReceivedEInvoice(ctx, row)
        : await exportDocument(ctx, row, update);
    if (result.status === "skipped") {
      await update({ status: "skipped", error: result.reason, attempts });
      return;
    }
    await update({
      status: "sent",
      email: result.email,
      source: result.source,
      attempts,
      sent_at: Date.now(),
      error: null,
    });
    await addTimelineEvent(
      ctx,
      row,
      `Copie ${
        result.source === "e_invoice" ? "de la facture électronique " : ""
      }envoyée au comptable (${result.email}).`
    );
  } catch (e: any) {
    const error = e?.message || String(e);
    logger.error(
      ctx,
      `Accounting export failed for ${row.item_entity || "invoices"} ${row.invoice_id}: ${error}`
    );
    captureException(e, {
      tags: { module: "invoices", action: "accounting_email_export" },
    });
    const failed = attempts >= MAX_ATTEMPTS;
    await update({
      status: failed ? "failed" : "pending",
      attempts,
      error,
      next_attempt_at: Date.now() + RETRY_DELAY_MS * attempts,
    });
    if (failed) {
      await addTimelineEvent(
        ctx,
        row,
        `Échec de l'envoi de la copie au comptable : ${error}`,
        error
      );
    }
  }
};

let processing = false;

export const processPendingAccountingExports = async () => {
  if (processing) return;
  processing = true;
  const ctx = createContext("accounting-export", "SYSTEM");

  try {
    const db = await Framework.Db.getService();
    for (let batch = 0; batch < 50; batch++) {
      const now = Date.now();
      // Claim atomically (several instances may run this)
      const claimed = await db.custom<{ rows: AccountingEmailExports[] }>(
        ctx,
        `UPDATE ${AccountingEmailExportsDefinition.name}
         SET status = 'sending', locked_until = $1
         WHERE (client_id, invoice_id) IN (
           SELECT client_id, invoice_id FROM ${AccountingEmailExportsDefinition.name}
           WHERE (status = 'pending' AND next_attempt_at <= $2)
             OR (status = 'sending' AND locked_until < $2)
           ORDER BY next_attempt_at
           LIMIT 10
           FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        [now + LOCK_MS, now]
      );
      if (!claimed?.rows?.length) break;

      for (const row of claimed.rows) {
        await processExport(row).catch((e) => {
          console.error(e);
          captureException(e);
        });
      }
    }
  } finally {
    processing = false;
  }
};
