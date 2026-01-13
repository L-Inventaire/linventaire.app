export interface SignDocumentRequest {
  signatureBase64: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    [key: string]: any;
  };
}

export interface SignDocumentResponse {
  success: boolean;
  documentId: string;
  signedAt: number;
  downloadUrl: string;
}

export interface SessionResponse {
  id: string;
  documentId: string;
  recipientName: string;
  recipientEmail: string;
  status: string;
  documentTitle: string;
  documentReference: string;
  expiresAt: number;
  hasPdf: boolean;
}

export interface CancelSessionRequest {
  reason?: string;
}
