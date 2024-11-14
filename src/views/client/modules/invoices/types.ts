import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";

export type FurnishQuotesResponse = {
  actions: FurnishInvoiceAction[];
  furnishes: FurnishQuotesFurnish[];
};

export type FurnishInvoiceAction = {
  ref: string;
  action: "withdraw-stock" | "order-items";
  quote: Invoices;

  supplierQuote?: Invoices;
  stockItem?: StockItems;
  furnishes: FurnishQuotesFurnish[];
  content?: InvoiceLine[];
};

export type FurnishQuotesFurnish = {
  ref: string;
  invoiceLines?: InvoiceLine[];
  maxAvailable?: number;
  quantity: number;
  totalToFurnish: number;
  articleID: string;

  supplierID?: string;
  stockID?: string;
};
