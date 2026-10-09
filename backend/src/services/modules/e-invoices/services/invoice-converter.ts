import Clients, { Address } from "#src/services/clients/entities/clients";
import Services from "#src/services/index";
import { search } from "#src/services/rest/services/rest";
import {
  formatDateInTimezone,
  getContactName,
} from "#src/services/utils";
import { Context } from "#src/types";
import { getUnitCode, getVatCode } from "@shared/consts";
import {
  EN16931AllowanceOrCharge,
  EN16931Buyer,
  EN16931Invoice,
  EN16931InvoiceLineAllowanceOrCharge,
  EN16931PaymentInstructions,
  EN16931PostalAddress,
  EN16931Seller,
  EN16931VatBreakDown,
} from "@shared/en16931-types";
import { getTvaValue, toCents } from "@shared/invoices";
import _ from "lodash";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import Invoices, {
  InvoiceDiscount,
  InvoiceLine,
} from "../../invoices/entities/invoices";
import { getInvoiceWithFormatsOverrides } from "../../invoices/services/utils";

/**
 * References extracted from an EN16931 invoice that need to be resolved
 * before conversion to internal format
 */
export interface EN16931References {
  // Seller information for contact lookup
  seller: {
    name: string;
    vat_identifier?: string;
    postal_address?: EN16931PostalAddress;
    identifiers: [
      {
        value: string; // SIRENE
        scheme: string; // Default to "0225";
      }
    ];
    legal_registration_identifier: {
      value: string; // SIRENE
      scheme: string; // Default to "0002";
    };
    electronic_address: {
      value: string; // E-INVOICE ADDRESS
      scheme: string; // Ex. "0225";
    };
  };
  // Buyer information for contact lookup
  buyer: {
    name: string;
    vat_identifier?: string;
    postal_address?: EN16931PostalAddress;
    identifiers: [
      {
        value: string; // SIRENE
        scheme: string; // Default to "0225";
      }
    ];
    legal_registration_identifier: {
      value: string; // SIRENE
      scheme: string; // Default to "0002";
    };
    electronic_address: {
      value: string; // E-INVOICE ADDRESS
      scheme: string; // Ex. "0225";
    };
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
  self: Clients;
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
    seller: invoice.seller,
    buyer: invoice.buyer,
    articles: invoice.lines.map((line) => ({
      name: line.item_information.name,
      reference: line.item_information.seller_identifier,
      description: line.item_information.description,
      sellers_item_identification: line.item_information.seller_identifier,
      buyers_item_identification: line.item_information.buyer_identifier,
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
      line.item_information.seller_identifier ||
      line.item_information.buyer_identifier ||
      line.item_information.name;

    const article = resolvedEntities.articles.get(articleKey);

    if (!article) {
      throw new Error(
        `Article not found: ${line.item_information.name} (ref: ${articleKey})`
      );
    }

    // Parse VAT rate
    const vatFullCode = getVatCode(
      line.vat_information.invoiced_item_vat_rate || "0",
      line.vat_information.invoiced_item_vat_category_code
    );

    // Calculate discount from allowances/charges
    const discount = {} as InvoiceDiscount;
    let totalAllowanceAmount = 0;
    let totalChargeAmount = 0;

    if (line.allowances && line.allowances.length > 0) {
      for (const allowance of line.allowances) {
        totalAllowanceAmount += parseFloat(allowance.amount || "0");
      }
    }

    if (line.charges && line.charges.length > 0) {
      for (const charge of line.charges) {
        totalChargeAmount += parseFloat(charge.amount || "0");
      }
    }

    const netDiscountAmount = totalAllowanceAmount - totalChargeAmount;

    if (netDiscountAmount > 0) {
      discount.mode = "amount";
      discount.value = netDiscountAmount;
    }

    const invoiceLine = {} as InvoiceLine;
    invoiceLine.article = article.id;
    invoiceLine.type = article.type || "product";
    invoiceLine.name = line.item_information.name;
    invoiceLine.reference = line.item_information.seller_identifier || "";
    invoiceLine.description = line.item_information.description || "";
    invoiceLine.unit = line.invoiced_quantity_code;
    invoiceLine.quantity = parseFloat(line.invoiced_quantity);
    invoiceLine.unit_price = parseFloat(line.price_details.item_net_price);
    invoiceLine.tva = vatFullCode || "S:20";
    invoiceLine.discount = discount;
    invoiceLine.subscription = "";
    invoiceLine.quantity_ready = 0;
    invoiceLine.quantity_delivered = 0;
    invoiceLine.optional = false;
    invoiceLine.optional_checked = false;

    return invoiceLine;
  });

  // Calculate document-level discount
  const documentDiscount = {} as InvoiceDiscount;
  let totalDocAllowanceAmount = 0;
  let totalDocChargeAmount = 0;

  if (
    en16931Invoice.document_level_allowances &&
    en16931Invoice.document_level_allowances.length > 0
  ) {
    for (const allowance of en16931Invoice.document_level_allowances) {
      totalDocAllowanceAmount += parseFloat(allowance.amount || "0");
    }
  }

  if (en16931Invoice.charges && en16931Invoice.charges.length > 0) {
    for (const charge of en16931Invoice.charges) {
      totalDocChargeAmount += parseFloat(charge.amount || "0");
    }
  }

  const netDocDiscountAmount = totalDocAllowanceAmount - totalDocChargeAmount;

  if (netDocDiscountAmount > 0) {
    documentDiscount.mode = "amount";
    documentDiscount.value = netDocDiscountAmount;
  }

  // Parse payment instructions
  const payment_information: Invoices["payment_information"] =
    {} as Invoices["payment_information"];
  if (en16931Invoice.payment_terms) {
    // Try to extract payment delay from payment terms
    const delayMatch = en16931Invoice.payment_terms.match(
      /(\d+)\s*(days?|jours?)/i
    );
    if (delayMatch) {
      payment_information.delay = parseInt(delayMatch[1], 10);
    }
  }
  if (en16931Invoice.payment_instructions) {
    // Extract payment mode from payment_means_type_code
    // See UNTDID 4461 codes
    const paymentCode =
      en16931Invoice.payment_instructions.payment_means_type_code;
    if (paymentCode === "30" || paymentCode === "58") {
      payment_information.mode = ["bank_transfer"];
    } else if (paymentCode === "48") {
      payment_information.mode = ["credit_card"];
    } else if (paymentCode === "49") {
      payment_information.mode = ["bank_transfer"];
    } else {
      payment_information.mode = ["bank_transfer"]; // Default
    }

    // Extract IBAN if available
    if (en16931Invoice.payment_instructions.credit_transfers?.[0]) {
      const ct = en16931Invoice.payment_instructions.credit_transfers[0];
      payment_information.bank_iban = ct.payment_account_identifier.value;
    }
  }

  // Build the internal invoice
  const invoice = {} as Invoices;
  invoice.client_id = ctx.client_id;
  invoice.type = type;
  invoice.state = "draft"; // New invoices start as draft
  invoice.name = en16931Invoice.number;
  invoice.reference = en16931Invoice.number;
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
  if (en16931Invoice.delivery_information?.delivery_date) {
    invoice.delivery_date = new Date(
      en16931Invoice.delivery_information.delivery_date
    );
  }
  if (en16931Invoice.deliver_to_address) {
    const addr = en16931Invoice.deliver_to_address;
    invoice.delivery_address = {
      ...invoice.delivery_address,
      address_line_1: addr.address_line1 || "",
      address_line_2: addr.address_line2 || "",
      city: addr.city || "",
      zip: addr.post_code || "",
      country: addr.country_code || "",
    } as Invoices["delivery_address"];
  }

  invoice.content = content;
  invoice.discount = documentDiscount;
  invoice.payment_information = payment_information;

  // Notes from invoice notes
  if (en16931Invoice.notes && en16931Invoice.notes.length > 0) {
    invoice.notes = en16931Invoice.notes.map((n) => n.note).join("\n\n");
  }

  return invoice;
}

export async function getResolvedEntities(
  ctx: Context,
  document: Invoices
): Promise<ResolvedEntities> {
  const client = await Services.Clients.getClient(ctx, ctx.client_id);
  const contacts = await search<Contacts>(
    { ...ctx, role: "SYSTEM" },
    ContactsDefinition.name,
    {
      client_id: ctx.client_id,
      id: document.client || document.supplier,
    }
  );
  const articles = await search<Articles>(
    { ...ctx, role: "SYSTEM" },
    ArticlesDefinition.name,
    {
      client_id: ctx.client_id,
      id: _.uniq(document.content?.map((c) => c.article).filter(Boolean) || []),
    }
  );
  const articlesMap = new Map<string, Articles>();
  for (const article of articles.list) {
    articlesMap.set(article.id, article);
  }

  if (!client) {
    throw new Error("Client not found for the invoice");
  }

  if (!contacts?.list?.[0]) {
    throw new Error("Contact not found for the invoice");
  }

  return {
    self: client,
    client: contacts.list[0],
    supplier: contacts.list[0],
    articles: articlesMap,
  };
}

/**
 * EN16931 only allows 2 decimals on amounts (BR-DEC-*). Rounds and removes
 * floating point noise (e.g. 16.400000000000002).
 */
function round2(value: number): number {
  return toCents(value) / 100; // Same rounding as computePricesFromInvoice
}

/**
 * Format an amount with at most 2 decimals (BR-DEC-*)
 */
function amount(value: number): string {
  return `${round2(value)}`;
}

/**
 * The SIREN (BT-30, scheme 0002) must be exactly 9 digits (BR-FR-10) but we
 * often store the SIRET (14 digits, SIREN + NIC): keep the SIREN part only.
 */
export function toSiren(registration?: string): string | undefined {
  const digits = (registration || "").replace(/\s/g, "");
  if (/^\d{14}$/.test(digits)) return digits.slice(0, 9);
  return digits || undefined;
}

/**
 * Parse electronic address identifier from format "scheme:value"
 * @param identifier - The identifier string (e.g., "0225:315143296_3173")
 * @returns Object with scheme and value, or undefined if invalid
 */
function parseElectronicAddress(
  identifier?: string
): { scheme: string; value: string } | undefined {
  if (!identifier || !identifier.includes(":")) {
    return undefined;
  }
  const [scheme, value] = identifier.split(":", 2);
  if (!scheme || !value) {
    return undefined;
  }
  return { scheme: scheme.trim(), value: value.trim() };
}

/**
 * Build EN16931 postal address from internal Address entity
 */
function buildPostalAddress(address?: Address): EN16931PostalAddress {
  return {
    address_line1: address?.address_line_1 || "N/A",
    address_line2: address?.address_line_2 || undefined,
    city: address?.city || "N/A",
    post_code: address?.zip || "00000",
    country_code: address?.country || "FR",
  };
}

/**
 * Build EN16931 seller information from Client or Contact entity
 */
function buildEN16931Seller(
  entity: Clients | Contacts,
  _isCompany: boolean
): EN16931Seller {
  let name: string;
  let vat_identifier: string | undefined;
  let siren: string | undefined;
  let address: Address | undefined;
  let eInvoiceIdentifier: string | undefined;

  if ("company" in entity) {
    // It's a Clients entity
    name = entity.company?.legal_name || entity.company?.name || "N/A";
    vat_identifier = entity.company?.tax_number;
    siren = toSiren(entity.company?.registration_number);
    address = entity.address;
    eInvoiceIdentifier = undefined; // Clients don't have e_invoices_identifier yet
  } else {
    // It's a Contacts entity
    name = getContactName(entity) || entity.business_registered_id || entity.id;
    vat_identifier = entity.business_tax_id;
    siren = toSiren(entity.business_registered_id);
    address = entity.address;
    eInvoiceIdentifier = entity.e_invoices_identifier;
  }

  // Parse electronic address
  const electronicAddress = parseElectronicAddress(eInvoiceIdentifier);

  return {
    name,
    vat_identifier,
    postal_address: buildPostalAddress(address),
    identifiers: [
      {
        value: siren || "000000000",
        scheme: "0225", // SIRENE scheme
      },
    ],
    legal_registration_identifier: {
      value: siren || "000000000",
      scheme: "0002", // SIREN scheme
    },
    electronic_address: electronicAddress || {
      value: siren || "000000000",
      scheme: "0225",
    },
  };
}

/**
 * Build EN16931 buyer information from Client or Contact entity
 */
function buildEN16931Buyer(
  entity: Clients | Contacts,
  _isCompany: boolean
): EN16931Buyer {
  let name: string;
  let vat_identifier: string | undefined;
  let siren: string | undefined;
  let address: Address | undefined;
  let eInvoiceIdentifier: string | undefined;

  if ("company" in entity) {
    // It's a Clients entity
    name = entity.company?.name || entity.company?.legal_name || "My Company";
    vat_identifier = entity.company?.tax_number;
    siren = toSiren(entity.company?.registration_number);
    address = entity.address;
    eInvoiceIdentifier = undefined; // Clients don't have e_invoices_identifier yet
  } else {
    // It's a Contacts entity
    name = getContactName(entity) || entity.business_registered_id || entity.id;
    vat_identifier = entity.business_tax_id;
    siren = toSiren(entity.business_registered_id);
    address = entity.address;
    eInvoiceIdentifier = entity.e_invoices_identifier;
  }

  // Parse electronic address
  const electronicAddress = parseElectronicAddress(eInvoiceIdentifier);

  return {
    name,
    vat_identifier,
    postal_address: buildPostalAddress(address),
    identifiers: [
      {
        value: siren || "000000000",
        scheme: "0225", // SIRENE scheme
      },
    ],
    legal_registration_identifier: {
      value: siren || "000000000",
      scheme: "0002", // SIREN scheme
    },
    electronic_address: electronicAddress || {
      value: siren || "000000000",
      scheme: "0225",
    },
  };
}

/**
 * Build the EN16931 payment instructions (BG-16) from the payment information.
 * Only what we can fill in completely is sent:
 * - a credit transfer (30) needs the IBAN (BR-61),
 * - a direct debit (49/59) needs a mandate reference we don't have
 *   (PEPPOL-EN16931-R061), so it is not sent.
 * A bank transfer with an IBAN is preferred, otherwise the first known mode.
 */
export function buildPaymentInstructions(
  payment?: Invoices["payment_information"]
): EN16931PaymentInstructions | undefined {
  const modes: string[] = Array.isArray(payment?.mode) ? payment!.mode : [];
  const iban = (payment?.bank_iban || "").replace(/\s/g, "");

  if (modes.includes("bank_transfer") && iban) {
    return {
      payment_means_type_code: "30", // Credit transfer
      credit_transfers: [
        {
          payment_account_identifier: { value: iban, scheme: "IBAN" },
          payment_service_provider_identifier:
            (payment?.bank_bic || "").replace(/\s/g, "") || undefined,
        },
      ],
    };
  }

  // UNTDID 4461
  const codes: { [mode: string]: string } = {
    check: "20", // Cheque
    cash: "10", // In cash
    credit_card: "48", // Bank card
  };
  const code = modes.map((mode) => codes[mode]).find(Boolean);
  return code ? { payment_means_type_code: code } : undefined;
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
  resolvedEntities: ResolvedEntities,
  as?: "proforma" | "receipt_acknowledgement" | "delivery_slip"
): EN16931Invoice {
  if (as === "receipt_acknowledgement" || as === "delivery_slip") {
    throw new Error(`Conversion to ${as} is not supported yet`);
  }

  const company = resolvedEntities.self;
  // Determine direction from invoice type
  const isSupplier = invoice.type.startsWith("supplier_");
  const direction: "in" | "out" = isSupplier ? "in" : "out";

  // Get the appropriate contact
  const partnerContact =
    direction === "in" ? resolvedEntities.supplier : resolvedEntities.client;

  // Apply format overrides from client/company defaults
  invoice = getInvoiceWithFormatsOverrides(
    invoice,
    company,
    ...([resolvedEntities.supplier, resolvedEntities.client].filter(
      Boolean
    ) as Contacts[]) // Apply overrides from both supplier and client if available
  );

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

  if (as === "proforma") {
    typeCode = 325; // Proforma invoice / quote
  }

  // Convert invoice lines.
  // EN16931 forbids negative item net prices (BR-27), so a line that only
  // carries a rebate (negative net amount, e.g. a "remise" line) is emitted as
  // a document-level allowance instead of a negative-priced invoice line.
  const lines: EN16931Invoice["lines"] = [];
  const negativeLineAllowances: EN16931AllowanceOrCharge[] = [];

  (invoice.content || []).forEach((line) => {
    // Same lines as computePricesFromInvoice, otherwise totals would not
    // match (BR-CO-10): group headers and free text lines are purely visual,
    // unchecked options are not billed
    if (line.type === "group" || line.type === "separation") return;
    if (line.optional && !line.optional_checked) return;

    // Articles are optional (e.g. correction lines)
    const article = line.article
      ? resolvedEntities.articles.get(line.article)
      : undefined;
    if (line.article && !article) {
      throw new Error(`Article not found: ${line.article}`);
    }

    // Same default as computePricesFromInvoice
    line = { ...line, tva: line.tva || "O:VATEX-EU-O" };

    // Parse VAT rate
    const vatRate = round2((getTvaValue(line.tva) || 0) * 100);

    // Get unit code (convert from internal label to standard code if needed)
    const unitCode = getUnitCode(line.unit) || line.unit || "C62"; // C62 = unit

    // Determine VAT category code and exemption reason
    // line.tva could be a rate like "20%" or a label like "Hors UE"
    const vatCategoryKey = getVatCode(line.tva);
    let vatCategoryCode = "S"; // Standard rate

    if (vatCategoryKey) {
      // Split the key format "category:reason" or "category:rate"
      const parts = vatCategoryKey.split(":");
      vatCategoryCode = parts[0];
    } else {
      // Fallback: determine based on rate
      if (vatRate === 0) {
        vatCategoryCode = "Z"; // Zero rated
      } else if (vatRate < 10 && vatRate > 0) {
        vatCategoryCode = "S"; // Standard rate (for reduced rates in France)
      }
    }

    // Calculate net amount (quantity * unit_price before discount)
    // Rounded the same way as computePricesFromInvoice so totals match the PDF
    const grossAmount = (line.quantity || 0) * (line.unit_price || 0);
    let lineNetAmount = round2(grossAmount);

    // A line with a negative net amount represents a rebate. EN16931 does not
    // allow negative item net prices (BR-27), so convert it to a document-level
    // allowance carrying the line's VAT category and rate.
    if (lineNetAmount < 0) {
      negativeLineAllowances.push({
        amount: amount(Math.abs(lineNetAmount)),
        reason: line.name || undefined,
        reason_code: "95", // Discount
        vat_category_code: vatCategoryCode,
        vat_rate: `${vatRate}`,
      });
      return;
    }

    // Apply line discount (a positive discount value, so an allowance)
    const allowances: EN16931InvoiceLineAllowanceOrCharge[] = [];
    if (line.discount && line.discount.mode && line.discount.value > 0) {
      const discountAmount = round2(
        line.discount.mode === "percentage"
          ? (grossAmount * line.discount.value) / 100
          : line.discount.value
      );

      if (discountAmount > 0) {
        allowances.push({
          amount: amount(discountAmount),
          percent:
            line.discount.mode === "percentage"
              ? `${line.discount.value}`
              : undefined,
          base_amount: amount(lineNetAmount),
          reason_code: "95", // Discount
        });
        lineNetAmount -= discountAmount;
      }
    }

    lines.push({
      identifier: `${lines.length + 1}`,

      invoiced_quantity: `${line.quantity}`,
      invoiced_quantity_code: unitCode,

      net_amount: amount(lineNetAmount),

      item_information: {
        name: line.name,
        description: line.description || undefined,
        seller_identifier: line.reference || undefined,
        buyer_identifier:
          article?.supplier_reference ||
          article?.internal_reference ||
          undefined,
      },

      allowances: allowances.length > 0 ? allowances : undefined,

      price_details: {
        item_net_price: `${line.unit_price}`,
        item_price_base_quantity: "1",
        quantity_unit_code: unitCode,
      },

      vat_information: {
        invoiced_item_vat_category_code: vatCategoryCode,
        invoiced_item_vat_rate: `${vatRate}`,
      },
    });
  });

  // Calculate totals
  const sumOfLineNetAmounts = round2(
    lines.reduce((sum, line) => sum + parseFloat(line.net_amount), 0)
  );

  // Use precomputed allowances breakdown
  let documentAllowances: EN16931AllowanceOrCharge[] = [];
  let documentCharges: EN16931AllowanceOrCharge[] = [];
  let documentAllowanceAmount = 0;
  const documentChargeAmount = 0;

  if (invoice.total?.allowances_breakdown) {
    for (const allowance of invoice.total.allowances_breakdown) {
      const vatCategoryKey = getVatCode(allowance.tva);
      let vatCategoryCode = "S"; // Standard rate
      if (vatCategoryKey) {
        const parts = vatCategoryKey.split(":");
        vatCategoryCode = parts[0];
      }
      const vatRate = round2(getTvaValue(allowance.tva) * 100);

      documentAllowances.push({
        amount: amount(allowance.amount),
        base_amount: amount(allowance.base_amount),
        reason_code: "95", // Discount
        vat_category_code: vatCategoryCode,
        vat_rate: vatRate.toString(),
      });
      documentAllowanceAmount += round2(allowance.amount);
    }
  }

  // Fold rebate lines (negative net amounts) into the document-level allowances
  // so that BT-106/BT-107/BT-109 stay consistent (BR-CO-13).
  for (const allowance of negativeLineAllowances) {
    documentAllowances.push(allowance);
    documentAllowanceAmount += parseFloat(allowance.amount);
  }

  documentAllowances = documentAllowances.filter(
    (a) => parseFloat(a.amount) > 0
  );
  documentCharges = documentCharges.filter((c) => parseFloat(c.amount) > 0);

  // Use precomputed VAT breakdown
  const vatBreakDown: EN16931VatBreakDown[] = [];
  if (invoice.total?.vat_breakdown) {
    for (const vb of invoice.total.vat_breakdown) {
      const vatCategoryKey = getVatCode(vb.tva);
      let vatCategoryCode = "S"; // Standard rate
      if (vatCategoryKey) {
        const parts = vatCategoryKey.split(":");
        vatCategoryCode = parts[0];
      }
      const vatRate = round2(getTvaValue(vb.tva) * 100);

      vatBreakDown.push({
        vat_category_taxable_amount: amount(vb.taxable_amount),
        vat_category_tax_amount: amount(vb.tax_amount),
        vat_category_code: vatCategoryCode,
        vat_category_rate: vatRate.toString(),
      });
    }
  }

  // Fallback: if the precomputed VAT breakdown is missing or empty (e.g. legacy
  // or stale totals), derive it from the invoice lines and document-level
  // allowances/charges. Without this, the generated document has no VAT
  // breakdown group and Factur-X validation fails with BR-CO-18 (BG-23).
  if (vatBreakDown.length === 0 && lines.length > 0) {
    const derived: { [key: string]: EN16931VatBreakDown } = {};

    const addToGroup = (
      categoryCode: string,
      rate: number,
      taxableDelta: number
    ) => {
      const key = `${categoryCode}:${rate}`;
      if (!derived[key]) {
        derived[key] = {
          vat_category_taxable_amount: "0",
          vat_category_tax_amount: "0",
          vat_category_code: categoryCode,
          vat_category_rate: rate.toString(),
        };
      }
      const taxable =
        parseFloat(derived[key].vat_category_taxable_amount) + taxableDelta;
      derived[key].vat_category_taxable_amount = taxable.toFixed(2);
      derived[key].vat_category_tax_amount = (taxable * (rate / 100)).toFixed(2);
    };

    for (const line of lines) {
      addToGroup(
        line.vat_information.invoiced_item_vat_category_code,
        parseFloat(line.vat_information.invoiced_item_vat_rate),
        parseFloat(line.net_amount)
      );
    }

    for (const allowance of documentAllowances) {
      addToGroup(
        allowance.vat_category_code,
        parseFloat(allowance.vat_rate),
        -parseFloat(allowance.amount)
      );
    }

    for (const charge of documentCharges) {
      addToGroup(
        charge.vat_category_code,
        parseFloat(charge.vat_rate),
        parseFloat(charge.amount)
      );
    }

    vatBreakDown.push(...Object.values(derived));
  }

  // Calculate totals from the final VAT breakdown (precomputed or derived) so
  // the document totals stay consistent with the breakdown groups.
  documentAllowanceAmount = round2(documentAllowanceAmount);
  const totalWithoutVat = round2(
    vatBreakDown.length > 0
      ? vatBreakDown.reduce(
          (sum, vb) => sum + parseFloat(vb.vat_category_taxable_amount),
          0
        )
      : sumOfLineNetAmounts - documentAllowanceAmount + documentChargeAmount
  );

  const totalVat = round2(
    vatBreakDown.reduce(
      (sum, vb) => sum + parseFloat(vb.vat_category_tax_amount),
      0
    )
  );

  // BR-CO-15: total with VAT MUST be total without VAT + total VAT, so we
  // compute it here instead of using the internal total (rounded differently)
  const totalWithVat = round2(totalWithoutVat + totalVat);

  // Build seller and buyer based on direction
  const seller: EN16931Seller =
    direction === "out"
      ? buildEN16931Seller(company, true)
      : buildEN16931Seller(partnerContact, true);

  const buyer: EN16931Buyer =
    direction === "in"
      ? buildEN16931Buyer(company, true)
      : buildEN16931Buyer(partnerContact, true);

  const paymentInstructions = buildPaymentInstructions(
    invoice.payment_information
  );

  // Build standardized notes (PMT, PMD, AAB) from payment information
  const invoiceNotes: Array<{ note: string; subject_code?: string }> = [];

  // PMT - Recovery fees (Indemnité forfaitaire pour frais de recouvrement)
  const recoveryFee = invoice.payment_information.recovery_fee?.trim();
  if (recoveryFee) {
    invoiceNotes.push({
      note: `L'indemnité forfaitaire pour frais de recouvrement est de ${recoveryFee}.`,
      subject_code: "PMT",
    });
  } else {
    invoiceNotes.push({
      note: "L'indemnité forfaitaire légale pour frais de recouvrement est de 40 €.",
      subject_code: "PMT",
    });
  }

  // PMD - Late payment penalties (Pénalités de retard)
  const latePenalty = invoice.payment_information.late_penalty?.trim();
  if (latePenalty) {
    invoiceNotes.push({
      note: `À défaut de règlement à la date d'échéance, une pénalité de ${latePenalty} sera applicable immédiatement.`,
      subject_code: "PMD",
    });
  } else {
    invoiceNotes.push({
      note: "À défaut de règlement à la date d'échéance, une pénalité égale au taux BCE majoré de 10 points sera applicable immédiatement.",
      subject_code: "PMD",
    });
  }

  // AAB - Early payment discount (Escompte pour paiement anticipé)
  // TODO: Add early payment discount field to Payment model if needed
  invoiceNotes.push({
    note: "Aucun escompte pour paiement anticipé.",
    subject_code: "AAB",
  });

  // Add general notes if they exist
  if (invoice.notes) {
    invoiceNotes.push({ note: invoice.notes });
  }

  const currencyCode = (invoice.currency || "EUR").toUpperCase();

  // Dates are stored as timestamps (usually local midnight), they must be
  // formatted in the company timezone (same as the PDF)
  const timezone = company?.preferences?.timezone || "Europe/Paris";
  const formatDate = (date: number | string | Date) =>
    formatDateInTimezone(date, timezone);

  // Build EN16931 invoice
  const en16931Invoice: EN16931Invoice = {
    process_control: {
      business_process_type: "M1",
      specification_identifier: "urn:cen.eu:en16931:2017",
    },
    number: invoice.reference || invoice.name,
    issue_date: formatDate(invoice.emit_date),
    payment_due_date: invoice.payment_information.computed_date
      ? formatDate(invoice.payment_information.computed_date)
      : undefined,
    type_code: typeCode,
    currency_code: currencyCode,
    buyer_reference: invoice.alt_reference || undefined,
    notes: invoiceNotes.length > 0 ? invoiceNotes : undefined,
    invoicing_period:
      invoice.from_subscription?.from &&
      invoice.from_subscription?.to &&
      invoice.from_subscription?.frequency
        ? {
            start_date: formatDate(invoice.from_subscription.from),
            end_date: formatDate(invoice.from_subscription.to),
          }
        : undefined,
    seller,
    buyer,
    // ApplicableHeaderTradeDelivery is always written in CII, so it must not
    // be left empty (PEPPOL-EN16931-R008). Without an explicit delivery date,
    // the delivery date is the issue date.
    delivery_information: {
      delivery_date: formatDate(invoice.delivery_date || invoice.emit_date),
      // Named deliver to party, so no empty name element is written
      deliver_to_name: invoice.delivery_address?.address_line_1
        ? buyer.name
        : undefined,
    },
    deliver_to_address: invoice.delivery_address?.address_line_1
      ? {
          address_line1: invoice.delivery_address.address_line_1,
          address_line2: invoice.delivery_address.address_line_2 || undefined,
          city: invoice.delivery_address.city || undefined,
          post_code: invoice.delivery_address.zip || undefined,
          country_code: invoice.delivery_address.country || "FR",
        }
      : undefined,
    payment_terms:
      invoice.payment_information.delay &&
      invoice.payment_information.delay_type === "direct"
        ? `Paiement à ${invoice.payment_information.delay} jours.`
        : undefined,
    payment_instructions: paymentInstructions,
    document_level_allowances:
      documentAllowances.length > 0 ? documentAllowances : undefined,
    charges: documentCharges.length > 0 ? documentCharges : undefined,
    totals: {
      sum_invoice_lines_amount: `${sumOfLineNetAmounts}`,
      sum_allowances_amount:
        documentAllowanceAmount > 0 ? `${documentAllowanceAmount}` : undefined,
      sum_charges_amount:
        documentChargeAmount > 0 ? `${documentChargeAmount}` : undefined,
      total_without_vat: `${totalWithoutVat}`,
      // BR-CO-15 only counts the VAT total whose currencyID is the invoice
      // currency (BT-5): otherwise BT-112 must equal BT-109, which fails as
      // soon as there is VAT
      total_vat_amount:
        totalVat !== 0
          ? {
              value: `${totalVat}`,
              currency_code: currencyCode,
            }
          : undefined,
      total_with_vat: `${totalWithVat}`,
      amount_due_for_payment: `${totalWithVat}`,
    },
    vat_break_down: vatBreakDown,
    lines,
  };

  return en16931Invoice;
}
