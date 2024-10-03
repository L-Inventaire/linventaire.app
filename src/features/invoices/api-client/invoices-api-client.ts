import { fetchServer, getServerUrl } from "@features/utils/fetch-server";
import { InvoiceLine, Invoices, PartialInvoiceOutType } from "../types/types";

export class InvoicesApiClient {
  static getPdfRoute(
    invoice: Pick<Invoices, "id" | "client_id">,
    options?: InvoiceLine[]
  ) {
    const optionsObject = Object.fromEntries(
      (options ?? []).map((option, index) => [
        index.toString(),
        option.optional_checked ? "1" : "0",
      ])
    );

    const urlParams = new URLSearchParams();

    if ((options ?? []).length > 0) {
      urlParams.append("checked", JSON.stringify(optionsObject));
    }

    const url = getServerUrl(
      `/api/invoices/v1/${invoice.client_id}/invoice/${invoice.id}/pdf`
    );

    if ((options ?? []).length > 0) {
      return url + "?" + urlParams.toString();
    }

    return url;
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
