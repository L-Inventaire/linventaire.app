import { Context } from "#src/types";
import { generate } from "@stafyniaksacha/facturx";
import {
  AmountType,
  CountryIDType,
  CrossIndustryInvoiceType,
  CurrencyCodeType,
  DateTimeType,
  DocumentCodeType,
  DocumentContextParameterType,
  ExchangedDocumentContextType,
  ExchangedDocumentType,
  HeaderTradeAgreementType,
  HeaderTradeDeliveryType,
  HeaderTradeSettlementType,
  IDType,
  SupplyChainTradeTransactionType,
  TaxCategoryCodeType,
  TaxTypeCodeType,
  TextType,
  TradeAddressType,
  TradeContactType,
  TradePartyType,
  TradeSettlementHeaderMonetarySummationType,
  TradeTaxType,
  SupplyChainTradeLineItemType,
  LineTradeAgreementType,
  LineTradeDeliveryType,
  LineTradeSettlementType,
  QuantityType,
  TradePriceType,
} from "@stafyniaksacha/facturx/models";
import Clients from "../../clients/entities/clients";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import Invoices from "../../invoices/entities/invoices";
import { EN16931Invoice } from "../../../../platform/e-invoices/adapters/superpdp/en16931-types";
import { convertInternalToEN16931, ResolvedEntities } from "./invoice-converter";

/**
 * Entities required to generate a Factur-X PDF
 */
export interface FacturXEntities {
  invoice: Invoices;
  company: Clients; // The company issuing or receiving the invoice
  contact: Contacts; // The buyer or supplier contact
  articles: Map<string, Articles>; // Map of article ID to article entity
}

/**
 * Convert EN16931 invoice to Factur-X Cross Industry Invoice model
 */
