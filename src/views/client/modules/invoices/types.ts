import { InvoiceLine } from "@features/invoices/types/types";

export type FurnishQuotesResponse = {
  actions: any[];
  furnishes: FurnishQuotesFurnish[];
};

export type FurnishQuotesFurnish = {
  maxAvailable?: number;
  ref: string;
  supplierID?: string;
  stockID?: any;
  quantity: number;
  totalToFurnish: number;
  articleID: string;
  invoiceLines: InvoiceLine[];
};
