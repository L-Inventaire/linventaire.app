import Services from "#src/services/index";
import Clients, { Address } from "#src/services/clients/entities/clients";
import { search } from "#src/services/rest/services/rest";
import { getContactName } from "#src/services/utils";
import { Context } from "#src/types";
import _ from "lodash";
import {
  EN16931ElectronicAddress,
  EN16931Invoice,
  EN16931PostalAddress,
  EN16931VatBreakDown,
  EN16931Seller,
  EN16931Buyer,
} from "../../../../platform/e-invoices/adapters/superpdp/en16931-types";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import Invoices, {
  InvoiceDiscount,
  InvoiceLine,
} from "../../invoices/entities/invoices";
import {
  getUnitCode,
  getVatCategory,
  getVatExemptionReason,
} from "../../invoices/types/maps";
import { getTvaValue } from "../../invoices/utils";

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
    const vatRate = line.vat_information.invoiced_item_vat_rate || 0;

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
  const payment_information: Invoices["payment_information"] =
    {} as Invoices["payment_information"];
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
    } else if (paymentCode === "48") {
      payment_information.mode = ["credit_card"];
    } else if (paymentCode === "49") {
      payment_information.mode = ["bank_transfer"];
    } else {
      payment_information.mode = ["bank_transfer"]; // Default
    }

    // Extract IBAN if available
    if (en16931Invoice.payment_details.credit_transfer?.[0]) {
      const ct = en16931Invoice.payment_details.credit_transfer[0];
      payment_information.bank_iban = ct.payment_account_identifier.value;
    }
  }

  // Build the internal invoice
  const invoice = new Invoices();
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
  if (en16931Invoice.delivery_information) {
    if (en16931Invoice.delivery_information.actual_delivery_date) {
      invoice.delivery_date = new Date(
        en16931Invoice.delivery_information.actual_delivery_date
      );
    }
    if (en16931Invoice.delivery_information.postal_address) {
      const addr = en16931Invoice.delivery_information.postal_address;
      invoice.delivery_address.address_line_1 = addr.address_line1 || "";
      invoice.delivery_address.address_line_2 = addr.address_line2 || "";
      invoice.delivery_address.city = addr.city || "";
      invoice.delivery_address.zip = addr.post_code || "";
      invoice.delivery_address.country = addr.country_code || "";
    }
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
      id: document.client,
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
    address_line2: address?.address_line_2 || "",
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
  isCompany: boolean
): EN16931Seller {
  let name: string;
  let vat_identifier: string | undefined;
  let siren: string | undefined;
  let address: Address | undefined;
  let email: string | undefined;
  let eInvoiceIdentifier: string | undefined;

  if ("company" in entity) {
    // It's a Clients entity
    name = entity.company?.legal_name || entity.company?.name || "N/A";
    vat_identifier = entity.company?.tax_number;
    siren = entity.company?.registration_number;
    address = entity.address;
    eInvoiceIdentifier = undefined; // Clients don't have e_invoices_identifier yet
  } else {
    // It's a Contacts entity
    name = getContactName(entity) || entity.business_registered_id || entity.id;
    vat_identifier = entity.business_tax_id;
    siren = entity.business_registered_id;
    address = entity.address;
    email = entity.email;
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
  isCompany: boolean
): EN16931Buyer {
  let name: string;
  let vat_identifier: string | undefined;
  let siren: string | undefined;
  let address: Address | undefined;
  let email: string | undefined;
  let eInvoiceIdentifier: string | undefined;

  if ("company" in entity) {
    // It's a Clients entity
    name = entity.company?.name || entity.company?.legal_name || "My Company";
    vat_identifier = entity.company?.tax_number;
    siren = entity.company?.registration_number;
    address = entity.address;
    eInvoiceIdentifier = undefined; // Clients don't have e_invoices_identifier yet
  } else {
    // It's a Contacts entity
    name = getContactName(entity) || entity.business_registered_id || entity.id;
    vat_identifier = entity.business_tax_id;
    siren = entity.business_registered_id;
    address = entity.address;
    email = entity.email;
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

  // Convert invoice lines
  const lines = invoice.content.map((line, index) => {
    const article = resolvedEntities.articles.get(line.article);

    if (!article) {
      throw new Error(`Article not found: ${line.article}`);
    }

    // Parse VAT rate
    const vatRate = (getTvaValue(line.tva) || 0) * 100;

    // Get unit code (convert from internal label to standard code if needed)
    const unitCode = getUnitCode(line.unit) || line.unit || "C62"; // C62 = unit

    // Determine VAT category code and exemption reason
    // line.tva could be a rate like "20%" or a label like "Hors UE"
    const vatCategoryKey = getVatCategory(line.tva);
    let vatCategoryCode = "S"; // Standard rate
    let exemptionReasonCode: string | undefined = undefined;
    let exemptionReason: string | undefined = undefined;

    if (vatCategoryKey) {
      // Split the key format "category:reason" or "category:rate"
      const parts = vatCategoryKey.split(":");
      vatCategoryCode = parts[0];
      if (parts.length > 1 && parts[0] !== "S") {
        // If it's not a standard rate, check for exemption reason
        exemptionReasonCode = parts[1];
        // Try to find the full exemption reason text
        const reasonKey = getVatExemptionReason(line.tva);
        if (reasonKey) {
          exemptionReasonCode = reasonKey.split(":")[1];
          exemptionReason = line.tva; // Keep the original label as reason text
        }
      }
    } else {
      // Fallback: determine based on rate
      if (vatRate === 0) {
        vatCategoryCode = "Z"; // Zero rated
      } else if (vatRate < 10 && vatRate > 0) {
        vatCategoryCode = "S"; // Standard rate (for reduced rates in France)
      }
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
      invoiced_quantity_unit_code: unitCode,
      net_amount: lineNetAmount,
      vat_information: {
        invoiced_item_vat_category_code: vatCategoryCode,
        invoiced_item_vat_rate: vatRate,
        vat_exemption_reason_code: exemptionReasonCode,
        vat_exemption_reason: exemptionReason,
      },
      allowances_charges: allowances.length > 0 ? allowances : undefined,
      price_details: {
        item_net_price: line.unit_price,
        base_quantity: 1,
        base_quantity_unit_code: unitCode,
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
    (sum, line) => sum + line.net_amount,
    0
  );

  // Apply document-level discount
  let documentAllowanceAmount = 0;
  const documentAllowances: any[] = [];
  if (invoice.discount?.mode && invoice.discount.value > 0) {
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

  // Calculate VAT breakdown - group by category code + exemption reason code
  interface VatBreakdownKey {
    categoryCode: string;
    exemptionReasonCode?: string;
    exemptionReason?: string;
    rate: number;
  }

  const vatBreakdownMap = new Map<
    string,
    {
      key: VatBreakdownKey;
      taxableAmount: number;
      vatAmount: number;
    }
  >();

  const discountRatio = totalWithoutVat / sumOfLineNetAmounts;

  lines.forEach((line) => {
    const vatInfo = line.vat_information;
    const vatRate = vatInfo.invoiced_item_vat_rate || 0;
    const categoryCode = vatInfo.invoiced_item_vat_category_code;
    const exemptionReasonCode = vatInfo.vat_exemption_reason_code;
    const exemptionReason = vatInfo.vat_exemption_reason;

    // Create unique key for grouping
    const groupKey = `${categoryCode}:${
      exemptionReasonCode || "none"
    }:${vatRate}`;

    const adjustedTaxableAmount = line.net_amount * discountRatio;
    const vatAmount = (adjustedTaxableAmount * vatRate) / 100;

    const current = vatBreakdownMap.get(groupKey);
    if (current) {
      current.taxableAmount += adjustedTaxableAmount;
      current.vatAmount += vatAmount;
    } else {
      vatBreakdownMap.set(groupKey, {
        key: {
          categoryCode,
          exemptionReasonCode,
          exemptionReason,
          rate: vatRate,
        },
        taxableAmount: adjustedTaxableAmount,
        vatAmount,
      });
    }
  });

  const vatBreakDown = Array.from(vatBreakdownMap.values()).map((entry) => {
    const breakdown: EN16931VatBreakDown = {
      vat_category_taxable_amount: `${entry.taxableAmount}`,
      vat_category_tax_amount: `${entry.vatAmount}`,
      vat_category_code: entry.key.categoryCode,
      vat_category_rate: `${entry.key.rate}`,
    };

    if (entry.key.exemptionReasonCode) {
      breakdown.vat_exemption_reason_code = entry.key.exemptionReasonCode;
    }
    if (entry.key.exemptionReason) {
      breakdown.vat_exemption_reason = entry.key.exemptionReason;
    }

    return breakdown;
  });

  const totalVat = Array.from(vatBreakdownMap.values()).reduce(
    (sum, entry) => sum + entry.vatAmount,
    0
  );
  const totalWithVat = totalWithoutVat + totalVat;

  // Add global VAT codes if there's only one breakdown entry
  let globalVatCategoryCode: string | undefined = undefined;
  let globalVatExemptionReasonCode: string | undefined = undefined;

  if (vatBreakDown.length === 1) {
    globalVatCategoryCode = vatBreakDown[0].vat_category_code;
    globalVatExemptionReasonCode = vatBreakDown[0].vat_exemption_reason_code;
  }

  // Build seller and buyer based on direction
  const seller: EN16931Seller =
    direction === "out"
      ? buildEN16931Seller(company, true)
      : buildEN16931Seller(partnerContact, true);

  const buyer: EN16931Buyer =
    direction === "in"
      ? buildEN16931Buyer(company, true)
      : buildEN16931Buyer(partnerContact, true);

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
        payment_terms:
          invoice.payment_information.delay &&
          invoice.payment_information.delay_type === "direct"
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

  // Build EN16931 invoice
  const en16931Invoice: EN16931Invoice = {
    process_control: {
      business_process_type: "M1",
      specification_identifier: "urn:cen.eu:en16931:2017",
    },
    number: invoice.reference || invoice.name,
    issue_date: new Date(invoice.emit_date).toISOString().split("T")[0],
    payment_due_date: invoice.payment_information.computed_date
      ? new Date(invoice.payment_information.computed_date)
          .toISOString()
          .split("T")[0]
      : undefined,
    type_code: typeCode,
    currency_code: invoice.currency || "EUR",
    buyer_reference: invoice.alt_reference || undefined,
    notes: invoiceNotes.length > 0 ? invoiceNotes : undefined,
    vat_category_code: globalVatCategoryCode,
    vat_exemption_reason_code: globalVatExemptionReasonCode,
    seller,
    buyer,
    delivery_information: invoice.delivery_date
      ? {
          actual_delivery_date: new Date(invoice.delivery_date)
            .toISOString()
            .split("T")[0],
          postal_address: invoice.delivery_address.address_line_1
            ? {
                address_line1: invoice.delivery_address.address_line_1,
                address_line2: invoice.delivery_address.address_line_2,
                city: invoice.delivery_address.city,
                post_code: invoice.delivery_address.zip,
                country_code: invoice.delivery_address.country,
              }
            : undefined,
        }
      : undefined,
    payment_details: paymentDetails,
    allowances_charges:
      documentAllowances.length > 0 ? documentAllowances : undefined,
    totals: {
      sum_invoice_lines_amount: `${sumOfLineNetAmounts}`,
      sum_allowances_amount:
        documentAllowanceAmount > 0 ? `${documentAllowanceAmount}` : undefined,
      total_without_vat: `${totalWithoutVat}`,
      total_vat_amount:
        totalVat > 0
          ? {
              value: `${totalVat}`,
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
