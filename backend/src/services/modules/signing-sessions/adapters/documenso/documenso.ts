import config from "config";
import { AddFieldProps, DocumentSignerInterface } from "../../interface";
import {
  CreateDocumentToSign,
  DocumentSignerEntity,
  DocumentToSignResponse,
} from "../../types";
import { DocumensoDocument, DocumensoDocumentResponse } from "./types";

export default class DocumensoAdapter implements DocumentSignerInterface {
  async init() {
    return this;
  }

  async getAllSigningSessions(
    page = "1",
    perPage = "100"
  ): Promise<DocumentToSignResponse[]> {
    const documensoResponse = await fetch(
      `https://app.documenso.com/api/v1/documents?page=${page}&perPage=${perPage}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: config.get("signature.documenso.key"),
        },
      }
    );

    return documensoResponse.json();
  }

  async getSigningSession(id: string): Promise<DocumentSignerEntity> {
    const documensoResponse = await fetch(
      `https://app.documenso.com/api/v1/documents/${id.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: config.get("signature.documenso.key"),
        },
      }
    );

    return documensoResponse.json();
  }

  async addDocumentToSign(
    documentToSign: CreateDocumentToSign
  ): Promise<DocumentToSignResponse> {
    const documensoDocument: DocumensoDocument = {
      title: documentToSign.title ?? "document.pdf",
      externalId: documentToSign.signingSessionId,
      recipients: documentToSign.recipients.map((recipient) => ({
        name: recipient.name,
        email: recipient.email.trim(),
        role: "SIGNER",
      })),
      meta: {
        subject: "Un document à signer vous attend.",
        message: "Retrouvez ce document ci-dessous.",
        timezone: "Etc/UTC",
        redirectUrl: config
          .get<string>("signature.webhook.signed")
          .replace(":signing-session", documentToSign.signingSessionId),
      },
      formValues: {},
    };

    const documensoResponse = await fetch(
      "https://app.documenso.com/api/v1/documents",
      {
        method: "POST",
        body: JSON.stringify(documensoDocument),
        headers: {
          "Content-Type": "application/json",
          Authorization: config.get("signature.documenso.key"),
        },
      }
    );

    const documensoResponseData =
      (await documensoResponse.json()) as DocumensoDocumentResponse;

    if (!documensoResponse.ok) {
      console.log(documensoDocument);
      console.log(documensoResponse.status);
      console.log(JSON.stringify(documensoResponseData));
      throw new Error("Error creating document in Documenso");
    }

    return {
      id: documensoResponseData.documentId.toString(),
      signingSessionId: documentToSign.signingSessionId,
      title: documensoDocument.title,
      reference: documensoDocument.externalId,
      message: documensoDocument.meta.message,
      redirectUrl: documensoDocument.meta.message,
      subject: documensoDocument?.meta?.subject,
      recipients: documensoResponseData.recipients,
      signingUrl: documensoResponseData.recipients[0].signingUrl,
      uploadUrl: documensoResponseData?.uploadUrl,
    };
  }

  async sendToSign({ documentID, sendEmail }) {
    console.log("[DocumensoAdapter] sendToSign", documentID, sendEmail);
    return await fetch(
      `https://app.documenso.com/api/v1/documents/${documentID}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip, deflate, br",
          Authorization: config.get("signature.documenso.key"),
        },
        body: JSON.stringify({
          sendEmail: sendEmail ?? false,
          sendCompletionEmails: sendEmail ?? false,
        }),
      }
    );
  }

  async addField({ document, position }: AddFieldProps) {
    console.log("position", position);

    await fetch(
      `https://app.documenso.com/api/v1/documents/${document.id}/fields`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip, deflate, br",
          Authorization: config.get("signature.documenso.key"),
        },
        body: JSON.stringify({
          recipientId: document.recipients[0].id,
          type: "SIGNATURE",
          pageNumber: position.page,
          // Documenso uses percentage for x and y
          pageX: Math.floor((position.x / position.pageWidth) * 100) - 1,
          pageY: Math.floor((position.y / position.pageHeight) * 100) - 1,
          // Documenso uses percentage for width and height
          pageWidth:
            Math.floor((position.width / position.pageWidth) * 100) - 1,
          pageHeight:
            Math.floor((position.height / position.pageHeight) * 100) - 1,
        }),
      }
    );
  }

  async downloadSignedDocument(documentID: string): Promise<Buffer> {
    const documensoResponse = await fetch(
      `https://app.documenso.com/api/v1/documents/${documentID}/download`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: config.get("signature.documenso.key"),
        },
      }
    );

    const response = (await documensoResponse.json()) as {
      downloadUrl: string;
      message: string;
    };

    if (documensoResponse.status === 400) {
      return null;
    }

    if (response.downloadUrl === undefined) {
      throw new Error("Cannot get download URL from Documenso");
    }

    const downloadedBufferResponse = await fetch(response.downloadUrl, {
      method: "GET",
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    const blob = await downloadedBufferResponse.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer;
  }
}
