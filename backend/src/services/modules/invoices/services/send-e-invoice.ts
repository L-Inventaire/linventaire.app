import Framework from "#src/platform/index";
import Services from "#src/services/index";
import {
  BadRequestError,
  ConflictError,
  Context,
  createContext,
  NotFoundError,
} from "#src/types";
import { captureException } from "@sentry/node";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import { refreshContactEInvoicesStatus } from "../../contacts/services/refresh-e-invoices-status";
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
    metadata: (error ? { event_type: "e_invoice_failed", error } : {}) as any,
    documents: [],
    reactions: [],
  });
};

/**
 * The customer must be able to receive e-invoices: a French company with a
 * SIREN / SIRET whose e-invoicing is not active is checked again in the
 * directory (its status is only computed when the SIREN changes), and the
 * e-invoice is not sent if it is still not found active.
 *
 * Without SIREN nothing is checked here (the conversion reports it), and a
 * customer not concerned (abroad, private individual) is skipped beforehand.
 */
const checkCustomerEInvoicesActive = async (
  ctx: Context,
  invoice: Invoices
) => {
  if (!invoice.client) return;
  const db = await Framework.Db.getService();
  const customer = await db.selectOne<Contacts>(ctx, ContactsDefinition.name, {
    client_id: invoice.client_id,
    id: invoice.client,
  });
  if (
    !customer ||
    getEInvoiceSkipReason(customer) ||
    !customer.business_registered_id?.trim() ||
    customer.e_invoices_active
  ) {
    return;
  }

  const refreshed = await refreshContactEInvoicesStatus(ctx, customer, {
    force: true,
  });
  if (!refreshed.e_invoices_active) {
    throw new Error(
      `Le client (SIREN ${customer.business_registered_id}) n'a pas été trouvé actif dans l'annuaire de la facturation électronique : vérifiez son SIREN depuis sa fiche contact.`
    );
  }
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

  await checkCustomerEInvoicesActive(ctx, invoice);

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

/**
 * Manual retry of a failed transmission (button on the document).
 *
 * Only a "failed" transmission can be retried: it is claimed atomically
 * (failed -> sending) so a double click, two users or the queue can never
 * transmit the same document twice. A document already uploaded, pending or
 * sending is refused.
 */
export const retryEInvoice = async (ctx: Context, invoiceId: string) => {
  const config = await Services.EInvoices.getConfig(ctx);
  if (config?.connection_status !== "connected") {
    throw BadRequestError(
      "La facturation électronique n'est pas connectée pour cette entreprise."
    );
  }

  const db = await Framework.Db.getService();
  const current = await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
    client_id: ctx.client_id,
    id: invoiceId,
  });
  if (!current) throw NotFoundError("Document introuvable.");
  if (
    !["invoices", "credit_notes"].includes(current.type) ||
    ["draft", "recurring"].includes(current.state)
  ) {
    throw BadRequestError(
      "Seuls les factures et avoirs émis peuvent être envoyés en facture électronique."
    );
  }

  const claimed = await db.custom<{ rows: { id: string }[] }>(
    ctx,
    `UPDATE invoices
     SET e_invoice = COALESCE(e_invoice, '{}'::jsonb) || jsonb_build_object('status', 'sending', 'sent_at', $3::bigint, 'error', '')
     WHERE client_id = $1 AND id = $2 AND is_deleted = false
       AND e_invoice->>'status' = 'failed'
     RETURNING id`,
    [ctx.client_id, invoiceId, Date.now()]
  );
  if (!claimed.rows.length) {
    throw ConflictError(
      "Cette facture électronique n'est pas en échec (déjà envoyée ou en cours d'envoi) : elle ne peut pas être renvoyée."
    );
  }

  const invoice = (await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
    client_id: ctx.client_id,
    id: invoiceId,
  }))!;

  const customer = invoice.client
    ? await db.selectOne<Contacts>(ctx, ContactsDefinition.name, {
        client_id: invoice.client_id,
        id: invoice.client,
      })
    : null;
  const skipReason = getEInvoiceSkipReason(customer);
  if (skipReason) {
    await skipEInvoice(ctx, invoice, skipReason);
  } else {
    // Records the outcome (success or new failure), never throws
    await sendEInvoice(ctx, invoice);
  }

  return (await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
    client_id: ctx.client_id,
    id: invoiceId,
  }))!.e_invoice;
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
