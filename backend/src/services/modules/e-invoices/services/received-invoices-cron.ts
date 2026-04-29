import Framework from "#src/platform/index";
import { Context } from "#src/types";
import { captureException } from "@sentry/node";
import Services from "#src/services/index";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "../entities/e-invoicing-config";
import {
  ReceivedEInvoice,
  ReceivedEInvoiceDefinition,
} from "../entities/received-e-invoice";
import { create } from "#src/services/rest/services/rest";

export const setupCronReceivedInvoices = async () => {
  Framework.Cron.schedule(
    "e_invoices_fetch_received",
    "* * * * *", // Every hour at minute 0
    async (ctx) => {
      const db = await Framework.Db.getService();

      // Get all clients with e-invoicing enabled for receiving
      const configs = await db.select<EInvoicingConfig>(
        ctx,
        EInvoicingConfigDefinition.name,
        {
          client_id: ctx.client_id,
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
            client_id: config.client_id,
          };

          // Get SuperPDP client (automatically decrypts credentials)
          const superpdpClient = await Services.EInvoices.getClient(clientCtx);

          // Get the last processed invoice ID to fetch only new invoices
          const lastInvoices = await db.select<ReceivedEInvoice>(
            clientCtx,
            ReceivedEInvoiceDefinition.name,
            {
              client_id: config.client_id,
            },
            {
              limit: 1,
              index: "superpdp_invoice_id",
              asc: false,
            }
          );
          const startingAfterId =
            lastInvoices.length > 0
              ? lastInvoices[0].superpdp_invoice_id
              : undefined;

          // Fetch received invoices starting after the last processed ID
          const invoices = await superpdpClient.getReceivedInvoices({
            startingAfterId,
          });

          // Process each invoice
          for (const invoice of invoices) {
            try {
              // Check if we already have this invoice
              const existing = await db.select<ReceivedEInvoice>(
                clientCtx,
                ReceivedEInvoiceDefinition.name,
                {
                  client_id: config.client_id,
                  superpdp_invoice_id: invoice.id,
                },
                { limit: 1 }
              );

              if (existing.length > 0) {
                // Already imported, skip
                continue;
              }

              // Fetch full invoice data if en_invoice is incomplete
              let fullInvoice = invoice;
              if (!invoice.en_invoice?.seller || !invoice.en_invoice?.buyer) {
                console.log(
                  `Fetching complete data for invoice ${invoice.id} for client ${ctx.client_id}`
                );
                fullInvoice = await superpdpClient.getInvoice(invoice.id);
              }

              // Extract invoice data
              const enInvoice = fullInvoice.en_invoice;
              if (!enInvoice) {
                console.error(
                  `No EN invoice data for invoice ${fullInvoice.id} for client ${ctx.client_id}`
                );
                continue;
              }

              console.log(enInvoice);

              const seller = enInvoice.seller;
              const buyer = enInvoice.buyer;
              const totals = enInvoice.totals;

              // Skip if seller or buyer are missing (incomplete invoice data)
              if (!seller || !buyer) {
                console.error(
                  `Missing seller or buyer data for invoice ${fullInvoice.id} for client ${ctx.client_id}`
                );
                continue;
              }

              if (false)
                await create<ReceivedEInvoice>(
                  clientCtx,
                  ReceivedEInvoiceDefinition.name,
                  {
                    superpdp_invoice_id: fullInvoice.id,
                    direction: "in",
                    invoice_number: enInvoice.number,
                    issue_date: new Date(enInvoice.issue_date).getTime(),
                    type_code: enInvoice.type_code,
                    currency_code: enInvoice.currency_code,
                    seller_name: seller.name,
                    seller_vat: seller.tax_id || seller.vat || "",
                    seller_address: [
                      seller.postal_address?.street_name,
                      seller.postal_address?.city_name,
                      seller.postal_address?.postal_zone,
                      seller.postal_address?.country,
                    ]
                      .filter(Boolean)
                      .join(", "),
                    buyer_name: buyer.name,
                    buyer_vat: buyer.tax_id || buyer.vat || "",
                    total_amount:
                      totals.tax_exclusive_amount ||
                      totals.invoice_total_amount_without_vat,
                    total_tax_amount:
                      totals.tax_amount || totals.invoice_total_vat_amount || 0,
                    total_amount_with_tax:
                      totals.tax_inclusive_amount ||
                      totals.invoice_total_amount_with_vat,
                    processed: false,
                    supplier_invoice_id: "",
                    processing_error: "",
                    received_at: Date.now(),
                    superpdp_created_at: fullInvoice.created_at
                      ? new Date(fullInvoice.created_at).getTime()
                      : Date.now(),
                  }
                );

              console.log(
                `Imported e-invoice ${fullInvoice.id} for client ${ctx.client_id}`
              );
            } catch (error: any) {
              console.error(
                `Error processing invoice ${invoice.id} for client ${ctx.client_id}:`,
                error
              );
              captureException(error);
            }
          }
        } catch (error: any) {
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
