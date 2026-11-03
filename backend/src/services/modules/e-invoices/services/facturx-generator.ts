import Framework from "#src/platform/index";
import { Context } from "#src/types";
import crypto from "crypto";
import { AFRelationship, PDFDocument, PDFHeader, PDFName } from "pdf-lib";
import { computePricesFromInvoice } from "@shared/invoices";
import { EN16931Invoice } from "@shared/en16931-types";
import { SuperPDPClient } from "../../../../platform/e-invoices/adapters/superpdp/client";
import Clients from "../../../clients/entities/clients";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import Invoices from "../../invoices/entities/invoices";
import FacturXXmlCache, {
  FacturXXmlCacheDefinition,
} from "../entities/facturx-xml-cache";
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
 * Factur-X metadata (XMP) of the PDF: declares the PDF/A-3 conformance and the
 * embedded factur-x.xml, as SuperPDP does.
 */
const getFacturXXmp =
  () => `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
${["DocumentFileName", "DocumentType", "Version", "ConformanceLevel"]
  .map(
    (name) => `                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>${name}</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>${name}</pdfaProperty:description>
                </rdf:li>`
  )
  .join("\n")}
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

/**
 * Embed the CII XML in a PDF (Factur-X): factur-x.xml attachment (associated
 * file, /AFRelationship /Data) and Factur-X metadata. Same result as the
 * SuperPDP conversion, without calling it.
 *
 * @param pdfBuffer - The base PDF file
 * @param xml - The CII XML
 * @returns The Factur-X PDF buffer
 */
export async function embedFacturXXml(
  pdfBuffer: Buffer,
  xml: Buffer | string
): Promise<Buffer> {
  const doc = await PDFDocument.load(new Uint8Array(pdfBuffer));
  const now = new Date();
  await doc.attach(new Uint8Array(Buffer.from(xml)), "factur-x.xml", {
    mimeType: "text/xml",
    description: "Factur-X",
    creationDate: now,
    modificationDate: now,
    afRelationship: AFRelationship.Data,
  });
  const metadata = doc.context.stream(Buffer.from(getFacturXXmp(), "utf-8"), {
    Type: "Metadata",
    Subtype: "XML",
  });
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(metadata));
  doc.context.header = PDFHeader.forVersion(1, 7); // PDF/A-3 is based on PDF 1.7
  return Buffer.from(await doc.save());
}

const sha256 = (data: string) =>
  crypto.createHash("sha256").update(data).digest("hex");

/**
 * CII XML of the EN16931 data of a document: converted by SuperPDP the first
 * time, then reused from facturx_xml_cache while the data does not change, so
 * that generating the PDF again (view, download, emails) never calls SuperPDP.
 */
export async function getFacturXXml(
  ctx: Context,
  invoice: Pick<Invoices, "id" | "client_id">,
  en16931Invoice: EN16931Invoice,
  superpdpClient: SuperPDPClient
): Promise<string> {
  const db = await Framework.Db.getService();
  // Out of the transaction of the caller (cache only, never rolled back)
  const cacheCtx: Context = {
    ...ctx,
    role: "SYSTEM",
    client_id: invoice.client_id,
    db_tnx: undefined,
  };
  const key = {
    client_id: invoice.client_id,
    invoice_id: invoice.id,
    hash: sha256(JSON.stringify(en16931Invoice)),
  };

  const cached = await db.selectOne<FacturXXmlCache>(
    cacheCtx,
    FacturXXmlCacheDefinition.name,
    key
  );
  if (cached?.xml) return cached.xml;
  if (cached?.error) {
    throw Object.assign(new Error(cached.error), { cached: true });
  }

  const save = async (row: Pick<FacturXXmlCache, "xml" | "error">) => {
    try {
      await db.insert<FacturXXmlCache>(
        cacheCtx,
        FacturXXmlCacheDefinition.name,
        { ...key, ...row, created_at: Date.now() }
      );
    } catch (e) {
      // Already inserted by a concurrent generation
    }
  };

  let xml: string;
  try {
    xml = (await superpdpClient.convertToCII(en16931Invoice)).toString("utf-8");
  } catch (e: any) {
    // Refused (invalid data): same answer until the data changes. Temporary
    // failures (network, 5xx) are retried next time.
    if (e?.status === 400) await save({ xml: "", error: e.message });
    throw e;
  }
  await save({ xml, error: null });
  return xml;
}

/**
 * Generate a Factur-X PDF from a base PDF and invoice data
 *
 * By default the CII XML comes from the cache (SuperPDP is only called when
 * the data of the document changed) and is embedded locally. With `remote`
 * (e-invoice transmission), SuperPDP builds the whole Factur-X PDF.
 *
 * @param ctx - Context for client_id
 * @param pdfBuffer - The base PDF file to embed the invoice data into
 * @param invoice - The invoice
 * @param superpdpClient - SuperPDP client for the conversion
 * @param as - Generation options
 * @param pdfTotals - The totals printed on the PDF, checked against the EN16931 data
 * @returns The Factur-X PDF buffer
 */
export async function generateFacturXPdf(
  ctx: Context,
  pdfBuffer: Buffer,
  invoice: Invoices,
  superpdpClient: SuperPDPClient,
  as?: "proforma" | "receipt_acknowledgement" | "delivery_slip",
  pdfTotals: Invoices["total"] = computePricesFromInvoice(invoice),
  options: { remote?: boolean } = {}
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

  try {
    // Never produce an e-invoice whose amounts differ from the PDF
    assertEN16931TotalsMatchPdf(en16931Invoice, pdfTotals);

    if (options.remote) {
      return await superpdpClient.convertToFacturX(pdfBuffer, en16931Invoice);
    }

    return await embedFacturXXml(
      pdfBuffer,
      await getFacturXXml(ctx, invoice, en16931Invoice, superpdpClient)
    );
  } catch (e: any) {
    // Keep the EN16931 data with the error so it can be reported (Sentry)
    if (e && typeof e === "object") {
      e.en16931Invoice = en16931Invoice;
    }
    throw e;
  }
}

/**
 * Get the EN16931 data attached to an error thrown by generateFacturXPdf, if any
 */
export function getEN16931InvoiceFromError(
  e: unknown
): EN16931Invoice | undefined {
  return (e as { en16931Invoice?: EN16931Invoice } | undefined)?.en16931Invoice;
}
