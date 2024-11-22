import { Contacts } from "@features/contacts/types/types";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";

export type FurnishQuotesResponse = {
  actions: FurnishInvoiceAction[];
  furnishes: FurnishQuotesFurnish[];
  articles: FurnishQuotesArticle[];
};

export type FurnishQuotesArticle = {
  id: string;
  remainingQuantity: number;
  totalToFurnish: number;
  alreadyFurnishedQuantity: number;
};

export type FurnishInvoiceAction = {
  ref: string;
  action: "withdraw-stock" | "order-items";
  quote: Invoices;

  supplierQuote?: Invoices;
  stockItem?: StockItems;
  furnishes: FurnishQuotesFurnish[];
  content?: InvoiceLine[];
  supplier?: Contacts;
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
