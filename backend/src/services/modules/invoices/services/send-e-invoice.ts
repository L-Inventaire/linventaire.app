import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context, createContext } from "#src/types";
import { captureException } from "@sentry/node";
import Contacts from "../../contacts/entities/contacts";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { generatePdf } from "./generate-pdf";

type EInvoice = NonNullable<Invoices["e_invoice"]>;

/**
 * French e-invoicing only concerns B2B operations between companies
 * established in France. For the others (customer abroad, private individual)
 * there is nothing to transmit: e-reporting is not handled here. Such
 * documents must never be blocked.
 *
 * Returns the reason why the document is not concerned, or null.
 */
export const getEInvoiceSkipReason = (
  customer: Pick<Contacts, "type" | "address"> | null | undefined
): string | null => {
  if (!customer) return null; // Unknown: try, the failure will be recorded

  if (customer.type === "person") {
    return "Client particulier : document non concerné par la facturation électronique.";
  }

  const country = (customer.address?.country || "").trim().toUpperCase();
  if (country && country !== "FR" && country !== "FRANCE") {
    return "Client établi hors de France : document non concerné par la facturation électronique.";
  }

  return null;
};

const setEInvoice = async (
  ctx: Context,
  invoice: Pick<Invoices, "id" | "client_id">,
  e_invoice: EInvoice
) => {
  const db = await Framework.Db.getService();
  await db.update<Invoices>(
    ctx,
    InvoicesDefinition.name,
    { id: invoice.id, client_id: invoice.client_id },
    { e_invoice }
  );
};

/** Timeline line on the document (success or failure) */
const addTimelineEvent = async (
  ctx: Context,
  invoice: Pick<Invoices, "id" | "client_id">,
  content: string,
  error?: string
) => {
  await Services.Comments.createEvent(ctx, {
    client_id: invoice.client_id,
    item_entity: "invoices",
    item_id: invoice.id,
    type: "event",
    content,
    // A failure notifies the subscribed users, a success is timeline only
    metadata: (error
      ? { event_type: "e_invoice_failed", error }
      : {}) as any,
    documents: [],
    reactions: [],
  });
};

/**
 * Generates the Factur-X of an invoice or credit note and uploads it to the
 * e-invoicing platform (SuperPDP). Throws on failure, records nothing.
 */
const uploadEInvoice = async (ctx: Context, invoice: Invoices) => {
  // en16931 is only set by the upsert-hook once SuperPDP validated it
  // (validation_reports), so no need to send an invoice we know is invalid.
  if (!invoice.en16931) {
    throw new Error(
      "La facture n'a pas pu être validée au format EN16931 (informations manquantes ou invalides)."
    );
  }

  const { pdf } = await generatePdf(ctx, invoice, {
    checkedIndexes: {},
    facturx: true, // Throws if the Factur-X can't be generated
  });

  const client = await Services.EInvoices.getClient(ctx);
  return await client.sendInvoice(pdf, invoice.id);
};

/**
 * Transmits an invoice or credit note to the e-invoicing platform (SuperPDP)
 * and records the outcome on the document (`e_invoice`) and in its timeline.
 *
 * - By default it never throws: a failure is recorded (with a notification
 *   to the subscribed users) and reported to Sentry, the document stays sent.
 * - With `throwOnError` (blocking mode), the failure is thrown instead so the
 *   caller can refuse the change (the trigger rolls the transaction back).
 */
