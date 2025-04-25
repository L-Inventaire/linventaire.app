import { PositionPdf } from "../invoices/services/generate-pdf";
import {
  CreateDocumentToSign,
  DocumentSignerEntity,
  DocumentToSignResponse,
} from "./types";

export type SendToSignProps = {
  documentID: string;
  sendEmail?: boolean;
};

export type AddFieldProps = {
  document: DocumentSignerEntity;
  position: PositionPdf;
};

export interface DocumentSignerInterface {
  getAllSigningSessions(): Promise<DocumentToSignResponse[]>;

  getSigningSession(id: string): Promise<DocumentSignerEntity>;

  addDocumentToSign(
    documentToSign: CreateDocumentToSign
  ): Promise<DocumentToSignResponse>;

  sendToSign(_: SendToSignProps);

  addField({ document, position }: AddFieldProps);

  downloadSignedDocument(documentID: string): Promise<Buffer>;
}
