import { fetchServer, getServerUrl } from "@features/utils/fetch-server";
import { InvoiceLine, Invoices, PartialInvoiceOutType } from "../types/types";

export class InvoicesApiClient {
  static getPdfRoute(invoice: Pick<Invoices, "id" | "client_id">) {
    return getServerUrl(
      `/api/invoices/v1/${invoice.client_id}/invoice/${invoice.id}/pdf`
    );
  }

  static async getPartialInvoice(
    invoice: Pick<Invoices, "id" | "client_id">,
    selection: Partial<InvoiceLine>[] = []
  ) {
    const res = await fetchServer(
      `/api/invoices/v1/${invoice.client_id}/invoice/${invoice.id}/partial`,
      {
        method: "POST",
        body: JSON.stringify(selection),
      }
    );
    return res.json() as Promise<PartialInvoiceOutType>;
  }
}
