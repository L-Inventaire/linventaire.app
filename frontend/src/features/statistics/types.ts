import { Contacts } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";

type MonthlyResults = {
  type: Invoices["type"];
  state: Invoices["state"];
  month: string; // YYYY-MM
  amount_ht: string;
  amount: string;
  count: string;
};

export type Dashboard = {
  all: MonthlyResults[];
  counters: {
    quotes: {
      sent: number;
      purchase_order: number;
      completed: number;
    };
    invoices: {
      sent: number;
      late: number;
      paid: number;
    };
    supplier_quotes: {
      transit: number;
      completed: number;
    };
    supplier_invoices: {
      sent: number;
      paid: number;
    };
  };
};

export type Statistics = {
  unreadNotifications: number;
} & Dashboard;

export type DashboardTags = {
  [tag: string]: number;
};

export type LateCellType = {
  total_invoices: number;
  total_credit_notes: number;
  total: number;

  count_invoices: number;
  count_credit_notes: number;
  count: number;
};

type LateType = {
  id: string;
  contact?: Contacts;
  total: LateCellType;
  future: LateCellType;
  d30: LateCellType;
  d60: LateCellType;
  d90: LateCellType;
  d120: LateCellType;
  d120plus: LateCellType;
};

export type DashboardBalances = LateType[];

export type AccountingExportLine = {
  // Invoice information
  invoice_id: string;
  invoice_reference: string;
  invoice_emit_date: string;
  invoice_type: string;
  invoice_state: string;
  invoice_total_ht: number;
  invoice_total_ttc: number;

  // Contact information
  contact_id: string;
  contact_name: string;

  // Line information
  line_index: number;
  line_article_id: string;
  line_article_name: string;
  line_article_reference: string;
  line_description: string;
  line_quantity: number;
  line_unit: string;
  line_unit_price: number;
  line_total_ht: number;
  line_tva_rate: string;
  line_tva_amount: number;
  line_total_ttc: number;

  // Accounting information
  accounting_number: string;
  accounting_name: string;
  accounting_standard: string;

  // Tags
  tags: string;
};
