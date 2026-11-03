import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import Services from "#src/services/index";
import { PDFDocument } from "pdf-lib";
import { PDFExtract } from "pdf.js-extract";
import sharp from "sharp";
import Framework from "../../../../platform";
import { Context } from "../../../../types";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "../../e-invoices/entities/e-invoicing-config";
import {
  EN16931TotalsMismatchError,
  generateFacturXPdf,
  getEN16931InvoiceFromError,
} from "../../e-invoices/services/facturx-generator";
import { Files, FilesDefinition } from "../../files/entities/files";
import { download } from "../../files/services/files";
import { generateEmailMessageToRecipient } from "../../signing-sessions/services/utils";
import StockItems, {
  StockItemsDefinition,
} from "../../stock/entities/stock-items";
import Invoices from "../entities/invoices";
import { computePricesFromInvoice } from "@shared/invoices";
import { getPdf } from "./generate-pdf-components";
import { recordEmailSendResult } from "./email-send-result";
import { captureException } from "@sentry/node";

export type PositionPdf = {
  label: "SIGNATURE" | string;
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
  pageWidth?: number;
  pageHeight?: number;
};

// Documents with a Factur-X version (EN16931 only covers invoices and credit notes)
export const FACTURX_DOCUMENT_TYPES: Invoices["type"][] = [
  "invoices",
  "credit_notes",
  "supplier_invoices",
  "supplier_credit_notes",
];

export const generatePdf = async (
  ctx: Context,
  document: Invoices,
  options: {
    checkedIndexes: { [key: number]: boolean };
    content?: { _index: number; quantity: number }[];
    as?: "proforma" | "receipt_acknowledgement" | "delivery_slip";
    facturx?: boolean; // Factur-X required (throws if it can't be generated)
    skipFacturX?: boolean; // Plain PDF, without Factur-X data
  } = {
    checkedIndexes: {},
  }
): Promise<{
  positions: PositionPdf[];
  name: string;
  pdf: Buffer;
}> => {
  const db = await Framework.Db.getService();

  // Ability to override with custom content
  if (
    options?.as === "delivery_slip" ||
    options?.as === "receipt_acknowledgement"
  ) {
    document.content = options?.content?.length
      ? options?.content
          ?.map?.((val) => ({
            ...document.content[val._index],
            quantity: val.quantity,
          }))
          ?.filter(Boolean)
      : document.content?.filter((a) => a.optional_checked || !a.optional);
    document.total = computePricesFromInvoice(
      document,
      options?.checkedIndexes
    );
  }

  // Retrieve attachments
  const attachments = await db.select<Files>(ctx, FilesDefinition.name, {
    client_id: ctx.client_id,
    id:
      [...(document.attachments || []), ...(document.format.attachments || [])]
        ?.map((a) => (a || "").split(":").pop())
        ?.filter(Boolean) || [],
  });

  const relatedStockItems = await db.select<StockItems>(
    ctx,
    StockItemsDefinition.name,
    {
      client_id: ctx.client_id,
      ...(["quotes", "invoices", "credit_notes"].includes(document.type)
        ? {
            for_rel_quote:
              document.type === "quotes"
                ? document.id
                : document.from_rel_quote,
          }
        : {}),
      ...([
        "supplier_quotes",
        "supplier_invoices",
        "supplier_credit_notes",
      ].includes(document.type)
        ? {
            from_rel_supplier_quote:
              document.type === "supplier_quotes"
                ? document.id
                : document.from_rel_quote,
          }
        : {}),
    } as Partial<StockItems>,
    { limit: 1000 }
  );

  const { pdf: stream, name } = await getPdf(
    { ...ctx, client_id: document.client_id },
    document,
    options.checkedIndexes,
    attachments,
    ["invoices", "supplier_invoices"].includes(document.type) ||
      options?.as === "delivery_slip"
      ? relatedStockItems
          .map((a) => ({
            article: a.article,
            reference: a.serial_number,
            line: a.for_rel_quote_content_index,
          }))
          .filter((a) => a.article && a.reference)
      : [],
    options.as
  );
  const pdf = await stream2buffer(stream);

  const pdfExtract = new PDFExtract();
  const positions: PositionPdf[] = await new Promise((resolve, reject) => {
    try {
      pdfExtract.extractBuffer(pdf, {}, (err, data) => {
        let signatures: PositionPdf[] = [];
        let options: PositionPdf[] = [];
        for (const page of data.pages) {
          signatures = [
            ...signatures,
            ...page.content
              .filter((a) => a.str.includes("SIGNATURE_HERE"))
              .map((a) => ({
                label: a.str.replace(/_HERE/, ""),
                x: a.x,
                y: a.y,
                page: page.pageInfo.num,
                pageWidth: page.pageInfo.width,
                pageHeight: page.pageInfo.height,
                width: 300,
                height: 150,
              })),
          ];
          options = [
            ...options,
            ...page.content
              .filter((a) => a.str.includes("OPTION_"))
              .map((a) => ({
                label: a.str.replace(/_HERE/, ""),
                x: a.x,
                y: a.y,
                page: page.pageInfo.num,
                width: 30,
                height: 30,
              })),
          ];
        }
        resolve([signatures[0], ...options]);
      });
    } catch (e: any) {
      console.error(e);
      reject(e);
    }
  });

  const doc = await PDFDocument.load(pdf as any); //Get the pdf

  // Add attachments
  for (const attachment of attachments) {
    try {
      if (attachment.mime === "application/pdf") {
        // Add the pdf to the document
        const bytes = await download(
          { ...ctx, client_id: attachment.client_id, role: "SYSTEM" },
          attachment
        );
        const uint8Array = new Uint8Array(bytes);
        const pdf = await PDFDocument.load(uint8Array);
        const copiedPages = await doc.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => doc.addPage(page));
        continue;
      } else if (attachment.mime.indexOf("image/") === 0) {
        // Add the image to the document
        const bytes = await sharp(
          (await download(
            { ...ctx, client_id: attachment.client_id, role: "SYSTEM" },
            attachment
          )) as any
        )
          .toFormat("png")
          .toBuffer();
        const uint8Array = new Uint8Array(bytes);
        const image = await doc.embedPng(uint8Array);
        if (image) {
          const page = doc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
        continue;
      } else {
        // Says that the attachment is not supported
      }
    } catch (error: any) {
      console.error("Failed to add attachment to the document");
    }
  }

  let pdfWithAttachments = Buffer.from(await doc.save());

  // Factur-X: the EN16931 data is embedded in the PDF so that the software of
  // the customer (or of the accountant) reads the invoice without OCR. Every
  // company gets it, connected to the e-invoicing platform or not (the
  // conversion needs no account, see getFacturXClient). Not for drafts (not
  // final, they change all the time): SuperPDP converts the data once the
  // document is issued, then the XML is reused (see getFacturXXml).
  if (
    FACTURX_DOCUMENT_TYPES.includes(document.type) &&
    !options.skipFacturX &&
    (options.facturx || !["draft", "recurring"].includes(document.state))
  ) {
    const eInvoicingConfig = await db.selectOne<EInvoicingConfig>(
      { ...ctx, role: "SYSTEM" },
      EInvoicingConfigDefinition.name,
      {
        client_id: ctx.client_id,
      }
    );
    const connected = eInvoicingConfig?.connection_status === "connected";
    const isSale = !document.type.startsWith("supplier_");
    // Only the e-invoice transmission (options.facturx) requires the
    // Factur-X: a PDF sent by email (or downloaded) falls back to the plain
    // PDF, e.g. for a customer abroad or incomplete data. Blocking, when
    // enabled, is decided by the e-invoice transmission itself (see
    // on-sent-e-invoice).
    const requireFacturX = options.facturx === true;
    try {
      const superpdpClient = await Services.EInvoices.getFacturXClient(
        ctx,
        eInvoicingConfig
      );
      // Same totals as the ones printed on the PDF (see generate-pdf-components/total.tsx)
      const pdfTotals = computePricesFromInvoice(
        document,
        options.checkedIndexes
      );
      pdfWithAttachments = Buffer.from(
        await generateFacturXPdf(
          ctx,
          pdfWithAttachments, // The base PDF to embed invoice data into
          document,
          superpdpClient, // SuperPDP client for Factur-X conversion
          options.as, // Pass the "as" option to handle different invoice types
          pdfTotals,
          // The e-invoice transmission gets the Factur-X built by SuperPDP
          { remote: requireFacturX }
        )
      );
    } catch (e: any) {
      // Only the sales of companies using e-invoicing are reported: the
      // others (and the purchases) often miss data (SIREN, address...)
      // (a refusal already reported is cached, see getFacturXXml).
      if (requireFacturX || (connected && isSale && !e?.cached)) {
        const en16931Invoice = getEN16931InvoiceFromError(e);
        captureException(e, {
          tags: {
            module: "invoices",
            action: "generate_pdf",
            reason:
              e instanceof EN16931TotalsMismatchError
                ? "facturx_totals_mismatch"
                : "facturx_generation_failed",
            send_enabled: eInvoicingConfig?.send_enabled ? "true" : "false",
          },
          extra: {
            invoice_id: document.id,
            invoice_reference: document.reference,
            mismatches:
              e instanceof EN16931TotalsMismatchError
                ? e.mismatches
                : undefined,
            // Stringified: Sentry truncates objects deeper than 3 levels
            en16931_invoice: en16931Invoice
              ? JSON.stringify(en16931Invoice, null, 2)
              : undefined,
            invoice: JSON.stringify(document, null, 2),
          },
        });
      }
      if (requireFacturX) {
        throw e;
      }
      console.error(
        "Factur-X generation failed, falling back to the plain PDF",
        e?.message || e
      );
    }
  }

  return {
    positions,
    name,
    pdf: pdfWithAttachments,
  };
};

