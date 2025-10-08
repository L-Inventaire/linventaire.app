import { Context } from "../../../../types";
import Framework from "../../../../platform";
import StockItems, {
  StockItemsDefinition,
} from "../../stock/entities/stock-items";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import _ from "lodash";
import ServiceItems, {
  ServiceItemsDefinition,
} from "../../service/entities/service-item";
import AccountingTransactions, {
  AccountingTransactionsDefinition,
} from "../../accounting/entities/transactions";
import Services from "#src/services/index";
import { buildQueryFromMap } from "#src/services/rest/services/utils";
import { computePartialInvoice } from "../services/compute-partial-invoice";

// TODO refactor me: this should NOT change the state but only complete the quantities and payments.
// TODO: split this in two triggers, one for quantities and one for state update.

/** Detect when stock_items gets updated to recompute completeness of the invoice (quote/supplier_quote etc) **/
export const setCheckIsCompleteTrigger = () => {
  // ---------
  // Stock items
  // ---------
  Framework.TriggersManager.registerTrigger<StockItems>(StockItemsDefinition, {
    name: "check-is-complete-invoices-stock-items",
    test: (_ctx, entity, oldEntity) => {
      return (
        !entity?._batch_import_ignore_trigger &&
        (entity?.quantity !== oldEntity?.quantity ||
          entity?.article !== oldEntity?.article ||
          entity?.state !== oldEntity?.state ||
          entity?.for_rel_quote !== oldEntity?.for_rel_quote ||
          entity?.from_rel_supplier_quote !==
            oldEntity?.from_rel_supplier_quote)
      );
    },
    callback: async (ctx, entity, oldEntity) => {
      const toRecompute = [];

      const otherDataChanged =
        entity?.quantity !== oldEntity?.quantity ||
        entity?.article !== oldEntity?.article ||
        entity?.state !== oldEntity?.state;

      if (
        entity?.for_rel_quote !== oldEntity?.for_rel_quote ||
        otherDataChanged
      ) {
        // Update quotes
        toRecompute.push(entity?.for_rel_quote, oldEntity?.for_rel_quote);
      }

      if (
        entity?.from_rel_supplier_quote !==
          oldEntity?.from_rel_supplier_quote ||
        otherDataChanged
      ) {
        // Update supplier quote
        toRecompute.push(
          entity?.from_rel_supplier_quote,
          oldEntity?.from_rel_supplier_quote
        );
      }

      for (const id of _.uniq(toRecompute.filter(Boolean))) {
        await recomputeCompletionStatus(
          ctx,
          (entity || oldEntity).client_id,
          id
        );
      }
    },
  });

  // ---------
  // Service items
  // ---------
  Framework.TriggersManager.registerTrigger<ServiceItems>(
    ServiceItemsDefinition,
    {
      name: "check-is-complete-invoices-service-items",
      test: (_ctx, entity, oldEntity) => {
        return (
          entity?.quantity_spent !== oldEntity?.quantity_spent ||
          entity?.article !== oldEntity?.article ||
          entity?.state !== oldEntity?.state ||
          entity?.for_rel_quote !== oldEntity?.for_rel_quote
        );
      },
      callback: async (ctx, entity, oldEntity) => {
        const toRecompute = [];

        const otherDataChanged =
          entity?.quantity_spent !== oldEntity?.quantity_spent ||
          entity?.article !== oldEntity?.article ||
          entity?.state !== oldEntity?.state;

        if (
          entity?.for_rel_quote !== oldEntity?.for_rel_quote ||
          otherDataChanged
        ) {
          // Update quotes
          toRecompute.push(entity?.for_rel_quote, oldEntity?.for_rel_quote);
        }

        for (const id of _.uniq(toRecompute.filter(Boolean))) {
          await recomputeCompletionStatus(
            ctx,
            (entity || oldEntity).client_id,
            id
          );
        }
      },
    }
  );

  // ---------
  // Accounting transactions
  // ---------
  Framework.TriggersManager.registerTrigger<AccountingTransactions>(
    AccountingTransactionsDefinition,
    {
      name: "check-is-complete-invoices-transactions",
      test: (_ctx, entity, oldEntity) => {
        return (
          entity?.amount !== oldEntity?.amount ||
          !_.isEqual(entity?.rel_invoices, oldEntity?.rel_invoices)
        );
      },
      callback: async (ctx, entity, oldEntity) => {
        for (const id of _.uniq(
          [
            ...(entity?.rel_invoices || []),
            ...(oldEntity?.rel_invoices || []),
          ].filter(Boolean)
        )) {
          await recomputeCompletionStatus(ctx, entity.client_id, id);
        }
      },
    }
  );

  // ---------
  // Invoices
  // ---------
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "check-is-complete-invoices-to-quotes",
    test: (_ctx, entity, oldEntity) =>
      entity?.state !== oldEntity?.state ||
      !_.isEqual(entity?.content, oldEntity?.content),
    callback: async (ctx, entity) => {
      if (entity) {
        for (const relQuote of entity.from_rel_quote || []) {
          await recomputeCompletionStatus(ctx, entity.client_id, relQuote);
        }
        for (const relInvoices of entity.from_rel_invoice || []) {
          await recomputeCompletionStatus(ctx, entity.client_id, relInvoices);
        }
      }
    },
  });

  // ---------
  // Invoices
  // ---------
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "check-is-complete-invoices",
    test: (_ctx, entity, oldEntity) =>
      entity?.state !== "closed" &&
      !!entity &&
      !_.isEqual(entity.content, oldEntity?.content),
    callback: async (ctx, entity) => {
      if (entity)
        await recomputeCompletionStatus(ctx, entity.client_id, entity.id);
    },
  });
};

