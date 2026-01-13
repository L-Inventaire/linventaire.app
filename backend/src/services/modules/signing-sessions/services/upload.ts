import Invoices, { InvoiceLine } from "../../invoices/entities/invoices";
import { generatePdf } from "../../invoices/services/generate-pdf";
import { SigningSessions } from "../entities/signing-session";
import Services from "#src/services/index";
import InternalAdapter from "../adapters/internal/internal";

export const uploadDocumentToSigningSession = async (
  ctx,
  signingSession: SigningSessions,
  options?: InvoiceLine[]
) => {
  const { pdf } = await generatePdf(
    ctx,
    signingSession.invoice_snapshot as unknown as Invoices,
    {
      checkedIndexes: options
        ? Object.fromEntries(
            options.map((o, index) => [index.toString(), o.optional_checked])
          )
        : undefined,
    }
  );

  if (!signingSession.upload_url) {
    throw new Error("Upload URL is required");
  }

  // Check if using internal adapter
  if (Services.SignatureSessions.documentSigner instanceof InternalAdapter) {
    // Use internal upload method
    await Services.SignatureSessions.documentSigner.uploadDocument(
      signingSession.external_id,
      pdf
    );
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const https = require("follow-redirects").https;

  const requestOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length,
    },
    maxRedirects: 20,
  };

  const req = https.request(
    signingSession.upload_url,
    requestOptions,
    function (res) {
      res.on("error", function (error) {
        console.error(error);
      });
    }
  );

  const postData = pdf;
  req.write(postData);
  req.end();
};
