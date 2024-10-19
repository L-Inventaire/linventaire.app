type Statistics = {
  totalRevenue: number;
  revenueStats: {
    date: string;
    net_amount: number;
  }[];
  totalExpenses: number | null;
  benefits: number | null;
  stockEntries: number | null;
  stockExits: number | null;
  signedQuotes: number | null;
  sentQuotes: number | null;
  paidInvoices: number | null;
  sentInvoices: number | null;
  sentPurchaseOrders: number | null;
  almostLateDeliveries: string[] | null;
};