export const recomputeCompletionStatus = async (
  ctx: Context,
  client_id: string,
  id: string
) => {
  const db = await Framework.Db.getService();

  const item = await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
    client_id,
    id,
  });
  const previousValue = _.cloneDeep(item);

  if (!item) return;

  // -------------------
  // Quotes and related (delivered / ready quantities)
  // -------------------
  if (item.type === "quotes" || item.type === "supplier_quotes") {
    // Check what is linked to this quote or supplier_quote
    const articlesIds = _.uniq(
      item.content.filter((a) => a.article).map((a) => a.article)
    );
    for (const b of item.content) {
      b.quantity_ready = 0;
      b.quantity_delivered = 0;
    }
    for (const id of articlesIds) {
      // ------------
      // Stock items: only the ones with state "delivered" are considered
      // ------------
      const allItems = await db.select<StockItems>(
        ctx,
        StockItemsDefinition.name,
        {
          client_id,
          article: id,
          for_rel_quote: item.type === "quotes" ? item.id : undefined,
          from_rel_supplier_quote:
            item.type === "supplier_quotes" ? item.id : undefined,
        },
        { limit: 1000 }
      );

      for (const a of allItems) {
        // We consider this states as not really there for the quote / invoice
        if (a.state === "bought" || a.state === "depleted") continue;

        // Add quantity to the corresponding line(s), circle back if we already filled all lines for this article (and overflow required quantity if needed)
        let remainingQuantityToAffect = a.quantity;
        const hasMatchingArticle = item.content.some(
          (b) => b.article === a.article
        );
        if (!hasMatchingArticle) continue;
        let didAllOnce = false;
        while (remainingQuantityToAffect > 0) {
          for (const b of item.content) {
            if (b.article !== a.article) continue;
            // If this is the first time we go through this article, we can affect the full quantity needed
            // Otherwise, we try to even the overflow
            const available = Math.min(
              remainingQuantityToAffect,
              didAllOnce ? 1 : b.quantity - b.quantity_delivered || 0
            );
            // For supplier quotes, we consider that if it is in the stock it is 'delivered' from the supplier point of view
            if (a.state === "delivered" || item.type === "supplier_quotes") {
              b.quantity_delivered += available;
            }
            b.quantity_ready += available;

            remainingQuantityToAffect -= available;
          }
          didAllOnce = true;
        }
      }

      // ------------
      // Service items: only the ones with state "done" are considered
      // ------------
      const allServices = await db.select<ServiceItems>(
        ctx,
        ServiceItemsDefinition.name,
        {
          client_id,
          article: id,
          for_rel_quote: item.type === "quotes" ? item.id : undefined,
        },
        { limit: 1000 }
      );

      for (const a of allServices) {
        // We consider this states as not really there for the quote / invoice
        if (a.state !== "done") continue;

        // Add quantity to the corresponding line(s), circle back if we already filled all lines for this article (and overflow required quantity if needed)
        let remainingQuantityToAffect = a.quantity_spent;
        const hasMatchingArticle = item.content.some(
          (b) => b.article === a.article
        );
        if (!hasMatchingArticle) continue;
        let didAllOnce = false;
        while (remainingQuantityToAffect > 0) {
          for (const b of item.content) {
            if (b.article !== a.article) continue;
            // If this is the first time we go through this article, we can affect the full quantity needed
            // Otherwise, we try to even the overflow
            const available = Math.min(
              remainingQuantityToAffect,
              didAllOnce ? 1 : b.quantity - b.quantity_delivered || 0
            );

            // For service both are the same
            b.quantity_delivered += available;
            b.quantity_ready += available;

            remainingQuantityToAffect -= available;
          }
          didAllOnce = true;
        }
      }
    }
  }

  // -------------------
  // Quotes and related (invoiced)
  // -------------------
  if (item.type === "quotes" || item.type === "supplier_quotes") {
    const invoices = (
      await Services.Rest.search<Invoices>(
        ctx,
        InvoicesDefinition.name,
        buildQueryFromMap({
          client_id,
          from_rel_quote: id,
        }),
        { limit: 1000 }
      )
    ).list;
    const sentInvoices = invoices.filter(
      // This triggers need invoiced.percentage to be non draft invoices:
      // - Go to recurring mode (only when invoice is *sent*)
      // - Close the quote (only when invoice is *sent*)
      // The following will include "drafts" invoices:
      // - New recurring periode invoice will look if an existing draft invoice is present
      (a) => a.state !== "draft"
    );

    item.invoiced = item.invoiced || ({} as any);
    item.invoiced.ids = invoices.map((a) => a.id);

    // Sent AND draft
    const remaining = computePartialInvoice(item, invoices);
    const remainingLines = remaining.partial_invoice.content.filter((a) =>
      ["consumable", "product", "service"].includes(a.type)
    ).length;
    const totalLines = item.content.filter((a) =>
      ["consumable", "product", "service"].includes(a.type)
    ).length;
    item.invoiced.percentage_with_draft = Math.round(
      (100 * (totalLines - remainingLines)) / totalLines
    );

    // Sent invoices only
    const remainingSent = computePartialInvoice(item, sentInvoices);
    const remainingLinesSent = remainingSent.partial_invoice.content.filter(
      (a) => ["consumable", "product", "service"].includes(a.type)
    ).length;
    const totalLinesSent = item.content.filter((a) =>
      ["consumable", "product", "service"].includes(a.type)
    ).length;
    item.invoiced.percentage = Math.round(
      (100 * (totalLinesSent - remainingLinesSent)) / totalLinesSent
    );
  }

  // -------------------
  // Invoices and related: check payments
  // -------------------
  if (
    item.type === "invoices" ||
    item.type === "credit_notes" ||
    item.type === "supplier_invoices" ||
    item.type === "supplier_credit_notes"
  ) {
    const payments = (
      await Services.Rest.search<AccountingTransactions>(
        ctx,
        AccountingTransactionsDefinition.name,
        buildQueryFromMap({
          client_id,
          rel_invoices: id,
        }),
        { limit: 1000 }
      )
    ).list;

    // 1. Load all invoices sharing the same payments
    const otherInvoicesIds = payments.reduce(
      (acc, a) => [...acc, ...(a.rel_invoices || []).filter((a) => a !== id)],
      [] as string[]
    );
    const otherInvoices =
      otherInvoicesIds?.length > 0
        ? (
            await Services.Rest.search<Invoices>(
              ctx,
              InvoicesDefinition.name,
              buildQueryFromMap({
                client_id,
                id: _.uniq(otherInvoicesIds),
              }),
              { limit: 100 }
            )
          ).list
        : [];
    payments.push(
      ...(otherInvoices?.length > 0
        ? (
            await Services.Rest.search<AccountingTransactions>(
              ctx,
              AccountingTransactionsDefinition.name,
              buildQueryFromMap({
                client_id,
                rel_invoices: _.uniq(otherInvoices.map((a) => a.id)),
              }),
              { limit: 1000 }
            )
          ).list
        : [])
    );

    fillInvoicePayments(item, otherInvoices, payments);
  }

  if (!_.isEqual(item, previousValue)) {
    if (previousValue?.state !== item.state) {
      item.updated_by = "system";
    }
    await db.update<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { client_id, id: item.id },
      item
    );
  }
};

