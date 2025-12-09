import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context } from "#src/types";
import _ from "lodash";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import { getTimezoneOffset } from "../../invoices/utils";
import { Tags, TagsDefinition } from "../../tags/entities/tags";
import { getContactName } from "#src/services/utils";

export type AccountingExportLine = {
  // Invoice information
  invoice_id: string;
  invoice_reference: string;
  invoice_emit_date: string;
  invoice_type: string;
  invoice_state: string;
  invoice_total_ht: number;
  invoice_total_ttc: number;

  // Quote/Order information
  quote_id: string;
  quote_reference: string;

  // Contact information (company)
  contact_id: string;
  contact_name: string;

  // Person contact information
  person_contact_id: string;
  person_contact_name: string;

  // Line information
  line_index: number;
  line_article_id: string;
  line_article_name: string;
  line_article_reference: string;
  line_description: string;
  line_quantity: number;
  line_unit: string;
  line_unit_price: number;
  line_total_ht: number;
  line_tva_rate: string;
  line_tva_amount: number;
  line_total_ttc: number;

  // Accounting information
  accounting_number: string;
  accounting_name: string;
  accounting_standard: string;

  // Tags
  tags: string;
};

/**
 * Export invoices in accounting format where each invoice line is a separate row
 * with its associated accounting number from the linked article
 */
