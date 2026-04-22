import Framework from "#src/platform/index";
import { Context } from "#src/types";
import { captureException } from "@sentry/node";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "../entities/e-invoicing-config";
import {
  ReceivedEInvoice,
  ReceivedEInvoiceDefinition,
} from "../entities/received-e-invoice";
import { decrypt } from "../utils/encryption";

export const setupCronReceivedInvoices = async () => {
  Framework.Cron.schedule(
    "e_invoices_fetch_received",
    "0 * * * *", // Every hour at minute 0
    async (ctx) => {
      const db = await Framework.Db.getService();

      // Get all clients with e-invoicing enabled for receiving
      const configs = await db.select<EInvoicingConfig>(
        ctx,
        EInvoicingConfigDefinition.name,
        {
          receive_enabled: true,
          connection_status: "connected",
        },
        { limit: 1000 }
      );

      for (const config of configs) {
        try {
          // Create context for this client
          const clientCtx: Context = {
            ...ctx,
            client_id: ctx.client_id,
          };

          // Decrypt credentials
          const clientSecret = decrypt(
            config.integration_client_secret_encrypted
          );
          if (!clientSecret) {
            console.error(
              `Failed to decrypt client secret for client ${ctx.client_id}`
            );
            continue;
          }

          // Get SuperPDP client
          const superpdpClient = Framework.EInvoices.getClient({
            clientId: config.integration_client_id,
            clientSecret,
          });

          // Fetch received invoices
          const invoices = await superpdpClient.getReceivedInvoices();

          // Process each invoice
          for (const invoice of invoices) {
            try {
              // Check if we already have this invoice
              const existing = await db.select<ReceivedEInvoice>(
                clientCtx,
                ReceivedEInvoiceDefinition.name,
                {
                  superpdp_invoice_id: invoice.id,
                },
                { limit: 1 }
              );

              if (existing.length > 0) {
                // Already imported, skip
                continue;
              }

              // Extract invoice data
              const enInvoice = invoice.en_invoice || {};
              const seller = enInvoice.seller || {};
              const buyer = enInvoice.buyer || {};
              const totals = enInvoice.totals || {};

              // TODO Create new received invoice record

              console.log(
                `Imported e-invoice ${invoice.id} for client ${ctx.client_id}`
              );
            } catch (error) {
              console.error(
                `Error processing invoice ${invoice.id} for client ${ctx.client_id}:`,
                error
              );
              captureException(error);
            }
          }
        } catch (error) {
          console.error(
            `Error fetching received invoices for client ${ctx.client_id}:`,
            error
          );
          captureException(error);
        }
      }
    }
  );
};
