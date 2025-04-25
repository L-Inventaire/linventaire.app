import { RestEntity } from "@features/utils/rest/types/types";

export type AccountingTransactions = RestEntity & {
  transaction_date: string;

  reference: string;
  credit: string;
  debit: string;
  amount: number;
  currency: string;

  rel_invoices: string[];

  notes: string;
  documents: string[];
  tags: string[];
  assigned: string[];
};

export type AccountingAccounts = RestEntity & {
  type: "client" | "supplier" | "internal";
  contact: string;
  standard_identifier: string; // Numéro sur le plan comptable
  standard: "pcg" | "ifrs"; // Plan Comptable Général, dans le futur pourrait être étendu à d'autres standards
  name: string;
  notes: string;
};