export const sendPdf = async (
  ctx: Context,
  document: Invoices,
  recipients: string[],
  options: {
    checkedIndexes?: { [key: number]: boolean };
    content?: { _index: number; quantity: number }[];
    as?: "proforma" | "receipt_acknowledgement" | "delivery_slip";
  }
) => {
  const db = await Framework.Db.getService();

  const { name, pdf } = await generatePdf(ctx, document, {
    checkedIndexes: options.checkedIndexes || {},
    as: options.as,
    content: options.content as {
      _index: number;
      quantity: number;
    }[],
  });

  const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
    id: ctx.client_id,
  });

  // send emails
  const sentEmails: string[] = [];
  const failedEmails: string[] = [];
  for (const recipient of recipients) {
    const { message, subject, htmlLogo } =
      await generateEmailMessageToRecipient(
        ctx,
        "sent",
        document,
        { email: recipient, role: "viewer" },
        {
          as: options.as,
        }
      );
    const sent = await Framework.PushEMail.push(
      ctx,
      recipient,
      message,
      {
        from: client?.company?.name || client?.company?.legal_name,
        subject: subject,
        attachments: [{ filename: name, content: pdf }],
        logo: htmlLogo,
      },
      client.smtp
    );

    if (sent) {
      sentEmails.push(recipient);
    } else {
      failedEmails.push(recipient);
    }
  }

  // Record the outcome (timeline event + notification + document flag) so a
  // failed send does not go unnoticed.
  await recordEmailSendResult(ctx, document, sentEmails, failedEmails);
};

function stream2buffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const _buf = [];

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(err));
  });
}
