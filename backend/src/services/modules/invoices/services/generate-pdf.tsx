import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import { PDFDocument } from "pdf-lib";
import { PDFExtract } from "pdf.js-extract";
import sharp from "sharp";
import Framework from "../../../../platform";
import { Context } from "../../../../types";
import { Files, FilesDefinition } from "../../files/entities/files";
import { download } from "../../files/services/files";
import { generateEmailMessageToRecipient } from "../../signing-sessions/services/utils";
import StockItems, {
  StockItemsDefinition,
} from "../../stock/entities/stock-items";
import Invoices from "../entities/invoices";
import { computePricesFromInvoice } from "../utils";
import { getPdf } from "./generate-pdf-components";

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

export const generatePdf = async (
  ctx: Context,
  document: Invoices,
  options: {
    checkedIndexes: { [key: number]: boolean };
    content?: { _index: number; quantity: number }[];
    as?: "proforma" | "receipt_acknowledgement" | "delivery_slip";
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
    } catch (e) {
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
    } catch (error) {
      console.error("Failed to add attachment to the document");
    }
  }

  return {
    positions,
    name,
    pdf: Buffer.from(await doc.save()),
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
    await Framework.PushEMail.push(
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
  }
};

function stream2buffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const _buf = [];

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(err));
  });
}
