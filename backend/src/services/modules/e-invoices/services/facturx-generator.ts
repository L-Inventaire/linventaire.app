import { Context } from "#src/types";
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
 * Generate a Factur-X PDF from a base PDF and invoice data using SuperPDP API
 *
 * @param ctx - Context for client_id
 * @param pdfBuffer - The base PDF file to embed the invoice data into
 * @param entities - The invoice and related entities
 * @param options - Generation options
 * @returns The Factur-X PDF buffer
 */
export async function generateFacturXPdf(
  ctx: Context,
  pdfBuffer: Buffer,
  invoice: Invoices,
  superpdpClient: SuperPDPClient
): Promise<Buffer> {
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
  const en16931Invoice = convertInternalToEN16931(invoice, resolvedEntities);

  console.log("EN16931 Invoice data:", JSON.stringify(en16931Invoice, null, 2));

  // Use SuperPDP API to embed EN16931 data into the PDF (creates Factur-X)
  console.log("Converting to Factur-X using SuperPDP API...");
  const facturxPdfBuffer = await superpdpClient.convertToFacturX(
    pdfBuffer,
    en16931Invoice
  );

  console.log("Successfully converted to Factur-X PDF");
  return facturxPdfBuffer;
}
