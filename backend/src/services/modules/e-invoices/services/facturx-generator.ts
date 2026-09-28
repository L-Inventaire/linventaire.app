import { Context } from "#src/types";
import { computePricesFromInvoice } from "@shared/invoices";
import { EN16931Invoice } from "@shared/en16931-types";
import { SuperPDPClient } from "../../../../platform/e-invoices/adapters/superpdp/client";
import Clients from "../../../clients/entities/clients";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import Invoices from "../../invoices/entities/invoices";
import {
  convertInternalToEN16931,
  getResolvedEntities,
  ResolvedEntities,
} from "./invoice-converter";

/**
 * Entities required to generate a Factur-X PDF
 */
export interface FacturXEntities {
  invoice: Invoices;
  self: Clients; // The company issuing or receiving the invoice
  contact: Contacts; // The buyer or supplier contact
  articles: Map<string, Articles>; // Map of article ID to article entity
  superpdpClient: SuperPDPClient; // SuperPDP client for conversion
}

/**
 * Thrown when the amounts of the EN16931 data do not match the amounts
 * printed on the PDF. Such an e-invoice must never be sent.
 */
export class EN16931TotalsMismatchError extends Error {
  constructor(
    public readonly mismatches: {
      field: "total_without_vat" | "total_vat_amount" | "total_with_vat";
      pdf: number;
      en16931: number;
    }[]
  ) {
    super(
      `EN16931 totals do not match the PDF totals: ${mismatches
        .map((m) => `${m.field} (pdf=${m.pdf}, en16931=${m.en16931})`)
        .join(", ")}`
    );
    this.name = "EN16931TotalsMismatchError";
  }
}

// Amounts are compared at the cent level
const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.005;

/**
 * Make sure the totals (HT, TVA, TTC) sent in the EN16931 data are the same
 * as the ones printed on the PDF.
 *
 * @param en16931Invoice - The EN16931 data that would be sent
 * @param pdfTotals - The totals printed on the PDF
 * @throws EN16931TotalsMismatchError if any total differs
 */
export function assertEN16931TotalsMatchPdf(
  en16931Invoice: EN16931Invoice,
  pdfTotals: Invoices["total"]
) {
  const en16931Totals = {
    total_without_vat: parseFloat(en16931Invoice.totals?.total_without_vat),
    total_vat_amount: parseFloat(
      en16931Invoice.totals?.total_vat_amount?.value || "0"
    ),
    total_with_vat: parseFloat(en16931Invoice.totals?.total_with_vat),
  };
  const pdf = {
    total_without_vat: pdfTotals?.total || 0,
    total_vat_amount: pdfTotals?.taxes || 0,
    total_with_vat: pdfTotals?.total_with_taxes || 0,
  };

  const mismatches = (Object.keys(pdf) as (keyof typeof pdf)[])
    .filter((field) => !sameAmount(pdf[field], en16931Totals[field]))
    .map((field) => ({
      field,
      pdf: pdf[field],
      en16931: en16931Totals[field],
    }));

  if (mismatches.length) {
    throw new EN16931TotalsMismatchError(mismatches);
  }
}

/**
 * Generate a Factur-X PDF from a base PDF and invoice data using SuperPDP API
 *
 * @param ctx - Context for client_id
 * @param pdfBuffer - The base PDF file to embed the invoice data into
 * @param entities - The invoice and related entities
 * @param options - Generation options
 * @param pdfTotals - The totals printed on the PDF, checked against the EN16931 data
 * @returns The Factur-X PDF buffer
 */
export async function generateFacturXPdf(
  ctx: Context,
  pdfBuffer: Buffer,
  invoice: Invoices,
  superpdpClient: SuperPDPClient,
  as?: "proforma" | "receipt_acknowledgement" | "delivery_slip",
  pdfTotals: Invoices["total"] = computePricesFromInvoice(invoice)
): Promise<Buffer> {
  if (as === "receipt_acknowledgement" || as === "delivery_slip") {
    return pdfBuffer; // For now, just return the original PDF for unsupported types
  }

  const { self, client, supplier, articles } = await getResolvedEntities(
    ctx,
    invoice
  );

  // Prepare resolved entities for conversion
  const resolvedEntities: ResolvedEntities = {
    supplier: invoice.type.startsWith("supplier_") ? supplier : undefined,
    client: !invoice.type.startsWith("supplier_") ? client : undefined,
    articles,
    self,
  };

  // Convert internal invoice to EN16931 format
  const en16931Invoice = convertInternalToEN16931(
    invoice,
    resolvedEntities,
    as
  );

  console.log("EN16931 Invoice data:", JSON.stringify(en16931Invoice, null, 2));

  // Never produce an e-invoice whose amounts differ from the PDF
  assertEN16931TotalsMatchPdf(en16931Invoice, pdfTotals);

  // Use SuperPDP API to embed EN16931 data into the PDF (creates Factur-X)
  console.log("Converting to Factur-X using SuperPDP API...");
  const facturxPdfBuffer = await superpdpClient.convertToFacturX(
    pdfBuffer,
    en16931Invoice
  );

  console.log("Successfully converted to Factur-X PDF");
  return facturxPdfBuffer;
}
