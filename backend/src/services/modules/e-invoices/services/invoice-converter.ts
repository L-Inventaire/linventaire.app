import { getContactName } from "#src/services/utils";
import { Context } from "#src/types";
import { EN16931Invoice } from "../../../../platform/e-invoices/adapters/superpdp/en16931-types";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import Invoices, {
  InvoiceDiscount,
  InvoiceLine,
} from "../../invoices/entities/invoices";

/**
 * References extracted from an EN16931 invoice that need to be resolved
 * before conversion to internal format
 */
export interface EN16931References {
  // Seller information for contact lookup
  seller: {
    name: string;
    vat?: string;
    tax_id?: string;
    email?: string;
  };
  // Buyer information for contact lookup
  buyer: {
    name: string;
    vat?: string;
    tax_id?: string;
    email?: string;
  };
  // Article names from invoice lines for article lookup
  articles: Array<{
    name: string;
    reference?: string;
    description?: string;
    sellers_item_identification?: string;
    buyers_item_identification?: string;
  }>;
}

/**
 * Resolved entities needed for conversion
 */
export interface ResolvedEntities {
  supplier?: Contacts; // Contact entity (for supplier invoices)
  client?: Contacts; // Contact entity (for client invoices)
  articles: Map<string, Articles>; // Map of article name/reference to article entity
}

/**
 * Extract references from an EN16931 invoice that need to be resolved
 * before conversion to internal format.
 *
 * This allows the caller to fetch required articles and contacts from the database
 * before calling the converter.
 */
export function extractReferencesFromEN16931(
  invoice: EN16931Invoice
): EN16931References {
  return {
    seller: {
      name: invoice.seller.name,
      vat: invoice.seller.vat,
      tax_id: invoice.seller.tax_id,
      email: invoice.seller.contact?.email,
    },
    buyer: {
      name: invoice.buyer.name,
      vat: invoice.buyer.vat,
      tax_id: invoice.buyer.tax_id,
      email: invoice.buyer.contact?.email,
    },
    articles: invoice.lines.map((line) => ({
      name: line.item_information.name,
      reference: line.item_information.sellers_item_identification,
      description: line.item_information.description,
      sellers_item_identification:
        line.item_information.sellers_item_identification,
      buyers_item_identification:
        line.item_information.buyers_item_identification,
    })),
  };
}

/**
 * Convert EN16931 invoice to internal Invoices format
 *
 * @param en16931Invoice - The EN16931 invoice to convert
 * @param resolvedEntities - Pre-fetched entities (contacts, articles)
 * @param direction - Whether this is a received (supplier) or sent (client) invoice
 * @param ctx - Context for client_id
 * @throws Error if required entities are missing
 */
