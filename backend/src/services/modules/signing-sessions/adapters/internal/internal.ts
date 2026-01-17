import { id } from "#src/platform/db/utils";
import Framework from "#src/platform/index";
import { Context } from "#src/types";
import config from "config";
import crypto from "crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  ESignSessions,
  ESignSessionsDefinition,
} from "../../entities/e-sign-session";
import { AddFieldProps, DocumentSignerInterface } from "../../interface";
import {
  CreateDocumentToSign,
  DocumentSignerEntity,
  DocumentToSignResponse,
} from "../../types";

export default class InternalAdapter implements DocumentSignerInterface {
  async init() {
    // Initialize the e_sign_sessions table
    const db = await Framework.Db.getService();
    await db.createTable(ESignSessionsDefinition);
    return this;
  }

  async getAllSigningSessions(
    page = "1",
    perPage = "100"
  ): Promise<DocumentToSignResponse[]> {
    const db = await Framework.Db.getService();
    const sessions = await db.select<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      {},
      {
        limit: parseInt(perPage),
        offset: (parseInt(page) - 1) * parseInt(perPage),
      }
    );

    return sessions.map(this.mapToDocumentResponse);
  }

  async getSigningSession(id: string): Promise<DocumentSignerEntity> {
    const db = await Framework.Db.getService();
    const session = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { document_id: id }
    );

    console.log(session);

    if (!session) {
      throw new Error("Signing e-sign session not found for id " + id);
    }

    return {
      id: session.document_id,
      status: session.status,
      recipients: [
        {
          name: session.recipient_name,
          email: session.recipient_email,
          token: session.token,
          signingUrl: this.generateSigningUrl(session.token),
        },
      ],
    } as any as DocumentSignerEntity;
  }

  async addDocumentToSign(
    documentToSign: CreateDocumentToSign
  ): Promise<DocumentToSignResponse> {
    const db = await Framework.Db.getService();

    // Check if a session already exists for this signing_session_id
    const existingSession = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { signing_session_id: documentToSign.signingSessionId }
    );

    if (existingSession) {
      // Return existing session
      return this.mapToDocumentResponse(existingSession);
    }

    const token = this.generateToken();
    const documentId = this.generateDocumentId();

    // Create a session for each recipient
    const recipient = documentToSign.recipients[0]; // For now, handle one recipient
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    const session: Partial<ESignSessions> = {
      id: id(), // Generate unique ID
      signing_session_id: documentToSign.signingSessionId,
      document_id: documentId,
      recipient_email: recipient.email.trim(),
      recipient_name: recipient.name,
      status: "pending",
      token,
      expires_at: expiresAt,
      certificate_data: {
        title: documentToSign.title,
        reference: documentToSign.reference,
        subject: documentToSign.subject,
        message: documentToSign.message,
      },
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.insert<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      session as ESignSessions
    );

    const signingUrl = this.generateSigningUrl(token);
    const uploadUrl = this.generateUploadUrl(documentId);

    return {
      id: documentId,
      signingSessionId: documentToSign.signingSessionId,
      title: documentToSign.title,
      reference: documentToSign.reference,
      message: documentToSign.message,
      redirectUrl: documentToSign.redirectUrl,
      subject: documentToSign.subject,
      recipients: [
        {
          recipientId: 1,
          name: recipient.name,
          email: recipient.email,
          token,
          role: "SIGNER",
          signingUrl,
        },
      ],
      signingUrl,
      uploadUrl,
    };
  }

  async sendToSign({
    documentID,
    sendEmail,
  }: {
    documentID: string;
    sendEmail: boolean;
  }) {
    // For internal adapter, we just update the status
    // Email sending should be handled by the caller
    const db = await Framework.Db.getService();
    await db.update<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { document_id: documentID },
      { status: "pending" } as Partial<ESignSessions>
    );

    return { success: true };
  }

  async addField({ document, position }: AddFieldProps) {
    // For internal adapter, we store the signature position in the session
    const db = await Framework.Db.getService();
    const session = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { document_id: document.id.toString() }
    );

    if (!session) {
      throw new Error("Session not found");
    }

    await db.update<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { document_id: document.id.toString() },
      {
        certificate_data: {
          ...(session.certificate_data || {}),
          signaturePosition: position,
        },
      } as Partial<ESignSessions>
    );
  }

  async downloadUnsignedDocument(documentID: string): Promise<Buffer> {
    console.log("Downloading unsigned document for ID:", documentID);
    const db = await Framework.Db.getService();
    const session = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { document_id: documentID }
    );

    if (!session || !session.document_pdf) {
      throw new Error("Unsigned document not available");
    }

    // If stored as base64
    if (session.document_pdf.startsWith("data:")) {
      const base64Data = session.document_pdf.split(",")[1];
      return Buffer.from(base64Data, "base64");
    } else if (
      typeof session.document_pdf === "string" &&
      session.document_pdf
    ) {
      // If stored as S3 key, retrieve from S3
      return (await Framework.S3.download(
        session.document_pdf
      )) as any as Buffer;
    }

    return Buffer.from(session.document_pdf, "base64");
  }

  async downloadSignedDocument(documentID: string): Promise<Buffer> {
    console.log("Downloading signed document for ID:", documentID);
    const db = await Framework.Db.getService();
    const session = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { document_id: documentID }
    );

    if (!session || !session.signed_document_pdf) {
      throw new Error("Signed document not available");
    }

    // If stored as base64
    if (session.signed_document_pdf.startsWith("data:")) {
      const base64Data = session.signed_document_pdf.split(",")[1];
      return Buffer.from(base64Data, "base64");
    } else if (
      typeof session.signed_document_pdf === "string" &&
      session.signed_document_pdf
    ) {
      // If stored as S3 key, retrieve from S3
      return (await Framework.S3.download(
        session.signed_document_pdf
      )) as any as Buffer;
    }

    return Buffer.from(session.signed_document_pdf, "base64");
  }

  async getSigningSessionByToken(token: string): Promise<ESignSessions> {
    const db = await Framework.Db.getService();
    const session = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { token }
    );

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.expires_at < Date.now()) {
      throw new Error("Session expired");
    }

    return session;
  }

  async getSigningSessionBySigningSessionId(
    signingSessionId: string
  ): Promise<ESignSessions | null> {
    const db = await Framework.Db.getService();
    const session = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { signing_session_id: signingSessionId }
    );

    return session || null;
  }

  async markAsViewed(token: string): Promise<void> {
    const db = await Framework.Db.getService();
    const session = await this.getSigningSessionByToken(token);

    if (session.status === "pending") {
      await db.update<ESignSessions>(
        {} as Context,
        ESignSessionsDefinition.name,
        { token },
        { status: "viewed" } as Partial<ESignSessions>
      );
    }
  }

  async cancelSession(token: string, reason?: string): Promise<void> {
    const db = await Framework.Db.getService();
    const session = await this.getSigningSessionByToken(token);

    if (session.status === "signed") {
      throw new Error("Cannot cancel a signed document");
    }

    await db.update<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { token },
      {
        status: "cancelled",
        certificate_data: {
          ...(session.certificate_data || {}),
          cancellationReason: reason,
        },
      } as Partial<ESignSessions>
    );
  }

  async requestVerificationCode(ctx: Context, token: string): Promise<void> {
    const db = await Framework.Db.getService();
    const session = await this.getSigningSessionByToken(token);

    // Generate 8-digit code (matching frontend InputCode component)
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await db.update<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { token },
      {
        verification_code: code,
        verification_code_expires_at: expiresAt,
      } as Partial<ESignSessions>
    );

    // Send email with code
    try {
      const subject = Framework.I18n.t(
        ctx,
        "emails.signature_verification.subject"
      );
      const message = Framework.I18n.t(
        ctx,
        "emails.signature_verification.message",
        {
          replacements: { val: code },
        }
      );

      await Framework.PushEMail.push(
        {} as any,
        session.recipient_email,
        message,
        {
          subject,
        }
      );
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new Error("Failed to send verification code");
    }
  }

  async verifyCode(token: string, code: string): Promise<boolean> {
    const db = await Framework.Db.getService();
    const session = await this.getSigningSessionByToken(token);

    if (!session.verification_code) {
      return false;
    }

    if (session.verification_code_expires_at < Date.now()) {
      return false;
    }

    if (session.verification_code !== code) {
      return false;
    }

    // Mark as verified
    await db.update<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { token },
      {
        is_verified: true,
      } as Partial<ESignSessions>
    );

    return true;
  }

  // Custom methods for internal adapter

  async uploadDocument(documentID: string, pdfBuffer: Buffer): Promise<void> {
    const db = await Framework.Db.getService();

    const key = `e-sign-documents/${documentID}.pdf`;
    await Framework.S3.upload(key, pdfBuffer);

    await db.update<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { document_id: documentID },
      {
        document_pdf: key,
      } as Partial<ESignSessions>
    );
  }

  async signDocument(
    token: string,
    signatureBase64: string,
    metadata?: any
  ): Promise<Buffer> {
    const db = await Framework.Db.getService();
    const session = await db.selectOne<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { token }
    );

    if (!session) {
      throw new Error("Invalid token");
    }

    if (session.expires_at < Date.now()) {
      throw new Error("Session expired");
    }

    if (!session.is_verified) {
      throw new Error("Email not verified");
    }

    if (session.status === "signed") {
      throw new Error("Document already signed");
    }

    console.log("Signing document for session:", session.id);

    // Load the original PDF
    const originalPdfBuffer = await this.downloadUnsignedDocument(
      session.document_id
    );
    const pdfDoc = await PDFDocument.load(originalPdfBuffer);

    // Add signature to the document
    const signaturePosition = session.certificate_data?.signaturePosition;
    if (signaturePosition) {
      const page = pdfDoc.getPages()[signaturePosition.page - 1];
      const signatureImageBytes = Buffer.from(
        signatureBase64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      page.drawImage(signatureImage, {
        x: signaturePosition.x,
        y: page.getHeight() - signaturePosition.y - signaturePosition.height,
        width: signaturePosition.width,
        height: signaturePosition.height,
      });
    } else {
      console.warn(
        "No signature position defined, skipping signature placement"
      );
    }

    // Add certificate page
    session.signature_date = Date.now();
    await this.addCertificatePage(pdfDoc, session, metadata);

    // Save the signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedPdfBuffer = Buffer.from(signedPdfBytes);
    const signedPdfKey = `e-sign-documents/signed_${session.document_id}.pdf`;
    await Framework.S3.upload(signedPdfKey, signedPdfBuffer);

    // Update session
    await db.update<ESignSessions>(
      {} as Context,
      ESignSessionsDefinition.name,
      { token },
      {
        status: "signed",
        signature_image: signatureBase64,
        signed_document_pdf: signedPdfKey,
        signature_date: session.signature_date,
      } as Partial<ESignSessions>
    );

    return signedPdfBuffer;
  }

  private async addCertificatePage(
    pdfDoc: PDFDocument,
    session: ESignSessions,
    metadata?: any
  ): Promise<void> {
    const page = pdfDoc.addPage();
    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 100;

    // Title
    page.drawText("Certificat de signature électronique", {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Document info
    const info = [
      ["Document:", session.certificate_data?.title || "N/A"],
      ["Référence:", session.certificate_data?.reference || "N/A"],
      ["Signé par:", session.recipient_name],
      ["Email:", session.recipient_email],
      [
        "Date de signature:",
        new Date(session.signature_date).toLocaleString("fr-FR"),
      ],
      ["ID de session:", session.signing_session_id],
      ["ID de document:", session.document_id],
    ];

    for (const [label, value] of info) {
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(value, {
        x: 200,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPosition -= 25;
    }

    yPosition -= 20;

    // Certificate hash
    const certificateHash = this.generateCertificateHash(session);
    page.drawText("Empreinte du certificat:", {
      x: 50,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    page.drawText(certificateHash, {
      x: 50,
      y: yPosition,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    yPosition -= 40;

    // Footer
    page.drawText("Ce document a été signé électroniquement via L'inventaire", {
      x: 50,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  private generateCertificateHash(session: ESignSessions): string {
    const data = JSON.stringify({
      documentId: session.document_id,
      sessionId: session.signing_session_id,
      email: session.recipient_email,
      date: session.signature_date,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  private generateSigningUrl(token: string): string {
    const baseUrl = config.get<string>("signature.webhook.to_sign");
    return baseUrl.replace(":signing-session", token);
  }

  private generateUploadUrl(documentId: string): string {
    const serverDomain = config.get<string>("server.domain");
    return `${serverDomain}/api/signing-sessions/internal/upload/${documentId}`;
  }

  private mapToDocumentResponse(
    session: ESignSessions
  ): DocumentToSignResponse {
    return {
      id: session.document_id,
      signingSessionId: session.signing_session_id,
      title: session.certificate_data?.title || "",
      reference: session.certificate_data?.reference || "",
      message: session.certificate_data?.message || "",
      redirectUrl: "",
      subject: session.certificate_data?.subject || "",
      recipients: [
        {
          recipientId: 1,
          name: session.recipient_name,
          email: session.recipient_email,
          token: session.token,
          role: "SIGNER",
          signingUrl: this.generateSigningUrl(session.token),
        },
      ],
      signingUrl: this.generateSigningUrl(session.token),
      uploadUrl: this.generateUploadUrl(session.document_id),
    };
  }
}
