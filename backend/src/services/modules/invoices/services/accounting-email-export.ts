import Framework from "#src/platform/index";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import Services from "#src/services/index";
import { Context, createContext } from "#src/types";
import { captureException } from "@sentry/node";
import {
  ReceivedEInvoice,
  ReceivedEInvoiceDefinition,
} from "../../e-invoices/entities/received-e-invoice";
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
 * - Purchases (supplier invoices and credit notes): when the document is
 *   booked ("Comptabiliser"). When an e-invoice is attached to it, the file of
 *   the e-invoice is sent instead of our PDF.
 *
 * Only the documents after the activation of the address are sent, and each
 * document only once (one row per document in accounting_email_exports).
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

  const now = Date.now();
  await db.insert<AccountingEmailExports>(
    tnxCtx,
    AccountingEmailExportsDefinition.name,
    {
      client_id: invoice.client_id,
      invoice_id: invoice.id,
      side,
      status: "pending",
      email: address.email,
      source: null,
      received_e_invoice_id: null,
      attempts: 0,
      next_attempt_at: now + EXPORT_DELAY_MS,
      locked_until: null,
      sent_at: null,
      error: null,
      created_at: now,
    }
  );

  // Once the request transaction is committed (the cron catches up restarts)
  setTimeout(
    () => processPendingAccountingExports().catch(captureException),
    EXPORT_DELAY_MS + 1000
  );
};

const isPdf = (data: Buffer) =>
  data.subarray(0, 5).toString("ascii") === "%PDF-";

/**
 * File of an e-invoice: the PDF received (already a Factur-X), or for an XML
 * (CII, UBL) our PDF of the document with the data of the e-invoice embedded.
 */
const getEInvoiceFile = async (
  ctx: Context,
  invoice: Invoices,
  received: ReceivedEInvoice
): Promise<Buffer> => {
  const superpdp = await Services.EInvoices.getClient(ctx);
  const raw = await superpdp.downloadInvoice(received.superpdp_invoice_id);
  if (isPdf(raw.data)) return raw.data;

  const { pdf } = await generatePdf(ctx, invoice, {
    checkedIndexes: {},
    skipFacturX: true,
  });
  const isCii = raw.data
    .subarray(0, 4000)
    .toString("utf-8")
    .includes("CrossIndustryInvoice");
  return await superpdp.convertToFacturX(
    pdf,
    isCii ? { cii: raw.data } : received.en_invoice
  );
};

type ExportResult =
  | { status: "sent"; email: string; source: "document" | "e_invoice" }
  | { status: "skipped"; reason: string };

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

    // Detached from another document already sent: never send it twice
    const sameEInvoice = await db.select<AccountingEmailExports>(
      ctx,
      AccountingEmailExportsDefinition.name,
      { client_id: row.client_id, received_e_invoice_id: received.id },
      { limit: 10 }
    );
    if (
      sameEInvoice.some(
        (r) =>
          r.invoice_id !== invoice.id && ["sent", "sending"].includes(r.status)
      )
    ) {
      return {
        status: "skipped",
        reason: "La facture électronique de ce document a déjà été envoyée.",
      };
    }
    await update({ received_e_invoice_id: received.id });

    try {
      pdf = await getEInvoiceFile(ctx, invoice, received);
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

  const sent = await Framework.PushEMail.push(
    ctx,
    address.email,
    "",
    {
      from: client?.company?.name || client?.company?.legal_name,
      subject: invoice.reference,
      attachments: [{ filename: getInvoicePdfFileName(invoice), content: pdf }],
    },
    client?.smtp
  );
  if (!sent) {
    throw new Error(`L'email n'a pas pu être envoyé à ${address.email}.`);
  }

  return { status: "sent", email: address.email, source };
};

/** Timeline line on the document (success or failure) */
const addTimelineEvent = async (
  ctx: Context,
  row: AccountingEmailExports,
  content: string,
  error?: string
) => {
  await Services.Comments.createEvent(ctx, {
    client_id: row.client_id,
    item_entity: "invoices",
    item_id: row.invoice_id,
    type: "event",
    content,
    // A failure notifies the subscribed users, a success is timeline only
    metadata: (error
      ? { event_type: "accounting_export_failed", error }
      : {}) as any,
    documents: [],
    reactions: [],
  });
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
    const result = await exportDocument(ctx, row, update);
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
      `Accounting export failed for ${row.invoice_id}: ${error}`
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
