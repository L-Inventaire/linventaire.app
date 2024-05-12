export type Stock = {
  client_id: string;
  id: string;

  state: string; // In stock, Reserved, Delivered, Bought
  article: string; // "type:articles"

  rel_contact: string; //"type:contacts"
  rel_order: string; //"type:orders"
  rel_quote: string; //"type:invoices"
  rel_invoice: string; //"type:invoices"

  notes: string;
  documents: string[];
  tags: string[];

  fields: any;
};
