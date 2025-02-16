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

type LateCellType = {
  total_invoices: number;
  total_credit_notes: number;
  total: number;

  count_invoices: number;
  count_credit_notes: number;
  count: number;
};

type LateType = {
  id: string;
  client?: Contacts;
  total: LateCellType;
  late: LateCellType;
  d30: LateCellType;
  d60: LateCellType;
  d90: LateCellType;
  d120: LateCellType;
  d120plus: LateCellType;
};

export type DashboardBalances = LateType[];