function convertEN16931ToFacturX(
  en16931: EN16931Invoice,
  level: "minimum" | "basicwl" | "basic" | "en16931" = "en16931"
): CrossIndustryInvoiceType {
  // Document context (specifies the Factur-X version and level)
  const guidelineID = new IDType({
    value: `urn:factur-x.eu:1p0:${level}`,
  });
  const guidelineParameter = new DocumentContextParameterType({
    id: guidelineID,
  });
  const documentContext = new ExchangedDocumentContextType({
    guidelineSpecifiedDocumentContextParameter: guidelineParameter,
  });

  // Document metadata
  const invoiceID = new IDType({ value: en16931.invoice_number });
  const typeCode = new DocumentCodeType({ value: en16931.type_code.toString() });
  const issueDateTime = new DateTimeType({
    dateTimeString: en16931.issue_date.replace(/-/g, ""),
    format: "102", // YYYYMMDD format
  });

  const document = new ExchangedDocumentType({
    id: invoiceID,
    typeCode,
    issueDateTime,
    includedNote: en16931.invoice_note?.map(
      (note) => new TextType({ value: note.note })
    ),
  });

  // Seller party
  const sellerName = new TextType({ value: en16931.seller.name });
  const sellerAddress = new TradeAddressType({
    lineOne: new TextType({
      value: en16931.seller.postal_address.street_name || "",
    }),
    lineTwo: en16931.seller.postal_address.additional_street_name
      ? new TextType({ value: en16931.seller.postal_address.additional_street_name })
      : undefined,
    cityName: new TextType({
      value: en16931.seller.postal_address.city_name || "",
    }),
    postCodeCode: new TextType({
      value: en16931.seller.postal_address.postal_zone || "",
    }),
    countryID: new CountryIDType({
      value: en16931.seller.postal_address.country || "FR",
    }),
  });

  const sellerContact = en16931.seller.contact
    ? new TradeContactType({
        personName: en16931.seller.contact.name
          ? new TextType({ value: en16931.seller.contact.name })
          : undefined,
        telephoneUniversalCommunication: en16931.seller.contact.telephone
          ? { completeNumber: new TextType({ value: en16931.seller.contact.telephone }) }
          : undefined,
        emailURIUniversalCommunication: en16931.seller.contact.email
          ? { uriid: new IDType({ value: en16931.seller.contact.email }) }
          : undefined,
      })
    : undefined;

  const sellerParty = new TradePartyType({
    name: sellerName,
    postalTradeAddress: sellerAddress,
    definedTradeContact: sellerContact,
    specifiedTaxRegistration: en16931.seller.vat
      ? [
          {
            id: new IDType({
              value: en16931.seller.vat,
              schemeID: "VA",
            }),
          },
        ]
      : undefined,
  });

  // Buyer party
  const buyerName = new TextType({ value: en16931.buyer.name });
  const buyerAddress = new TradeAddressType({
    lineOne: new TextType({
      value: en16931.buyer.postal_address.street_name || "",
    }),
    lineTwo: en16931.buyer.postal_address.additional_street_name
      ? new TextType({ value: en16931.buyer.postal_address.additional_street_name })
      : undefined,
    cityName: new TextType({
      value: en16931.buyer.postal_address.city_name || "",
    }),
    postCodeCode: new TextType({
      value: en16931.buyer.postal_address.postal_zone || "",
    }),
    countryID: new CountryIDType({
      value: en16931.buyer.postal_address.country || "FR",
    }),
  });

  const buyerContact = en16931.buyer.contact
    ? new TradeContactType({
        personName: en16931.buyer.contact.name
          ? new TextType({ value: en16931.buyer.contact.name })
          : undefined,
        telephoneUniversalCommunication: en16931.buyer.contact.telephone
          ? { completeNumber: new TextType({ value: en16931.buyer.contact.telephone }) }
          : undefined,
        emailURIUniversalCommunication: en16931.buyer.contact.email
          ? { uriid: new IDType({ value: en16931.buyer.contact.email }) }
          : undefined,
      })
    : undefined;

  const buyerParty = new TradePartyType({
    name: buyerName,
    postalTradeAddress: buyerAddress,
    definedTradeContact: buyerContact,
    specifiedTaxRegistration: en16931.buyer.vat
      ? [
          {
            id: new IDType({
              value: en16931.buyer.vat,
              schemeID: "VA",
            }),
          },
        ]
      : undefined,
  });

  // Trade agreement
  const tradeAgreement = new HeaderTradeAgreementType({
    sellerTradeParty: sellerParty,
    buyerTradeParty: buyerParty,
    buyerReference: en16931.buyer_reference
      ? new TextType({ value: en16931.buyer_reference })
      : undefined,
  });

  // Trade delivery
  const tradeDelivery = new HeaderTradeDeliveryType({
    // Delivery information can be added here if needed
  });

  // VAT breakdown
  const applicableTradeTax = en16931.vat_break_down.map((vat) => {
    return new TradeTaxType({
      calculatedAmount: new AmountType({
        value: vat.tax_amount,
        currencyID: en16931.currency_code,
      }),
      typeCode: new TaxTypeCodeType({ value: "VAT" }),
      basisAmount: new AmountType({
        value: vat.taxable_amount,
        currencyID: en16931.currency_code,
      }),
      categoryCode: new TaxCategoryCodeType({ value: vat.vat_category_code }),
      rateApplicablePercent: vat.vat_category_rate
        ? { value: vat.vat_category_rate }
        : undefined,
    });
  });

  // Monetary summation
  const summation = new TradeSettlementHeaderMonetarySummationType({
    lineTotalAmount: new AmountType({
      value: en16931.totals.sum_of_invoice_line_net_amounts,
      currencyID: en16931.currency_code,
    }),
    taxBasisTotalAmount: [
      new AmountType({
        value: en16931.totals.invoice_total_amount_without_vat,
        currencyID: en16931.currency_code,
      }),
    ],
    taxTotalAmount: [
      new AmountType({
        value: en16931.totals.invoice_total_vat_amount || 0,
        currencyID: en16931.currency_code,
      }),
    ],
    grandTotalAmount: [
      new AmountType({
        value: en16931.totals.invoice_total_amount_with_vat,
        currencyID: en16931.currency_code,
      }),
    ],
    duePayableAmount: new AmountType({
      value: en16931.totals.amount_due_for_payment || en16931.totals.invoice_total_amount_with_vat,
      currencyID: en16931.currency_code,
    }),
  });

  // Payment details
  const paymentMeans = en16931.payment_details
    ? [
        {
          typeCode: new TextType({
            value: en16931.payment_details.payment_means_type_code,
          }),
          payeePartyCreditorFinancialAccount: en16931.payment_details.credit_transfer?.[0]
            ? {
                ibanID: new IDType({
                  value: en16931.payment_details.credit_transfer[0].payment_account_identifier.value,
                }),
              }
            : undefined,
        },
      ]
    : undefined;

  // Trade settlement
  const tradeSettlement = new HeaderTradeSettlementType({
    invoiceCurrencyCode: new CurrencyCodeType({
      value: en16931.currency_code,
    }),
    applicableTradeTax,
    specifiedTradePaymentTerms: en16931.payment_details?.payment_terms
      ? [{ description: new TextType({ value: en16931.payment_details.payment_terms }) }]
      : undefined,
    specifiedTradeSettlementHeaderMonetarySummation: summation,
    specifiedTradeSettlementPaymentMeans: paymentMeans,
  });

  // Invoice lines (only for higher levels than minimum)
  let includedSupplyChainTradeLineItem: SupplyChainTradeLineItemType[] | undefined;

  if (level !== "minimum" && en16931.lines) {
    includedSupplyChainTradeLineItem = en16931.lines.map((line, index) => {
      const lineAgreement = new LineTradeAgreementType({
        netPriceProductTradePrice: new TradePriceType({
          chargeAmount: new AmountType({
            value: line.price_details.item_net_price,
            currencyID: en16931.currency_code,
          }),
        }),
      });

      const lineDelivery = new LineTradeDeliveryType({
        billedQuantity: new QuantityType({
          value: line.invoiced_quantity,
          unitCode: line.invoiced_quantity_unit_code,
        }),
      });

      const lineSettlement = new LineTradeSettlementType({
        applicableTradeTax: [
          new TradeTaxType({
            typeCode: new TaxTypeCodeType({ value: "VAT" }),
            categoryCode: new TaxCategoryCodeType({
              value: line.line_vat_information.invoiced_item_vat_category_code,
            }),
            rateApplicablePercent: line.line_vat_information.invoiced_item_vat_rate
              ? { value: line.line_vat_information.invoiced_item_vat_rate }
              : undefined,
          }),
        ],
        specifiedTradeSettlementLineMonetarySummation: {
          lineTotalAmount: new AmountType({
            value: line.line_net_amount,
            currencyID: en16931.currency_code,
          }),
        },
      });

      return new SupplyChainTradeLineItemType({
        associatedDocumentLineDocument: {
          lineID: new IDType({ value: line.line_number }),
        },
        specifiedTradeProduct: {
          name: new TextType({ value: line.item_information.name }),
          description: line.item_information.description
            ? new TextType({ value: line.item_information.description })
            : undefined,
          sellerAssignedID: line.item_information.sellers_item_identification
            ? new IDType({ value: line.item_information.sellers_item_identification })
            : undefined,
          buyerAssignedID: line.item_information.buyers_item_identification
            ? new IDType({ value: line.item_information.buyers_item_identification })
            : undefined,
        },
        specifiedLineTradeAgreement: lineAgreement,
        specifiedLineTradeDelivery: lineDelivery,
        specifiedLineTradeSettlement: lineSettlement,
      });
    });
  }

  // Build the transaction
  const transaction = new SupplyChainTradeTransactionType({
    applicableHeaderTradeAgreement: tradeAgreement,
    applicableHeaderTradeDelivery: tradeDelivery,
    applicableHeaderTradeSettlement: tradeSettlement,
    includedSupplyChainTradeLineItem,
  });

  // Build the final invoice
  const invoice = new CrossIndustryInvoiceType({
    exchangedDocumentContext: documentContext,
    exchangedDocument: document,
    supplyChainTradeTransaction: transaction,
  });

  return invoice;
}