export const sendEInvoice = async (
  ctx: Context,
  invoice: Invoices,
  options: { throwOnError?: boolean } = {}
) => {
  const logger = Framework.LoggerDb.get("e-invoices");

  let result: Awaited<ReturnType<typeof uploadEInvoice>>;
  try {
    result = await uploadEInvoice(ctx, invoice);
  } catch (e: any) {
    const error = e?.message || String(e);
    logger.error(ctx, `E-invoice sending failed for ${invoice.id}: ${error}`);
    captureException(e, {
      tags: {
        module: "invoices",
        action: "send_e_invoice",
        reason: "e_invoice_send_failed",
        blocking: options.throwOnError ? "true" : "false",
      },
    });

    if (options.throwOnError) {
      throw new Error(
        `La facture électronique n'a pas pu être envoyée, le document reste en brouillon : ${error}`
      );
    }

    try {
      await setEInvoice(ctx, invoice, {
        status: "failed",
        superpdp_id: 0,
        sent_at: Date.now(),
        error,
      });
      await addTimelineEvent(
        ctx,
        invoice,
        `Échec de l'envoi de la facture électronique : ${error}`,
        error
      );
    } catch (e2) {
      logger.error(ctx, e2 as any);
    }
    return;
  }

  await setEInvoice(ctx, invoice, {
    status: "uploaded",
    superpdp_id: result.id,
    sent_at: Date.now(),
    error: "",
  });
  await addTimelineEvent(
    ctx,
    invoice,
    `Facture électronique envoyée avec succès (SuperPDP #${result.id}).`
  );
};

/** Records that the document is not concerned by e-invoicing (never blocks) */
export const skipEInvoice = async (
  ctx: Context,
  invoice: Invoices,
  reason: string
) => {
  await setEInvoice(ctx, invoice, {
    status: "skipped",
    superpdp_id: 0,
    sent_at: Date.now(),
    error: reason,
  });
};

/**
 * Non blocking mode: the document is flagged "pending" in the same
 * transaction as its state change, and transmitted right after by
 * `processPendingEInvoices`. This way the transmission never runs inside (nor
 * slows down) the request transaction, and it is never lost: a rolled back
 * change leaves nothing pending, and a restart is caught up by the cron.
 */
export const queueEInvoice = async (ctx: Context, invoice: Invoices) => {
  await setEInvoice(ctx, invoice, {
    status: "pending",
    superpdp_id: 0,
    sent_at: Date.now(),
    error: "",
  });
  // Once the request transaction is committed
  setTimeout(() => processPendingEInvoices().catch(captureException), 3000);
};

// A transmission claimed but never completed (crash, restart) is retried
const STALE_SENDING_MS = 10 * 60 * 1000;

let processing = false;

export const processPendingEInvoices = async () => {
  if (processing) return;
  processing = true;
  const logger = Framework.LoggerDb.get("e-invoices");
  const ctx = createContext("e-invoices", "SYSTEM");

  try {
    const db = await Framework.Db.getService();
    for (let batch = 0; batch < 50; batch++) {
      // Claim atomically (several instances may run this)
      const claimed = await db.custom<{
        rows: { client_id: string; id: string }[];
      }>(
        ctx,
        `UPDATE invoices
         SET e_invoice = COALESCE(e_invoice, '{}'::jsonb) || jsonb_build_object('status', 'sending', 'sent_at', $1::bigint)
         WHERE (client_id, id) IN (
           SELECT client_id, id FROM invoices
           WHERE is_deleted = false
             AND (e_invoice->>'status' = 'pending'
               OR (e_invoice->>'status' = 'sending' AND (e_invoice->>'sent_at')::bigint < $2::bigint))
           LIMIT 10
           FOR UPDATE SKIP LOCKED
         )
         RETURNING client_id, id`,
        [Date.now(), Date.now() - STALE_SENDING_MS]
      );
      if (!claimed.rows.length) break;

      for (const row of claimed.rows) {
        const clientCtx: Context = { ...ctx, client_id: row.client_id };
        try {
          const invoice = await db.selectOne<Invoices>(
            clientCtx,
            InvoicesDefinition.name,
            { client_id: row.client_id, id: row.id }
          );
          if (!invoice) continue;
          await sendEInvoice(clientCtx, invoice);
        } catch (e: any) {
          logger.error(clientCtx, `E-invoice queue error for ${row.id}`, e);
          captureException(e);
        }
      }
    }
  } finally {
    processing = false;
  }
};
