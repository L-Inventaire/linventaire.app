import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";
import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import { Recipient } from "../../invoices/entities/invoices";

export type EventMetadatas =
  | {
      event_type: "invoice_sent";
      recipients: Recipient[];
    }
  | {
      event_type: "quote_sent";
      recipients: Recipient[];
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
      emails: string[];
    }
  | {
      event_type: "invoice_back_to_draft";
      reason: string;
    };

export default class Comments extends RestEntity {
  item_entity = "string";
  item_id = "string";
  content = "string";
  documents = ["type:files"]; // Internal documents linked to the comment
  type: "event" | "comment" = "comment";
  event_type = "string";
  reactions = [new Reactions()];
  metadata: EventMetadatas = {} as any;
}

class Reactions {
  reaction = "string";
  users = ["string"];
}

export const CommentsDefinition: RestTableDefinition = {
  name: "comments",
  columns: {
    ...columnsFromEntity(Comments),
    ...new RestEntityColumnsDefinition(),
    content: "TEXT",
    event_type: "VARCHAR(64)",
  },
  pk: ["client_id", "item_id", "id"],
  indexes: [["client_id", "item_id", "created_at", "id"]],
  rest: {
    schema: classToSchema(new Comments()),
  },
};

export const CommentsSchema = schemaFromEntity<Comments>(
  CommentsDefinition.columns
);
