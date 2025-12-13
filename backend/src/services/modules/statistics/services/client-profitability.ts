import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context } from "#src/types";
import _ from "lodash";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import { getTimezoneOffset } from "../../invoices/utils";
import { getContactName } from "#src/services/utils";

export type TimeRange = {
  label: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

export type ClientProfitabilityLine = {
  client_id: string;
  client_name: string;
  revenue: number; // Total from invoices
  min_cost: number; // Minimum estimated cost
  max_cost: number; // Maximum estimated cost
  min_profit: number; // revenue - max_cost
  max_profit: number; // revenue - min_cost
  invoice_count: number;
  quote_count: number;
};

export type ClientProfitabilityResult = {
  period: TimeRange;
  data: ClientProfitabilityLine[];
};

/**
 * Calculate client profitability by analyzing invoices, quotes, and supplier invoices
 */
export const getClientProfitability = async (
  ctx: Context,
  clientId: string,
  options: {
    timeRanges: TimeRange[];
    clientIds?: string[]; // Filter by specific clients, or all if not provided
  }
): Promise<ClientProfitabilityResult[]> => {
  const db = await Framework.Db.getService();
  const client = await Services.Clients.getClient(ctx, clientId);
  const timezone = client?.preferences?.timezone || "Europe/Paris";

  const results: ClientProfitabilityResult[] = [];

  for (const timeRange of options.timeRanges) {
    const profitabilityData = await calculateProfitabilityForPeriod(
      ctx,
      db,
      clientId,
      timezone,
      timeRange,
      options.clientIds
    );

    results.push({
      period: timeRange,
      data: profitabilityData,
    });
  }

  return results;
};

async function calculateProfitabilityForPeriod(
  ctx: Context,
  db: any,
  clientId: string,
  timezone: string,
  timeRange: TimeRange,
  filterClientIds?: string[]
): Promise<ClientProfitabilityLine[]> {
  const BATCH_SIZE = 1000;

  // Build date filters for invoices
  const conditions: string[] = [
    "client_id=$1",
    "is_deleted=false",
    "state != 'draft'",
    "type IN ('invoices', 'credit_notes')",
  ];
  const values: any[] = [clientId];
  let paramIndex = 2;

  // Filter by date range
  const { offsetms: fromOffsetMs } = getTimezoneOffset(
    timezone,
    new Date(timeRange.from).getTime()
  );
  const fromDate = new Date(timeRange.from).getTime() - fromOffsetMs;
  conditions.push(`emit_date >= $${paramIndex}`);
  values.push(fromDate);
  paramIndex++;

  const { offsetms: toOffsetMs } = getTimezoneOffset(
    timezone,
    new Date(timeRange.to).getTime()
  );
  const toDate =
    new Date(timeRange.to).getTime() - toOffsetMs + 24 * 60 * 60 * 1000;
  conditions.push(`emit_date < $${paramIndex}`);
  values.push(toDate);
  paramIndex++;

  // Filter by specific clients if provided
  if (filterClientIds && filterClientIds.length > 0) {
    conditions.push(`client = ANY($${paramIndex})`);
    values.push(filterClientIds);
    paramIndex++;
  }

  // Fetch all invoices for the period
  const invoices: Invoices[] = [];
  let hasNextPage = true;
  while (hasNextPage) {
    const newInvoices = await db.select<Invoices>(
      { ...ctx, role: "SYSTEM" },
      InvoicesDefinition.name,
      {
        where: conditions.join(" AND "),
        values,
      },
      { limit: 10000, offset: invoices.length }
    );
    invoices.push(...newInvoices);
    if (newInvoices.length < 10000) {
      hasNextPage = false;
    }
  }

  if (invoices.length === 0) {
    return [];
  }

  // Collect all unique client IDs
  const uniqueClientIds = _.uniq(
    invoices
      .map((inv) => inv.client)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // Fetch all clients
  const contacts: Contacts[] = [];
  for (let i = 0; i < uniqueClientIds.length; i += BATCH_SIZE) {
    const batch = uniqueClientIds.slice(i, i + BATCH_SIZE);
    if (batch.length > 0) {
      const batchContacts = await db.select<Contacts>(
        { ...ctx, role: "SYSTEM" },
        ContactsDefinition.name,
        {
          where: `client_id=$1 AND id = ANY($2)`,
          values: [clientId, batch],
        },
        { include_deleted: true }
      );
      contacts.push(...batchContacts);
    }
  }
  const contactsMap = _.keyBy(contacts, "id");

  // Collect all quote IDs from invoices
  const quoteIds = _.uniq(
    invoices
      .flatMap((inv) => inv.from_rel_quote || [])
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // Fetch all quotes
  const quotes: Invoices[] = [];
  for (let i = 0; i < quoteIds.length; i += BATCH_SIZE) {
    const batch = quoteIds.slice(i, i + BATCH_SIZE);
    if (batch.length > 0) {
      const batchQuotes = await db.select<Invoices>(
        { ...ctx, role: "SYSTEM" },
        InvoicesDefinition.name,
        {
          where: `client_id=$1 AND id = ANY($2)`,
          values: [clientId, batch],
        },
        { include_deleted: true }
      );
      quotes.push(...batchQuotes);
    }
  }
  const quotesMap = _.keyBy(quotes, "id");

  // Find all supplier invoices that reference these quotes
  const supplierInvoices: Invoices[] = [];
  if (quoteIds.length > 0) {
    for (let i = 0; i < quoteIds.length; i += BATCH_SIZE) {
      const batch = quoteIds.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        // Find supplier invoices where from_rel_quote contains any of these quote IDs
        const batchSupplierInvoices = await db.select<Invoices>(
          { ...ctx, role: "SYSTEM" },
          InvoicesDefinition.name,
          {
            where: `client_id=$1 AND is_deleted=false AND type IN ('supplier_invoices', 'supplier_credit_notes') AND state != 'draft' AND from_rel_quote && $2`,
            values: [clientId, batch],
          }
        );
        supplierInvoices.push(...batchSupplierInvoices);
      }
    }
  }

  // Collect all article IDs from invoices and supplier invoices
  const articleIds = _.uniq(
    [...invoices, ...supplierInvoices]
      .flatMap((inv) =>
        (inv.content || [])
          .filter((line) => line.article)
          .map((line) => line.article)
      )
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // Fetch all articles
  const articles: Articles[] = [];
  for (let i = 0; i < articleIds.length; i += BATCH_SIZE) {
    const batch = articleIds.slice(i, i + BATCH_SIZE);
    if (batch.length > 0) {
      const batchArticles = await db.select<Articles>(
        { ...ctx, role: "SYSTEM" },
        ArticlesDefinition.name,
        {
          where: `client_id=$1 AND id = ANY($2)`,
          values: [clientId, batch],
        },
        { include_deleted: true }
      );
      articles.push(...batchArticles);
    }
  }
  const articlesMap = _.keyBy(articles, "id");

  // Group invoices by client
  const invoicesByClient = _.groupBy(invoices, "client");

  // Calculate profitability for each client
  const profitabilityLines: ClientProfitabilityLine[] = [];

  for (const [clientContactId, clientInvoices] of Object.entries(
    invoicesByClient
  )) {
    const contact = contactsMap[clientContactId];
    const clientName = getContactName(contact) || "Client inconnu";

    let totalRevenue = 0;
    let minTotalCost = 0;
    let maxTotalCost = 0;
    const relatedQuoteIds = new Set<string>();

    for (const invoice of clientInvoices) {
      // Calculate revenue (positive for invoices, negative for credit notes)
      const invoiceTotal = invoice.total?.total_with_taxes || 0;
      const revenue =
        invoice.type === "credit_notes" ? -invoiceTotal : invoiceTotal;
      totalRevenue += revenue;

      // Track related quotes
      (invoice.from_rel_quote || []).forEach((qId) => relatedQuoteIds.add(qId));

      // Calculate costs for each line
      for (const line of invoice.content || []) {
        if (
          !["product", "service", "consumable"].includes(line.type) ||
          (line.optional && !line.optional_checked)
        ) {
          continue;
        }

        const quantity = line.quantity || 0;
        let minLineCost = 0;
        let maxLineCost = 0;

        // Try to find cost from supplier invoices linked to the quote
        const relatedQuoteId = (invoice.from_rel_quote || [])[0];
        if (relatedQuoteId) {
          const relatedSupplierInvoices = supplierInvoices.filter((si) =>
            (si.from_rel_quote || []).includes(relatedQuoteId)
          );

          for (const supplierInv of relatedSupplierInvoices) {
            for (const supplierLine of supplierInv.content || []) {
              if (
                supplierLine.article === line.article &&
                ["product", "service", "consumable"].includes(supplierLine.type)
              ) {
                const supplierQuantity = supplierLine.quantity || 0;
                const supplierUnitPrice = supplierLine.unit_price || 0;
                let supplierLineTotal = supplierQuantity * supplierUnitPrice;

                // Apply discount
                if (supplierLine.discount) {
                  if (supplierLine.discount.mode === "percentage") {
                    supplierLineTotal *=
                      1 - (supplierLine.discount.value || 0) / 100;
                  } else if (supplierLine.discount.mode === "amount") {
                    supplierLineTotal -= supplierLine.discount.value || 0;
                  }
                }

                // Apply TVA
                const tvaRate = parseFloat(supplierLine.tva || "0") || 0;
                supplierLineTotal *= 1 + tvaRate / 100;

                // Proportional cost based on quantity
                const unitCost =
                  supplierQuantity > 0
                    ? supplierLineTotal / supplierQuantity
                    : 0;
                const lineCost = unitCost * quantity;

                minLineCost = minLineCost === 0 ? lineCost : Math.min(minLineCost, lineCost);
                maxLineCost = Math.max(maxLineCost, lineCost);
              }
            }
          }
        }

        // If no supplier invoice found, try to estimate from article suppliers_details
        if (minLineCost === 0 && maxLineCost === 0 && line.article) {
          const article = articlesMap[line.article];
          if (article?.suppliers_details) {
            const supplierPrices = Object.values(article.suppliers_details)
              .map((detail: any) => detail.price || 0)
              .filter((price) => price > 0);

            if (supplierPrices.length > 0) {
              minLineCost = Math.min(...supplierPrices) * quantity;
              maxLineCost = Math.max(...supplierPrices) * quantity;
            }
          }
        }

        minTotalCost += minLineCost;
        maxTotalCost += maxLineCost;
      }
    }

    profitabilityLines.push({
      client_id: clientContactId,
      client_name: clientName,
      revenue: totalRevenue,
      min_cost: minTotalCost,
      max_cost: maxTotalCost,
      min_profit: totalRevenue - maxTotalCost,
      max_profit: totalRevenue - minTotalCost,
      invoice_count: clientInvoices.length,
      quote_count: relatedQuoteIds.size,
    });
  }

  // Sort by revenue descending
  return profitabilityLines.sort((a, b) => b.revenue - a.revenue);
}
