# E-Invoice Converter

This module provides bidirectional conversion between EN16931 (European standard for electronic invoicing) and the internal Invoices format.

## Overview

The converter consists of three main functions:

1. **`extractReferencesFromEN16931`** - Extracts article and contact references that need to be fetched from the database
2. **`convertEN16931ToInternal`** - Converts EN16931 → Internal format
3. **`convertInternalToEN16931`** - Converts Internal → EN16931 format

## Usage Examples

### Converting EN16931 to Internal Format

```typescript
import {
  extractReferencesFromEN16931,
  convertEN16931ToInternal,
  ResolvedEntities,
} from "./invoice-converter";

// Step 1: Extract references from the EN16931 invoice
const references = extractReferencesFromEN16931(en16931Invoice);

// Step 2: Fetch required entities from database
// references.seller = { name, vat, tax_id, email }
// references.buyer = { name, vat, tax_id, email }
// references.articles = [{ name, reference, description, ... }]

const supplier = await findContactByVatOrName(
  ctx,
  references.seller.vat,
  references.seller.name
);

const articlesMap = new Map();
for (const articleRef of references.articles) {
  const article = await findOrCreateArticle(ctx, articleRef);
  const key = articleRef.reference || articleRef.name;
  articlesMap.set(key, article);
}

// Step 3: Convert with resolved entities
const resolvedEntities: ResolvedEntities = {
  supplier, // For received invoices (direction "in")
  articles: articlesMap,
};

const internalInvoice = convertEN16931ToInternal(
  en16931Invoice,
  resolvedEntities,
  "in", // "in" for received, "out" for sent
  ctx
);

// Step 4: Save to database
await create(ctx, InvoicesDefinition.name, internalInvoice);
```

### Converting Internal Format to EN16931

```typescript
import {
  convertInternalToEN16931,
  ResolvedEntities,
} from "./invoice-converter";

// Step 1: Fetch the internal invoice
const invoice = await db.selectOne(ctx, InvoicesDefinition.name, { id });

// Step 2: Fetch related entities
const isSupplier = invoice.type.startsWith("supplier_");
const contactId = isSupplier ? invoice.supplier : invoice.client;
const contact = await db.selectOne(ctx, ContactsDefinition.name, {
  id: contactId,
});

const articlesMap = new Map();
for (const line of invoice.content) {
  const article = await db.selectOne(ctx, ArticlesDefinition.name, {
    id: line.article,
  });
  articlesMap.set(line.article, article);
}

// Step 3: Convert to EN16931
const resolvedEntities: ResolvedEntities = {
  supplier: isSupplier ? contact : undefined,
  client: !isSupplier ? contact : undefined,
  articles: articlesMap,
};

const en16931Invoice = convertInternalToEN16931(invoice, resolvedEntities);

// Step 4: Send to SuperPDP or export
await superpdpClient.sendInvoice(en16931Invoice);
```

## Key Features

### No Database Calls

The converter functions **never** call the database directly. All required data must be passed as arguments. This design:

- Makes the converters pure functions (easier to test)
- Gives caller full control over how entities are fetched/created
- Throws clear errors if required entities are missing

### Article Matching

Articles are matched using the following priority:

1. `sellers_item_identification` (seller's reference)
2. `buyers_item_identification` (buyer's reference)
3. `name` (article name)

When converting, you should use the same key to build your `articlesMap`.

### Contact Matching

Contacts are matched using:

- VAT number (primary)
- Tax ID
- Company name
- Email

The `extractReferencesFromEN16931` function provides all available identifiers.

### Invoice Type Mapping

| EN16931 Type Code | Direction | Internal Type         |
| ----------------- | --------- | --------------------- |
| 380 (Invoice)     | in        | supplier_invoices     |
| 381 (Credit Note) | in        | supplier_credit_notes |
| 325 (Quote)       | in        | supplier_quotes       |
| 380 (Invoice)     | out       | invoices              |
| 381 (Credit Note) | out       | credit_notes          |
| 325 (Quote)       | out       | quotes                |

### VAT Category Codes

| Rate | EN16931 Code | Description   |
| ---- | ------------ | ------------- |
| 0%   | Z            | Zero rated    |
| <10% | AA           | Reduced rate  |
| ≥10% | S            | Standard rate |

### Payment Means Type Codes (UNTDID 4461)

| Code | Description          |
| ---- | -------------------- |
| 30   | Bank transfer        |
| 48   | Card payment         |
| 49   | Direct debit         |
| 58   | SEPA credit transfer |

## Error Handling

The converters throw errors in these cases:

```typescript
// Missing supplier contact (for received invoices)
throw new Error("Supplier contact not found for seller: Company Name");

// Missing client contact (for sent invoices)
throw new Error("Client contact not found for buyer: Company Name");

// Missing article
throw new Error("Article not found: Product Name (ref: REF123)");
```

Always wrap converter calls in try-catch blocks and handle these errors appropriately.

## High-Level Processing

For automatic processing of received invoices, use the `processReceivedInvoice` service:

```typescript
import { processReceivedInvoice } from "./process-received-invoice";

// Process a received e-invoice
const result = await processReceivedInvoice(ctx, receivedInvoice);

if (result.success) {
  console.log(`Created supplier invoice: ${result.invoiceId}`);
} else {
  console.error(`Processing failed: ${result.error}`);
}
```

This function handles the complete workflow:

1. Extracts references from EN16931 invoice
2. Finds or creates supplier contact
3. Finds or creates articles
4. Converts to internal format
5. Creates supplier invoice in draft state
6. Updates received invoice status

### Integration with Cron Job

```typescript
// In received-invoices-cron.ts
import { processReceivedInvoice } from "./process-received-invoice";

// After fetching received invoices
for (const invoice of invoices) {
  try {
    // Check if already processed
    const existing = await db.select<ReceivedEInvoice>(
      clientCtx,
      ReceivedEInvoiceDefinition.name,
      { superpdp_invoice_id: invoice.id },
      { limit: 1 }
    );

    if (existing.length > 0) {
      if (!existing[0].processed) {
        // Process unprocessed invoice
        await processReceivedInvoice(clientCtx, existing[0]);
      }
      continue;
    }

    // Create and process new received invoice
    const receivedInvoice = await create<ReceivedEInvoice>(
      clientCtx,
      ReceivedEInvoiceDefinition.name,
      {
        /* invoice data */
      }
    );

    // Automatically process it
    await processReceivedInvoice(clientCtx, receivedInvoice);
  } catch (error) {
    console.error(`Error processing invoice ${invoice.id}:`, error);
  }
}
```

## Testing

```typescript
import { extractReferencesFromEN16931 } from "./invoice-converter";

describe("EN16931 Converter", () => {
  it("should extract references correctly", () => {
    const references = extractReferencesFromEN16931(mockEN16931Invoice);

    expect(references.seller.name).toBe("ACME Corp");
    expect(references.articles).toHaveLength(3);
    expect(references.articles[0].name).toBe("Product A");
  });

  it("should convert EN16931 to internal format", () => {
    const resolvedEntities = {
      supplier: mockSupplier,
      articles: new Map([["Product A", mockArticle]]),
    };

    const invoice = convertEN16931ToInternal(
      mockEN16931Invoice,
      resolvedEntities,
      "in",
      mockCtx
    );

    expect(invoice.type).toBe("supplier_invoices");
    expect(invoice.supplier).toBe(mockSupplier.id);
    expect(invoice.content).toHaveLength(1);
  });
});
```
