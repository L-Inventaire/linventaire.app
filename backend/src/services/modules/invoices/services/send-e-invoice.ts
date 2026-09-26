import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context } from "#src/types";
import { captureException } from "@sentry/node";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { generatePdf } from "./generate-pdf";

/**
 * Transmits an invoice or credit note to the e-invoicing platform (SuperPDP).
 *
 * This is NON BLOCKING by design: it never throws. On failure we record the
 * error on the document (`e_invoice`), add a timeline event (which notifies
 * subscribed users) and report it to Sentry. The document itself stays sent.
 */
export const sendEInvoice = async (ctx: Context, invoice: Invoices) => {
  const db = await Framework.Db.getService();
  const logger = Framework.LoggerDb.get("e-invoices");

  const setEInvoice = (e_invoice: Invoices["e_invoice"]) =>
    db.update<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { id: invoice.id, client_id: invoice.client_id },
      { e_invoice }
    );

  try {
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
    const result = await client.sendInvoice(pdf, invoice.id);

    await setEInvoice({
      status: "uploaded",
      superpdp_id: result.id,
      sent_at: Date.now(),
      error: "",
    });

    await Services.Comments.createEvent(ctx, {
      client_id: invoice.client_id,
      item_entity: "invoices",
      item_id: invoice.id,
      type: "event",
      content: `Facture électronique transmise (SuperPDP #${result.id}).`,
      metadata: {} as any, // No event_type: timeline only, no notification
      documents: [],
      reactions: [],
    });
  } catch (e: any) {
    const error = e?.message || String(e);
    logger.error(ctx, `E-invoice sending failed for ${invoice.id}: ${error}`);
    captureException(e, {
      tags: {
        module: "invoices",
        action: "send_e_invoice",
        reason: "e_invoice_send_failed",
      },
    });

    try {
      await setEInvoice({
        status: "failed",
        superpdp_id: 0,
        sent_at: Date.now(),
        error,
      });

      await Services.Comments.createEvent(ctx, {
        client_id: invoice.client_id,
        item_entity: "invoices",
        item_id: invoice.id,
        type: "event",
        content: `E-invoice transmission failed: ${error}`,
        metadata: {
          event_type: "e_invoice_failed",
          error,
        },
        documents: [],
        reactions: [],
      });
    } catch (e2) {
      logger.error(ctx, e2 as any);
    }
  }
};
