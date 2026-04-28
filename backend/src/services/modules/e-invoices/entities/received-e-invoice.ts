import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";
import { EN16931Invoice } from "../../../../platform/e-invoices/adapters/superpdp/en16931-types";

export class ReceivedEInvoice extends RestEntity {
  state: "new" | "rejected" | "attached" = "new";

  // SuperPDP invoice ID
  superpdp_invoice_id = 0;

  // Invoice direction (should always be "in" for received)
  direction: "in" | "out" = "in";

  // Invoice metadata
  invoice_number = "string";
  issue_date = 0; // timestamp
  type_code = 0; // Invoice type code (380 for invoice, 381 for credit note, etc.)
  currency_code = "string";

  // Parties
  seller_name = "string";
  seller_vat = "string";
  seller_address = "string";
  buyer_name = "string";
  buyer_vat = "string";

  // Amounts
  total_amount = 0;
  total_tax_amount = 0;
  total_amount_with_tax = 0;

  // Status
  status: "received" | "validated" | "error" = "received";
  status_message = "string";

  // Raw invoice data (EN16931 JSON format)
  en_invoice = {} as EN16931Invoice;

  // Processing
  processed = false; // Whether we've attempted to create a supplier invoice
  supplier_invoice_id = "string"; // Link to created supplier invoice if any
  processing_error = "string"; // Error message if processing failed

  // Timestamps
  received_at = 0;
  superpdp_created_at = 0;
}

export const ReceivedEInvoiceDefinition: RestTableDefinition = {
  name: "received_e_invoices",
  columns: {
    ...columnsFromEntity(ReceivedEInvoice),
    ...new RestEntityColumnsDefinition(),
  },
  pk: ["client_id", "id"],
  auditable: true,
  rest: {
    label: (invoice: ReceivedEInvoice) =>
      `${invoice.invoice_number} - ${invoice.seller_name}`,
    searchable: (invoice: ReceivedEInvoice) =>
      [
        invoice.invoice_number,
        invoice.seller_name,
        invoice.seller_vat,
        invoice.buyer_name,
      ].join(" "),
    schema: classToSchema(new ReceivedEInvoice()),
  },
};

export const ReceivedEInvoiceSchema = schemaFromEntity<ReceivedEInvoice>(
  ReceivedEInvoiceDefinition.columns
);