/**
 * Generate a Factur-X PDF from a PDF buffer and invoice data
 *
 * @param ctx - Context for client_id
 * @param pdfBuffer - The original PDF buffer (e.g., from generate-pdf.tsx)
 * @param entities - The invoice and related entities
 * @param options - Generation options
 * @returns The Factur-X PDF buffer
 */
export async function generateFacturXPdf(
  ctx: Context,
  pdfBuffer: Buffer,
  entities: FacturXEntities,
  options: {
    level?: "minimum" | "basicwl" | "basic" | "en16931";
    check?: boolean; // Validate the XML before embedding
    language?: string;
  } = {}
): Promise<Buffer> {
  const { invoice, company, contact, articles } = entities;
  const level = options.level || "en16931";

  // Prepare resolved entities for conversion
  const resolvedEntities: ResolvedEntities = {
    supplier: invoice.type.startsWith("supplier_") ? contact : undefined,
    client: !invoice.type.startsWith("supplier_") ? contact : undefined,
    articles,
  };

  // Convert internal invoice to EN16931 format
  const en16931Invoice = convertInternalToEN16931(invoice, resolvedEntities);

  // Convert EN16931 to Factur-X Cross Industry Invoice model
  const facturxInvoice = convertEN16931ToFacturX(en16931Invoice, level);

  // Convert the model to XML
  const { invoiceToXml } = await import("@stafyniaksacha/facturx");
  const xml = await invoiceToXml(facturxInvoice);
  const xmlBuffer = Buffer.from(xml.toString());

  // Generate the Factur-X PDF
  const facturxPdfBuffer = await generate({
    pdf: pdfBuffer,
    xml: xmlBuffer,
    check: options.check !== false,
    flavor: "facturx",
    level,
    language: options.language || "en-GB",
    meta: {
      author: company.company?.name || company.company?.legal_name || "Company",
      title: `${invoice.type === "credit_notes" || invoice.type === "supplier_credit_notes" ? "Credit Note" : "Invoice"} ${invoice.reference || invoice.name}`,
      subject: `${invoice.type === "credit_notes" || invoice.type === "supplier_credit_notes" ? "Credit Note" : "Invoice"} ${invoice.reference || invoice.name}`,
      keywords: [
        "invoice",
        "facturx",
        invoice.type,
        invoice.reference || invoice.name,
      ],
      date: invoice.emit_date,
    },
  });

  return Buffer.from(facturxPdfBuffer);
}

/**
 * Extract Factur-X XML from a Factur-X PDF
 *
 * @param pdfBuffer - The Factur-X PDF buffer
 * @returns The extracted XML and metadata
 */
export async function extractFacturXXml(pdfBuffer: Buffer): Promise<{
  xml: string;
  filename: string;
  flavor: string;
  level: string;
}> {
  const { extract } = await import("@stafyniaksacha/facturx");

  const result = await extract({
    pdf: pdfBuffer,
    check: true,
  });

  return {
    xml: result.xml.toString(),
    filename: result.filename,
    flavor: result.flavor,
    level: result.level,
  };
}

/**
 * Validate a Factur-X XML file
 *
 * @param xml - The XML string or buffer to validate
 * @returns Validation result with errors if any
 */
export async function validateFacturXXml(
  xml: string | Buffer
): Promise<{
  valid: boolean;
  errors: string[];
  flavor?: string;
  level?: string;
}> {
  const { check } = await import("@stafyniaksacha/facturx");

  const result = await check({
    xml: typeof xml === "string" ? xml : xml.toString(),
  });

  return {
    valid: result.valid,
    errors: result.errors || [],
    flavor: result.flavor,
    level: result.level,
  };
}