export function convertEN16931ToInternal(
  en16931Invoice: EN16931Invoice,
  resolvedEntities: ResolvedEntities,
  direction: "in" | "out",
  ctx: Context
): Partial<Invoices> {
  // Validate required entities
  if (direction === "in" && !resolvedEntities.supplier) {
    throw new Error(
      `Supplier contact not found for seller: ${en16931Invoice.seller.name}`
    );
  }
  if (direction === "out" && !resolvedEntities.client) {
    throw new Error(
      `Client contact not found for buyer: ${en16931Invoice.buyer.name}`
    );
  }

  // Determine invoice type based on type_code
  let type: Invoices["type"];
  if (direction === "in") {
    // Received invoice = supplier invoice
    if (en16931Invoice.type_code === 381) {
      type = "supplier_credit_notes";
    } else {
      type = "supplier_invoices";
    }
  } else {
    // Sent invoice = client invoice
    if (en16931Invoice.type_code === 381) {
      type = "credit_notes";
    } else {
      type = "invoices";
    }
  }

  // Convert invoice lines
  const content: InvoiceLine[] = en16931Invoice.lines.map((line) => {
    const articleKey =
      line.item_information.sellers_item_identification ||
      line.item_information.buyers_item_identification ||
      line.item_information.name;

    const article = resolvedEntities.articles.get(articleKey);

    if (!article) {
      throw new Error(
        `Article not found: ${line.item_information.name} (ref: ${articleKey})`
      );
    }

    // Parse VAT rate
    const vatRate = line.line_vat_information.invoiced_item_vat_rate || 0;

    // Calculate discount from allowances/charges
    const discount = new InvoiceDiscount();
    if (line.allowances_charges && line.allowances_charges.length > 0) {
      const allowance = line.allowances_charges.find(
        (ac) => ac.kind === "allowance"
      );
      if (allowance) {
        if (allowance.percentage) {
          discount.mode = "percentage";
          discount.value = allowance.percentage;
        } else {
          discount.mode = "amount";
          discount.value = allowance.amount;
        }
      }
    }

    const invoiceLine = new InvoiceLine();
    invoiceLine.article = article.id;
    invoiceLine.type = article.type || "product";
    invoiceLine.name = line.item_information.name;
    invoiceLine.reference =
      line.item_information.sellers_item_identification || "";
    invoiceLine.description = line.item_information.description || "";
    invoiceLine.unit = line.invoiced_quantity_unit_code;
    invoiceLine.quantity = line.invoiced_quantity;
    invoiceLine.unit_price = line.price_details.item_net_price;
    invoiceLine.tva = vatRate.toString();
    invoiceLine.discount = discount;
    invoiceLine.subscription = "";
    invoiceLine.quantity_ready = 0;
    invoiceLine.quantity_delivered = 0;
    invoiceLine.optional = false;
    invoiceLine.optional_checked = false;

    return invoiceLine;
  });

  // Calculate document-level discount
  const documentDiscount = new InvoiceDiscount();
  if (
    en16931Invoice.allowances_charges &&
    en16931Invoice.allowances_charges.length > 0
  ) {
    const allowance = en16931Invoice.allowances_charges.find(
      (ac) => ac.kind === "allowance"
    );
    if (allowance) {
      if (allowance.percentage) {
        documentDiscount.mode = "percentage";
        documentDiscount.value = allowance.percentage;
      } else {
        documentDiscount.mode = "amount";
        documentDiscount.value = allowance.amount;
      }
    }
  }

  // Parse payment instructions
  const payment_information: any = {};
  if (en16931Invoice.payment_details) {
    if (en16931Invoice.payment_details.payment_terms) {
      // Try to extract payment delay from payment terms
      const delayMatch =
        en16931Invoice.payment_details.payment_terms.match(/(\d+)\s*days?/i);
      if (delayMatch) {
        payment_information.delay = parseInt(delayMatch[1], 10);
      }
    }

    // Extract payment mode from payment_means_type_code
    // See UNTDID 4461 codes
    const paymentCode = en16931Invoice.payment_details.payment_means_type_code;
    if (paymentCode === "30" || paymentCode === "58") {
      payment_information.mode = ["bank_transfer"];
    } else if (paymentCode === "48" || paymentCode === "49") {
      payment_information.mode = ["card"];
    } else if (paymentCode === "49") {
      payment_information.mode = ["direct_debit"];
    } else {
      payment_information.mode = ["bank_transfer"]; // Default
    }

    // Extract IBAN if available
    if (en16931Invoice.payment_details.credit_transfer?.[0]) {
      const ct = en16931Invoice.payment_details.credit_transfer[0];
      payment_information.iban = ct.payment_account_identifier.value;
    }
  }

  // Build the internal invoice
  const invoice = new Invoices();
  invoice.client_id = ctx.client_id;
  invoice.type = type;
  invoice.state = "draft"; // New invoices start as draft
  invoice.name = en16931Invoice.invoice_number;
  invoice.reference = en16931Invoice.invoice_number;
  invoice.alt_reference = en16931Invoice.buyer_reference || "";
  invoice.emit_date = new Date(en16931Invoice.issue_date);
  invoice.language = "en"; // Default, could be inferred from postal addresses
  invoice.currency = en16931Invoice.currency_code;

  // Set supplier or client based on direction
  if (direction === "in") {
    if (!resolvedEntities.supplier) {
      throw new Error(
        `Supplier contact not found for seller: ${en16931Invoice.seller.name}`
      );
    }
    invoice.supplier = resolvedEntities.supplier.id;
  } else {
    if (!resolvedEntities.client) {
      throw new Error(
        `Client contact not found for buyer: ${en16931Invoice.buyer.name}`
      );
    }
    invoice.client = resolvedEntities.client.id;
  }

  // Delivery information
  if (en16931Invoice.delivery_information) {
    if (en16931Invoice.delivery_information.actual_delivery_date) {
      invoice.delivery_date = new Date(
        en16931Invoice.delivery_information.actual_delivery_date
      );
    }
    if (en16931Invoice.delivery_information.postal_address) {
      const addr = en16931Invoice.delivery_information.postal_address;
      invoice.delivery_address.address_line_1 = addr.street_name || "";
      invoice.delivery_address.address_line_2 =
        addr.additional_street_name || "";
      invoice.delivery_address.city = addr.city_name || "";
      invoice.delivery_address.zip = addr.postal_zone || "";
      invoice.delivery_address.country = addr.country || "";
    }
  }

  invoice.content = content;
  invoice.discount = documentDiscount;
  invoice.payment_information = payment_information;

  // Notes from invoice notes
  if (en16931Invoice.invoice_note && en16931Invoice.invoice_note.length > 0) {
    invoice.notes = en16931Invoice.invoice_note.map((n) => n.note).join("\n\n");
  }

  return invoice;
}

