import { RestEntity } from "@features/utils/rest/types/types";

export type EventMetadatas =
  | {
      event_type: "invoice_sent";
      recipients: { email: string; role: "signer" | "viewer" }[];
    }
  | {
      event_type: "quote_sent";
      recipients: { email: string; role: "signer" | "viewer" }[];
    }
  | {
      event_type: "quote_signed";
      email: string;
      session_id: string;
    }
  | {
      event_type: "quote_refused";
      email: string;
      reason: string;
    }
  | {
      event_type: "smtp_failed";
      emails: string[]; // Recipients that were rejected by the mail server
      partial?: boolean; // true when some recipients did receive the email
      sent_emails?: string[]; // Recipients that received the email (partial send)
    }
  | {
      event_type: "invoice_back_to_draft";
      reason: string;
    };

export type Comments = RestEntity & {
  item_entity: string;
  item_id: string;
  content: string;
  documents: string[];
  type: "event" | "comment";
  reactions: Reactions[];
  metadata?: EventMetadatas;
};

class Reactions {
  reaction = "string";
  users = ["string"];
}

export type Threads = RestEntity & {
  item_entity: string;
  item_id: string;
  subscribers: string[];
};
