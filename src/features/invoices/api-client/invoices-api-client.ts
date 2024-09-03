import { getServerUrl } from "@features/utils/fetch-server";
import { Invoices } from "../types/types";

export class InvoicesApiClient {
  static getPdfRoute(invoice: Pick<Invoices, "id" | "client_id">) {
    return getServerUrl(
      `/api/invoices/v1/${invoice.client_id}/invoice/${invoice.id}/pdf`
    );
  }
}