/**
 * Convert internal Invoices format to EN16931 invoice
 *
 * @param invoice - The internal invoice to convert
 * @param resolvedEntities - Pre-fetched entities (contacts, articles)
 * @throws Error if required entities are missing
 */
export function convertInternalToEN16931(
  invoice: Invoices,
  resolvedEntities: ResolvedEntities
): EN16931Invoice {
  // Determine direction from invoice type
  const isSupplier = invoice.type.startsWith("supplier_");
  const direction: "in" | "out" = isSupplier ? "in" : "out";

  // Get the appropriate contact
  const partnerContact =
    direction === "in" ? resolvedEntities.supplier : resolvedEntities.client;

  if (!partnerContact) {
    throw new Error(
      `Contact not found for ${direction === "in" ? "supplier" : "client"}`
    );
  }

  // Determine type code
  let typeCode = 380; // Standard invoice
  if (invoice.type.includes("credit_note")) {
    typeCode = 381; // Credit note
  } else if (invoice.type.includes("quote")) {
    typeCode = 325; // Proforma invoice / quote
  }

  // Convert invoice lines
  const lines = invoice.content.map((line, index) => {
    const article = resolvedEntities.articles.get(line.article);

    if (!article) {
      throw new Error(`Article not found: ${line.article}`);
    }

    // Parse VAT rate
    const vatRate = parseFloat(line.tva) || 0;

    // Determine VAT category code based on rate
    let vatCategoryCode = "S"; // Standard rate
    if (vatRate === 0) {
      vatCategoryCode = "Z"; // Zero rated
    } else if (vatRate < 10) {
      vatCategoryCode = "AA"; // Reduced rate
    }

    // Calculate net amount (quantity * unit_price before discount)
    let lineNetAmount = line.quantity * line.unit_price;

    // Apply line discount
    const allowances: any[] = [];
    if (line.discount.mode && line.discount.value > 0) {
      const discountAmount =
        line.discount.mode === "percentage"
          ? (lineNetAmount * line.discount.value) / 100
          : line.discount.value;

      allowances.push({
        amount: discountAmount,
        kind: "allowance",
        percentage:
          line.discount.mode === "percentage" ? line.discount.value : undefined,
        base_amount: lineNetAmount,
      });

      lineNetAmount -= discountAmount;
    }

    return {
      line_number: (index + 1).toString(),
      invoiced_quantity: line.quantity,
      invoiced_quantity_unit_code: line.unit || "C62", // C62 = unit
      line_net_amount: lineNetAmount,
      line_vat_information: {
        invoiced_item_vat_category_code: vatCategoryCode,
        invoiced_item_vat_rate: vatRate,
      },
      allowances_charges: allowances.length > 0 ? allowances : undefined,
      price_details: {
        item_net_price: line.unit_price,
        base_quantity: 1,
        base_quantity_unit_code: line.unit || "C62",
      },
      item_information: {
        name: line.name,
        description: line.description || undefined,
        sellers_item_identification: line.reference || undefined,
        buyers_item_identification:
          article.supplier_reference || article.internal_reference || undefined,
      },
    };
  });

  // Calculate totals
  const sumOfLineNetAmounts = lines.reduce(
    (sum, line) => sum + line.line_net_amount,
    0
  );

  // Apply document-level discount
  let documentAllowanceAmount = 0;
  const documentAllowances: any[] = [];
  if (invoice.discount.mode && invoice.discount.value > 0) {
    documentAllowanceAmount =
      invoice.discount.mode === "percentage"
        ? (sumOfLineNetAmounts * invoice.discount.value) / 100
        : invoice.discount.value;

    documentAllowances.push({
      amount: documentAllowanceAmount,
      kind: "allowance",
      percentage:
        invoice.discount.mode === "percentage"
          ? invoice.discount.value
          : undefined,
      base_amount: sumOfLineNetAmounts,
    });
  }

  const totalWithoutVat = sumOfLineNetAmounts - documentAllowanceAmount;

  // Calculate VAT breakdown
  const vatByRate = new Map<number, number>();
  lines.forEach((line) => {
    const vatRate = line.line_vat_information.invoiced_item_vat_rate || 0;
    const taxableAmount = line.line_net_amount;
    const vatAmount = (taxableAmount * vatRate) / 100;

    vatByRate.set(vatRate, (vatByRate.get(vatRate) || 0) + vatAmount);
  });

  // Apply document discount to VAT calculation
  const adjustedVatByRate = new Map<
    number,
    { taxableAmount: number; vatAmount: number }
  >();
  const discountRatio = totalWithoutVat / sumOfLineNetAmounts;

  lines.forEach((line) => {
    const vatRate = line.line_vat_information.invoiced_item_vat_rate || 0;
    const adjustedTaxableAmount = line.line_net_amount * discountRatio;
    const vatAmount = (adjustedTaxableAmount * vatRate) / 100;

    const current = adjustedVatByRate.get(vatRate) || {
      taxableAmount: 0,
      vatAmount: 0,
    };
    adjustedVatByRate.set(vatRate, {
      taxableAmount: current.taxableAmount + adjustedTaxableAmount,
      vatAmount: current.vatAmount + vatAmount,
    });
  });

  const vatBreakDown = Array.from(adjustedVatByRate.entries()).map(
    ([rate, amounts]) => {
      let vatCategoryCode = "S"; // Standard rate
      if (rate === 0) {
        vatCategoryCode = "Z"; // Zero rated
      } else if (rate < 10) {
        vatCategoryCode = "AA"; // Reduced rate
      }

      return {
        taxable_amount: amounts.taxableAmount,
        tax_amount: amounts.vatAmount,
        vat_category_code: vatCategoryCode,
        vat_category_rate: rate,
      };
    }
  );

  const totalVat = Array.from(adjustedVatByRate.values()).reduce(
    (sum, amounts) => sum + amounts.vatAmount,
    0
  );
  const totalWithVat = totalWithoutVat + totalVat;

  // Build seller and buyer based on direction
  const myCompanyAddress = {
    street_name: invoice.delivery_address?.address_line_1 || "",
    additional_street_name: invoice.delivery_address?.address_line_2 || "",
    city_name: invoice.delivery_address?.city || "",
    postal_zone: invoice.delivery_address?.zip || "",
    country: invoice.delivery_address?.country || "",
  };

  const partnerAddress = {
    street_name: partnerContact.address?.address_line_1 || "",
    additional_street_name: partnerContact.address?.address_line_2 || "",
    city_name: partnerContact.address?.city || "",
    postal_zone: partnerContact.address?.zip || "",
    country: partnerContact.address?.country || "",
  };

  const seller =
    direction === "out"
      ? {
          name: "My Company", // Should be from context/config
          postal_address: myCompanyAddress,
        }
      : {
          name:
            getContactName(partnerContact) ||
            partnerContact.business_registered_id ||
            partnerContact.id,
          vat: partnerContact.business_tax_id,
          postal_address: partnerAddress,
          contact: partnerContact.email
            ? { email: partnerContact.email }
            : undefined,
        };

  const buyer =
    direction === "in"
      ? {
          name: "My Company", // Should be from context/config
          postal_address: myCompanyAddress,
        }
      : {
          name:
            getContactName(partnerContact) ||
            partnerContact.business_registered_id ||
            partnerContact.id,
          vat: partnerContact.business_tax_id,
          postal_address: partnerAddress,
          contact: partnerContact.email
            ? { email: partnerContact.email }
            : undefined,
        };

  // Payment instructions
  const paymentDetails = invoice.payment_information.mode
    ? {
        payment_means_type_code: invoice.payment_information.mode.includes(
          "bank_transfer"
        )
          ? "30"
          : invoice.payment_information.mode.includes("credit_card")
          ? "48"
          : "30",
        payment_terms: invoice.payment_information.delay
          ? `Payment within ${invoice.payment_information.delay} days`
          : undefined,
        credit_transfer: invoice.payment_information.bank_iban
          ? [
              {
                payment_account_identifier: {
                  value: invoice.payment_information.bank_iban,
                  scheme: "IBAN",
                },
              },
            ]
          : undefined,
      }
    : undefined;

  // Build EN16931 invoice
  const en16931Invoice: EN16931Invoice = {
    invoice_number: invoice.reference || invoice.name,
    issue_date: new Date(invoice.emit_date).toISOString().split("T")[0],
    due_date: invoice.payment_information.delay
      ? new Date(
          invoice.emit_date.getTime() +
            invoice.payment_information.delay * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0]
      : undefined,
    type_code: typeCode,
    currency_code: invoice.currency || "EUR",
    buyer_reference: invoice.alt_reference || undefined,
    invoice_note: invoice.notes ? [{ note: invoice.notes }] : undefined,
    seller,
    buyer,
    delivery_information: invoice.delivery_date
      ? {
          actual_delivery_date: new Date(invoice.delivery_date)
            .toISOString()
            .split("T")[0],
          postal_address: invoice.delivery_address.address_line_1
            ? {
                street_name: invoice.delivery_address.address_line_1,
                additional_street_name: invoice.delivery_address.address_line_2,
                city_name: invoice.delivery_address.city,
                postal_zone: invoice.delivery_address.zip,
                country: invoice.delivery_address.country,
              }
            : undefined,
        }
      : undefined,
    payment_details: paymentDetails,
    allowances_charges:
      documentAllowances.length > 0 ? documentAllowances : undefined,
    totals: {
      sum_of_invoice_line_net_amounts: sumOfLineNetAmounts,
      sum_of_allowances_on_document_level:
        documentAllowanceAmount > 0 ? documentAllowanceAmount : undefined,
      invoice_total_amount_without_vat: totalWithoutVat,
      invoice_total_vat_amount: totalVat,
      invoice_total_amount_with_vat: totalWithVat,
      amount_due_for_payment: totalWithVat,
      tax_exclusive_amount: totalWithoutVat,
      tax_amount: totalVat,
      tax_inclusive_amount: totalWithVat,
    },
    vat_break_down: vatBreakDown,
    lines,
  };

  return en16931Invoice;
}