export const getAccountingExport = async (
  ctx: Context,
  clientId: string,
  options: {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    type?:
      | "invoices"
      | "credit_notes"
      | "supplier_invoices"
      | "supplier_credit_notes"
      | "all";
    state?: "all" | "sent" | "closed";
  }
): Promise<AccountingExportLine[]> => {
  const db = await Framework.Db.getService();
  const client = await Services.Clients.getClient(ctx, clientId);
  const timezone = client?.preferences?.timezone || "Europe/Paris";

  // Build date filters
  const conditions: string[] = ["client_id=$1", "is_deleted=false"];
  const values: any[] = [clientId];
  let paramIndex = 2;

  // Filter by type
  if (options.type && options.type !== "all") {
    conditions.push(`type=$${paramIndex}`);
    values.push(options.type);
    paramIndex++;
  } else {
    conditions.push(
      `type IN ('invoices', 'credit_notes', 'supplier_invoices', 'supplier_credit_notes')`
    );
  }

  // Filter by state
  if (options.state === "sent") {
    conditions.push(`state='sent'`);
  } else if (options.state === "closed") {
    conditions.push(`state='closed'`);
  } else {
    // All non-draft
    conditions.push(`state != 'draft'`);
  }

  // Filter by date range
  if (options.from) {
    const { offsetms } = getTimezoneOffset(
      timezone,
      new Date(options.from).getTime()
    );
    const fromDate = new Date(options.from).getTime() - offsetms;
    conditions.push(`emit_date >= $${paramIndex}`);
    values.push(fromDate);
    paramIndex++;
  }

  if (options.to) {
    const { offsetms } = getTimezoneOffset(
      timezone,
      new Date(options.to).getTime()
    );
    const toDate =
      new Date(options.to).getTime() - offsetms + 24 * 60 * 60 * 1000; // Include the whole day
    conditions.push(`emit_date < $${paramIndex}`);
    values.push(toDate);
    paramIndex++;
  }

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

  // Sort by emit_date after fetching
  invoices.sort(
    (a, b) => new Date(a.emit_date).getTime() - new Date(b.emit_date).getTime()
  );

  if (invoices.length === 0) {
    return [];
  }

  // Batch size for pagination to avoid query parameter limits
  const BATCH_SIZE = 1000;

  // Collect all article IDs
  const articleIds = _.uniq(
    invoices
      .flatMap((invoice) =>
        (invoice.content || [])
          .filter((line) => line.article)
          .map((line) => line.article)
      )
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // Collect all contact IDs (company contacts + person contacts)
  const companyContactIds = _.uniq(
    invoices
      .map((invoice) =>
        invoice.type.startsWith("supplier") ? invoice.supplier : invoice.client
      )
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  const personContactIds = _.uniq(
    invoices
      .map((invoice) => invoice.contact)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // Fetch all articles in batches to avoid query parameter limits
  const articles: Articles[] = [];
  for (let i = 0; i < articleIds.length; i += BATCH_SIZE) {
    const batch = articleIds.slice(i, i + BATCH_SIZE);
    const batchArticles = await db.select<Articles>(
      { ...ctx, role: "SYSTEM" },
      ArticlesDefinition.name,
      {
        where: `client_id=$1 AND id = ANY($2)`,
        values: [clientId, batch],
      }
    );
    articles.push(...batchArticles);
  }
  const articlesMap = _.keyBy(articles, "id");

  // Fetch all contacts in batches to avoid query parameter limits
  const allContactIds = _.uniq([...companyContactIds, ...personContactIds]);
  const contacts: Contacts[] = [];
  for (let i = 0; i < allContactIds.length; i += BATCH_SIZE) {
    const batch = allContactIds.slice(i, i + BATCH_SIZE);
    const batchContacts = await db.select<Contacts>(
      { ...ctx, role: "SYSTEM" },
      ContactsDefinition.name,
      {
        where: `client_id=$1 AND id = ANY($2)`,
        values: [clientId, batch],
      }
    );
    contacts.push(...batchContacts);
  }
  const contactsMap = _.keyBy(contacts, "id");

  // Collect all quote IDs
  const quoteIds = _.uniq(
    invoices
      .flatMap((invoice) => invoice.from_rel_quote || [])
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // Fetch all related quotes in batches to avoid query parameter limits
  const quotes: Invoices[] = [];
  for (let i = 0; i < quoteIds.length; i += BATCH_SIZE) {
    const batch = quoteIds.slice(i, i + BATCH_SIZE);
    const batchQuotes = await db.select<Invoices>(
      { ...ctx, role: "SYSTEM" },
      InvoicesDefinition.name,
      {
        where: `client_id=$1 AND id = ANY($2)`,
        values: [clientId, batch],
      }
    );
    quotes.push(...batchQuotes);
  }
  const quotesMap = _.keyBy(quotes, "id");

  // Collect all tag IDs from articles
  const tagIds = _.uniq(
    articles
      .flatMap((article) => article.tags || [])
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );

  // Fetch all tags in batches to avoid query parameter limits
  const tags: Tags[] = [];
  for (let i = 0; i < tagIds.length; i += BATCH_SIZE) {
    const batch = tagIds.slice(i, i + BATCH_SIZE);
    const batchTags = await db.select<Tags>(
      { ...ctx, role: "SYSTEM" },
      TagsDefinition.name,
      {
        where: `client_id=$1 AND id = ANY($2)`,
        values: [clientId, batch],
      }
    );
    tags.push(...batchTags);
  }
  const tagsMap = _.keyBy(tags, "id");

  // Build export lines
  const exportLines: AccountingExportLine[] = [];

  for (const invoice of invoices) {
    const isSupplier = invoice.type.startsWith("supplier");
    const companyContactId = isSupplier ? invoice.supplier : invoice.client;
    const companyContact = contactsMap[companyContactId];
    const companyContactName = getContactName(companyContact);

    // Get person contact
    const personContactId = invoice.contact || "";
    const personContact = personContactId
      ? contactsMap[personContactId]
      : undefined;
    const personContactName = getContactName(personContact);

    // Get related quote
    const quoteId = (invoice.from_rel_quote || [])[0] || "";
    const quote = quoteId ? quotesMap[quoteId] : undefined;
    const quoteReference = quote?.reference || "";

    const lines = (invoice.content || []).filter(
      (line) =>
        ["product", "service", "consumable", "correction"].includes(
          line.type
        ) &&
        (!line.optional || line.optional_checked)
    );

    lines.forEach((line, index) => {
      const article = line.article ? articlesMap[line.article] : null;

      // Get accounting info based on invoice type (sell for client invoices, buy for supplier invoices)
      const accountingInfo = article?.accounting
        ? isSupplier
          ? article.accounting.buy
          : article.accounting.sell
        : null;

      // Calculate line totals
      const quantity = line.quantity || 0;
      const unitPrice = line.unit_price || 0;
      let lineTotal = quantity * unitPrice;

      // Apply line discount if any
      if (line.discount) {
        if (line.discount.mode === "percentage") {
          lineTotal = lineTotal * (1 - (line.discount.value || 0) / 100);
        } else if (line.discount.mode === "amount") {
          lineTotal = lineTotal - (line.discount.value || 0);
        }
      }

      // Calculate TVA
      const tvaRate = parseFloat(line.tva || "0") || 0;
      const tvaAmount = lineTotal * (tvaRate / 100);
      const lineTotalTTC = lineTotal + tvaAmount;

      // Get tags from article and convert IDs to names
      const tagNames = (article?.tags || [])
        .map((tagId) => tagsMap[tagId]?.name)
        .filter(Boolean)
        .join("; ");

      exportLines.push({
        // Invoice information
        invoice_id: invoice.id,
        invoice_reference: invoice.reference || "",
        invoice_emit_date: new Date(invoice.emit_date)
          .toISOString()
          .split("T")[0],
        invoice_type: invoice.type,
        invoice_state: invoice.state,
        invoice_total_ht: invoice.total?.total || 0,
        invoice_total_ttc: invoice.total?.total_with_taxes || 0,

        // Quote/Order information
        quote_id: quoteId,
        quote_reference: quoteReference,

        // Contact information (company)
        contact_id: companyContactId || "",
        contact_name: companyContactName,

        // Person contact information
        person_contact_id: personContactId,
        person_contact_name: personContactName,

        // Line information
        line_index: index + 1,
        line_article_id: line.article || "",
        line_article_name: line.name || article?.name || "",
        line_article_reference:
          line.reference || article?.internal_reference || "",
        line_description: (line.description || "")?.replace(/<[^>]*>?/gm, ""),
        line_quantity: quantity,
        line_unit: line.unit || article?.unit || "",
        line_unit_price: unitPrice.toFixed(2) as unknown as number,
        line_total_ht: lineTotal.toFixed(2) as unknown as number,
        line_tva_rate: line.tva || "0",
        line_tva_amount: tvaAmount.toFixed(2) as unknown as number,
        line_total_ttc: lineTotalTTC.toFixed(2) as unknown as number,

        // Accounting information - empty if no category/article
        accounting_number: accountingInfo?.standard_identifier || "",
        accounting_name: accountingInfo?.name || "",
        accounting_standard: accountingInfo?.standard || "",

        // Tags
        tags: tagNames,
      });
    });
  }

  return exportLines;
};