export const fillInvoicePayments = (
  currentInvoice: Pick<Invoices, "id" | "transactions" | "total" | "reference">,
  extendedInvoices: Pick<
    Invoices,
    "id" | "transactions" | "total" | "reference"
  >[],
  extendedPayments: Pick<
    AccountingTransactions,
    "id" | "amount" | "rel_invoices" | "transaction_date"
  >[]
) => {
  const item = currentInvoice;
  const otherInvoices = _.uniqBy(
    [item, ...extendedInvoices.filter((a) => a.id !== item.id)],
    (a) => a.id
  );
  const payments = _.uniqBy(extendedPayments, (a) => a.id);

  // 2. Fill all invoices with single payments first
  for (const anyInvoice of otherInvoices) {
    const relatedPayments = payments.filter(
      (p) =>
        p.rel_invoices?.includes(anyInvoice.id) && p.rel_invoices?.length === 1
    );
    anyInvoice.transactions = anyInvoice.transactions || ({} as any);
    anyInvoice.transactions.ids = relatedPayments.map((a) => a.id);
    anyInvoice.transactions.total = relatedPayments.reduce(
      (acc, a) => acc + a.amount,
      0
    );
  }

  // 3. Finish to fill all invoices with multiple-invoices payments
  const sortedPayments = _.sortBy(payments, (a) => a.transaction_date); // We sort by date to have the oldest first
  const sortedInvoices = _.sortBy(otherInvoices, (a) => a.reference); // We sort by date to have the oldest first
  for (const invoice of sortedInvoices) {
    const relatedPayments = sortedPayments.filter(
      (p) => p.rel_invoices?.includes(invoice.id) && p.rel_invoices?.length > 1
    );

    for (const payment of relatedPayments) {
      const remainingAmount =
        invoice.total?.total_with_taxes - invoice.transactions.total;
      const partialAmount = Math.min(remainingAmount, payment.amount);
      payment.amount = payment.amount - partialAmount;

      invoice.transactions =
        invoice.transactions || ({ ids: [], total: 0 } as any);
      invoice.transactions.ids.push(payment.id);
      invoice.transactions.total += partialAmount;
    }
  }

  // 4. Finish to use the payments (overfull invoices)
  for (const invoice of sortedInvoices) {
    const relatedPayments = sortedPayments.filter(
      (p) => p.rel_invoices?.includes(invoice.id) && p.rel_invoices?.length > 1
    );
    for (const payment of relatedPayments) {
      const partialAmount = payment.amount;
      payment.amount = 0;
      invoice.transactions.total += partialAmount;
    }
  }

  // 5. We'll save only 'item' which is the current invoice
  item.transactions.percentage =
    Math.round(
      (100 * item.transactions.total) / item.total?.total_with_taxes
    ) || 0;

  return item;
};
