import Framework from "#src/platform/index";
import { create, update } from "#src/services/rest/services/rest";
import { Context } from "#src/types";
import { captureException } from "@sentry/node";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import {
  ReceivedEInvoice,
  ReceivedEInvoiceDefinition,
} from "../entities/received-e-invoice";
import {
  convertEN16931ToInternal,
  extractReferencesFromEN16931,
  ResolvedEntities,
} from "./invoice-converter";

/**
 * Process a received e-invoice and convert it to an internal supplier invoice.
 * This function handles the complete workflow:
 * 1. Extract references from EN16931 invoice
 * 2. Find or create supplier contact
 * 3. Find or create articles
 * 4. Convert to internal format
 * 5. Create supplier invoice
 * 6. Update received invoice status
 */
export async function processReceivedInvoice(
  ctx: Context,
  receivedInvoice: ReceivedEInvoice
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const db = await Framework.Db.getService();

    // Step 1: Extract references from EN16931 invoice
    const references = extractReferencesFromEN16931(receivedInvoice.en_invoice);

    // Step 2: Find or create supplier contact
    let supplier = await findSupplierContact(ctx, references.seller);
    if (!supplier) {
      supplier = await createSupplierContact(ctx, references.seller);
    }

    // Step 3: Find or create articles
    const articlesMap = new Map();
    for (const articleRef of references.articles) {
      const article = await findOrCreateArticle(ctx, articleRef);
      // Use the same key strategy as the converter
      const key =
        articleRef.sellers_item_identification ||
        articleRef.buyers_item_identification ||
        articleRef.name;
      articlesMap.set(key, article);
    }

    // Step 4: Convert to internal format
    const resolvedEntities: ResolvedEntities = {
      supplier,
      articles: articlesMap,
    };

    const internalInvoice = convertEN16931ToInternal(
      receivedInvoice.en_invoice,
      resolvedEntities,
      "in", // Received invoice
      ctx
    );

    // Step 5: Create supplier invoice
    const createdInvoice = await create<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {
        ...internalInvoice,
        state: "draft", // Start as draft for review
      }
    );

    if (!createdInvoice) {
      throw new Error("Failed to create supplier invoice");
    }

    // Step 6: Update received invoice status
    await update(
      ctx,
      ReceivedEInvoiceDefinition.name,
      { id: receivedInvoice.id },
      {
        processed: true,
        supplier_invoice_id: createdInvoice.id,
        status: "validated",
        processing_error: "",
      }
    );

    console.log(
      `Successfully processed e-invoice ${receivedInvoice.invoice_number} -> ${createdInvoice.id}`
    );

    return {
      success: true,
      invoiceId: createdInvoice.id,
    };
  } catch (error: any) {
    console.error(
      `Error processing received invoice ${receivedInvoice.id}:`,
      error
    );
    captureException(error);

    // Update received invoice with error
    await update(
      ctx,
      ReceivedEInvoiceDefinition.name,
      { id: receivedInvoice.id },
      {
        processed: true,
        status: "error",
        processing_error: error.message || "Unknown error during processing",
      }
    );

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Find supplier contact by VAT, tax ID, or name
 */
async function findSupplierContact(
  ctx: Context,
  sellerInfo: { name: string; vat?: string; tax_id?: string; email?: string }
): Promise<any | null> {
  const db = await Framework.Db.getService();

  // Try to find by VAT number first (most reliable)
  if (sellerInfo.vat) {
    const contacts = await db.select(ctx, "contacts", {
      vat_number: sellerInfo.vat,
      type: "supplier",
    });
    if (contacts.length > 0) return contacts[0];
  }

  // Try by tax ID
  if (sellerInfo.tax_id) {
    const contacts = await db.select(ctx, "contacts", {
      tax_id: sellerInfo.tax_id,
      type: "supplier",
    });
    if (contacts.length > 0) return contacts[0];
  }

  // Try by company name (less reliable)
  const contacts = await db.select(ctx, "contacts", {
    company_name: sellerInfo.name,
    type: "supplier",
  });
  if (contacts.length > 0) return contacts[0];

  // Try by name if company_name didn't match
  const contactsByName = await db.select(ctx, "contacts", {
    name: sellerInfo.name,
    type: "supplier",
  });
  if (contactsByName.length > 0) return contactsByName[0];

  return null;
}

/**
 * Create a new supplier contact from seller information
 */
async function createSupplierContact(
  ctx: Context,
  sellerInfo: { name: string; vat?: string; tax_id?: string; email?: string }
): Promise<any> {
  console.log(`Creating new supplier contact: ${sellerInfo.name}`);

  return await create(ctx, "contacts", {
    type: "supplier",
    company_name: sellerInfo.name,
    name: sellerInfo.name,
    vat_number: sellerInfo.vat || "",
    tax_id: sellerInfo.tax_id || "",
    email: sellerInfo.email || "",
    // Add other default fields as needed
  });
}

/**
 * Find or create an article
 */
async function findOrCreateArticle(
  ctx: Context,
  articleRef: {
    name: string;
    reference?: string;
    description?: string;
    sellers_item_identification?: string;
    buyers_item_identification?: string;
  }
): Promise<any> {
  const db = await Framework.Db.getService();

  // Try to find by seller's reference
  if (articleRef.sellers_item_identification) {
    const articles = await db.select(ctx, "articles", {
      reference: articleRef.sellers_item_identification,
    });
    if (articles.length > 0) return articles[0];
  }

  // Try to find by buyer's reference
  if (articleRef.buyers_item_identification) {
    const articles = await db.select(ctx, "articles", {
      reference: articleRef.buyers_item_identification,
    });
    if (articles.length > 0) return articles[0];
  }

  // Try to find by name
  const articles = await db.select(ctx, "articles", {
    name: articleRef.name,
  });
  if (articles.length > 0) return articles[0];

  // Create new article if not found
  console.log(`Creating new article: ${articleRef.name}`);

  return await create(ctx, "articles", {
    name: articleRef.name,
    reference: articleRef.sellers_item_identification || "",
    description: articleRef.description || "",
    type: "product", // Default type
    // Add other default fields as needed
  });
}
