export type Orders = {
  client_id: string;
  id: string;

  state: string; // "created", "ordered", "completed", "cancelled"
  reference: string;

  supplier: string; // "type:contacts"
  articles: string[]; // "type:articles"
  articles_details: { [key: string]: OrderArticlesDetails };

  rel_quotes: string[]; // "type:invoices"

  assigned: string[]; // "type:users"
  notes: string;
  documents: string[];
  tags: string[];

  fields: any;
};

export type OrderArticlesDetails = {
  quantity: number;
};
