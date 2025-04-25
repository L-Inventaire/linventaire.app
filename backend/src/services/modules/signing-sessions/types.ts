export type DocumentsType = {
  nothing?: null;
};

type CreateDocumentToSignRecipient = {
  name: string;
  email: string;
};

type CreateDocumentToSignRecipientResponse = {
  recipientId: number;
  name: string;
  email: string;
  token: string;
  role: string;
  signingUrl: string;
};

export type CreateDocumentToSign = {
  signingSessionId: string;
  title: string;
  reference: string;
  recipients: CreateDocumentToSignRecipient[];
  subject: string;
  message: string;
  redirectUrl: string;
};

export type DocumentToSignResponse = {
  id: string;
  signingUrl: string;
  uploadUrl: string;
  recipients: CreateDocumentToSignRecipientResponse[];
} & CreateDocumentToSign;

export type DocumentSignerEntity = {
  id: number;
  externalId: string;
  userId: number;
  teamId: number | null;
  title: string;
  status: string;
  documentDataId: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  recipients: Recipient[];
  signingUrl: string;
};

type Recipient = {
  id: number;
  documentId: number;
  email: string;
  name: string;
  role: string;
  token: string;
  signedAt: string | null;
  readStatus: string;
  signingStatus: string;
  sendStatus: string;
  signingUrl: string;
};
