import { id } from "#src/platform/db/utils";
import Services from "#src/services/index";
import { Router } from "express";
import _, { max, min } from "lodash";
import Framework from "../../../platform";
import { search } from "../../../services/rest/services/rest";
import { buildQueryFromMap } from "../../../services/rest/services/utils";
import { checkRole } from "../../common";
import { Ctx } from "../../utils";
import Articles, { ArticlesDefinition } from "../articles/entities/articles";
import StockItems, {
  StockItemsDefinition,
} from "../stock/entities/stock-items";
import Invoices, { InvoicesDefinition } from "./entities/invoices";
import { computePartialInvoice } from "./services/compute-partial-invoice";
import {
  calcValuesToFurnishInvoice,
  furnishInvoices,
} from "./services/furnish-invoices";
import { generatePdf, sendPdf } from "./services/generate-pdf";
import {
  standardCodeToUnit,
  standardCodeToVatCategory,
  standardCodeToVatValue,
  vatCategoryCodeToExemptionReason,
} from "@shared/consts";
import { convertInternalToEN16931 } from "../e-invoices/services";
import { getResolvedEntities } from "../e-invoices/services/invoice-converter";

export const registerRoutes = (router: Router) => {
  router.get("/maps", async (req, res) => {
    res.json({
      units: standardCodeToUnit,
      vat: standardCodeToVatCategory,
      vat_values: standardCodeToVatValue,
      vat_exemption: vatCategoryCodeToExemptionReason,
    });
  });

  // Get document PDF ex. /api/invoices/v1/1/invoice/2/pdf?checked={%222%22:1}
  // As you can see in the example, we can override checked items in the invoice
  router.get("/:clientId/invoice/:id/en16931", async (req, res) => {
    const ctx = Ctx.get(req)!.context;
    const db = await Framework.Db.getService();
    const document = await db.selectOne<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {
        id: req.params.id,
        client_id: ctx.client_id,
      }
    );
    if (!document) return res.status(404).json({ error: "Not found" });

    res.json(
      convertInternalToEN16931(
        document,
        await getResolvedEntities(ctx, document)
      )
    );
  });

  // Get document PDF ex. /api/invoices/v1/1/invoice/2/pdf?checked={%222%22:1}
  // As you can see in the example, we can override checked items in the invoice
  router.get("/:clientId/invoice/:id/pdf", async (req, res) => {
    const ctx = Ctx.get(req)!.context;
    const db = await Framework.Db.getService();
    const document = await db.selectOne<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {
        id: req.params.id,
        client_id: ctx.client_id,
      }
    );
    if (!document) return res.status(404).json({ error: "Not found" });

    try {
      const { name, pdf } = await generatePdf(ctx, document, {
        checkedIndexes: req.query.checked
          ? JSON.parse(req.query.checked as string)
          : {},
        as: req.query.as as any,
        content: JSON.parse((req.query.content as string) || "{}") as {
          _index: number;
          quantity: number;
        }[],
        facturx: req.query.facturx === "1",
      });
      res.setHeader("Content-Type", "application/pdf");
      if (req.query.download)
        res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      res.send(pdf);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  router.post(
    "/:clientId/invoice/:id/send",
    checkRole("USER"),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const db = await Framework.Db.getService();
      const document = await db.selectOne<Invoices>(
        ctx,
        InvoicesDefinition.name,
        {
          id: req.params.id,
          client_id: ctx.client_id,
        }
      );
      if (!document) return res.status(404).json({ error: "Not found" });

      await sendPdf(ctx, document, req.body.recipients, {
        as: req.body.as,
        checkedIndexes: req.body.checked || {},
        content: req.body.content || {},
      });

      res.send({ ok: true });
    }
  );

  // Get partial invoice result
  router.post(
    "/:clientId/invoice/:id/partial",
    checkRole("USER"),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const db = await Framework.Db.getService();

      const quote = await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
        id: req.params.id,
        client_id: ctx.client_id,
      });

      if (
        !quote ||
        (quote.type !== "quotes" && quote.type !== "supplier_quotes")
      ) {
        return res.status(404).json({ error: "Not found" });
      }

      const existing = (
        await search<Invoices>(
          ctx,
          InvoicesDefinition.name,
          buildQueryFromMap({
            from_rel_quote: quote.id,
            type: ["invoices", "credit_notes"],
          })
        )
      )?.list;

      const requested = req.body || [];

      return res.json(computePartialInvoice(quote, existing, requested));
    }
  );

  // Realign the billing day of the source recurring quote(s) based on a
  // generated invoice's period start. Used when a user edits the billing period
  // of a generated (or manual) invoice and wants the future invoices of the
  // subscription to follow the new day (e.g. bringing periods back to the 1st of
  // the month instead of the day the first invoice happened to be sent).
  router.post(
    "/:clientId/invoice/:id/sync-subscription-day",
    checkRole("USER"),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const db = await Framework.Db.getService();

      const invoice = await db.selectOne<Invoices>(
        ctx,
        InvoicesDefinition.name,
        {
          id: req.params.id,
          client_id: ctx.client_id,
        }
      );
      if (!invoice) return res.status(404).json({ error: "Not found" });

      const from = req.body?.from ?? invoice.from_subscription?.from;
      if (!from || !invoice.from_rel_quote?.length) {
        return res
          .status(400)
          .json({ error: "Invoice is not linked to a subscription period" });
      }

      // The period boundaries of generated invoices are anchored on the source
      // quote's subscription_started_at (applyOffset preserves the day-of-month,
      // weekday or month/day depending on the frequency). Realigning that anchor
      // on the chosen period start is therefore enough to shift the billing day.
      const newStartedAt = new Date(from);
      const updated: string[] = [];

      for (const quoteId of invoice.from_rel_quote) {
        const quote = await db.selectOne<Invoices>(
          ctx,
          InvoicesDefinition.name,
          {
            id: quoteId,
            client_id: ctx.client_id,
          }
        );
        if (!quote || quote.type !== "quotes" || quote.state !== "recurring") {
          continue;
        }

        await db.update<Invoices>(
          ctx,
          InvoicesDefinition.name,
          { id: quote.id, client_id: quote.client_id },
          {
            subscription_started_at: newStartedAt,
            // Force the next cron run to recompute the upcoming periods from the
            // new anchor (already-invoiced periods are skipped by the dedup).
            subscription_next_invoice_date: newStartedAt,
          }
        );

        await Services.Comments.createEvent(ctx, {
          client_id: quote.client_id,
          item_entity: "invoices",
          item_id: quote.id,
          content: `Le jour de facturation de l'abonnement a été aligné sur le ${
            newStartedAt.toISOString().split("T")[0]
          } depuis la facture ${invoice.reference || invoice.id}.`,
          metadata: {
            event_type: "subscription_billing_day_updated",
            from_invoice: invoice.id,
          },
        });

        updated.push(quote.id);
      }

      return res.json({ ok: true, updated });
    }
  );

  router.post(
    "/:clientId/furnish-invoices",
    checkRole("USER"),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const db = await Framework.Db.getService();
      const quotesIDs = ((req.query.quotes as string) ?? "").split(",");

      if (!quotesIDs || quotesIDs.length === 0) {
        throw new Error("No invoice IDs provided");
      }

      const quotes = await db.select<Invoices>(ctx, InvoicesDefinition.name, {
        id: quotesIDs,
      });

      const result = await furnishInvoices(ctx, {
        quotes,
        overrideFurnishes: req.body.furnishesOverride ?? [],
      });
      return res.json(result);
    }
  );

  router.post(
    "/:clientId/action-furnish-invoices",
    checkRole("USER"),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const db = await Framework.Db.getService();
      const quotesIDs = ((req.query.quotes as string) ?? "").split(",");

      if (!quotesIDs || quotesIDs.length === 0) {
        throw new Error("No invoice IDs provided");
      }

      const quotes = await db.select<Invoices>(ctx, InvoicesDefinition.name, {
        id: quotesIDs,
      });

      const furnishInvoicesData = await furnishInvoices(ctx, {
        quotes,
        overrideFurnishes: req.body.furnishesOverride ?? [],
      });

      for (const action of furnishInvoicesData.actions) {
        if (action.action !== "order-items") continue;

        await Services.Rest.create(ctx, InvoicesDefinition.name, {
          id: id(),
          from_rel_quote: quotesIDs,
          type: "supplier_quotes",
          state: "draft",
          supplier: action.supplier.id,
          content: action.content,
        });
      }

      for (const action of furnishInvoicesData.actions.sort(
        (a, b) => a.quantity - b.quantity
      )) {
        if (action.action !== "withdraw-stock") continue;

        let remainingStockToWithdraw = action.quantity;
        const stockItem = action.stockItem;

        for (const quote of quotes.filter((quote) =>
          quote.content.some((line) => line.article === stockItem.article)
        )) {
          const article = await db.selectOne<Articles>(
            ctx,
            ArticlesDefinition.name,
            { id: stockItem.article }
          );

          const relatedSupplierQuotes = (
            await search<Invoices>(
              ctx,
              InvoicesDefinition.name,
              buildQueryFromMap({
                from_rel_quote: quote.id,
                type: ["supplier_quotes"],
              })
            )
          )?.list;

          const relatedStockItems = (
            await db.select<StockItems>(ctx, StockItemsDefinition.name, {
              article: stockItem.article,
              for_rel_quote: quotes.map((quote) => quote.id),
            })
          ).filter((item) => item.state !== "depleted");

          const { remainingQuantity: remainingQuantityOnQuote } =
            calcValuesToFurnishInvoice(
              article,
              quote.content,
              [],
              relatedSupplierQuotes,
              relatedStockItems
            );

          const toWithdraw = max([
            min([remainingStockToWithdraw, remainingQuantityOnQuote]),
            0,
          ]);

          remainingStockToWithdraw -= toWithdraw;

          if (remainingStockToWithdraw >= 0 && toWithdraw > 0) {
            await db.update<StockItems>(
              ctx,
              StockItemsDefinition.name,
              { id: stockItem.id },
              { quantity: stockItem.quantity - action.quantity }
            );

            await db.insert<Partial<StockItems>>(
              ctx,
              StockItemsDefinition.name,
              {
                ..._.omit(stockItem, "id"),
                id: id(),
                article: stockItem.article,
                quantity: toWithdraw,
                from_rel_original_stock_items: [stockItem?.id],
                for_rel_quote: quote.id,
                state: "reserved",
                notes: "",
                documents: [],
              }
            );
          }
        }
      }

      return res.json(furnishInvoicesData);
    }
  );
};
