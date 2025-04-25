type Recipient = {
    name: string;
    email: string;
    role: string;
};

type Meta = {
    subject?: string;
    message?: string;
    timezone?: string;
    redirectUrl?: string;
};

type FormValues = {
    [key: string]: string;
};

export type DocumensoDocument = {
    title: string;
    externalId: string;
    recipients: Recipient[];
    meta?: Meta;
    formValues?: FormValues;
};

export type DocumensoDocumentResponse =
    {
        "uploadUrl": string,
        "documentId": number,
        "recipients": {
            "recipientId": number,
            "name": string,
            "email": string,
            "token": string,
            "role": "SIGNER",
            "signingUrl": string
        }[]
    }