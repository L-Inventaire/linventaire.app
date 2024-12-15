import { fetchServer, getServerUrl } from "@features/utils/fetch-server";
import { InvoiceLine, Invoices, PartialInvoiceOutType } from "../types/types";
import {
  FurnishQuotesFurnish,
  FurnishQuotesResponse,
} from "@views/client/modules/invoices/types";

export class InvoicesApiClient {
  static getPdfRoute(
    invoice: Pick<Invoices, "id" | "client_id">,
    options?: {
      checked?: (InvoiceLine & { _index?: number })[];
      as?: "delivery_slip" | "proforma" | "receipt_acknowledgement" | "";
      content?: { _index: number; quantity: number }[];
    }
  ) {
    const { checked } = options ?? {};
    const checkedObject = Object.fromEntries(
      (checked ?? []).map((option, index) => [
        option?._index !== undefined ? option?._index : index.toString(),
        option.optional_checked ? "1" : "0",
      ])
    );

    const urlParams = new URLSearchParams();

    if ((checked ?? []).length > 0) {
      urlParams.append("checked", JSON.stringify(checkedObject));
    }
    if (options?.as) {
      urlParams.append("as", options.as);
    }
    if (options?.content && options.content?.length > 0) {
      urlParams.append("content", JSON.stringify(options.content));
    }

    const url = getServerUrl(
      `/api/invoices/v1/${invoice.client_id}/invoice/${invoice.id}/pdf`
    );

    return url + "?" + urlParams.toString();
  }

  static async send(
    invoice: Pick<Invoices, "id" | "client_id">,
    recipients: string[],
    options: {
      checked?: (InvoiceLine & { _index?: number })[];
      as: "delivery_slip" | "proforma" | "receipt_acknowledgement" | "";
      content?: { _index: number; quantity: number }[];
    }
  ) {
    const res = await fetchServer(
      `/api/invoices/v1/${invoice.client_id}/invoice/${invoice.id}/send`,
      {
        method: "POST",
        body: JSON.stringify({ ...options, recipients }),
      }
    );
    return res.json();
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

  static getFurnishQuotes = async (
    clientId: string,
    quotesIDs: string[],
    furnishesOverride?: FurnishQuotesFurnish[]
  ) => {
    const response = await fetchServer(
      `/api/invoices/v1/${clientId}/furnish-invoices?quotes=${quotesIDs.join(
        ","
      )}`,
      {
        method: "POST",
        body: JSON.stringify({ furnishesOverride }),
      }
    );
    const data = await response.json();
    return data as FurnishQuotesResponse;
  };

  static actionFurnishQuotes = async (
    clientId: string,
    quotesIDs: string[],
    furnishesOverride?: FurnishQuotesFurnish[]
  ) => {
    const response = await fetchServer(
      `/api/invoices/v1/${clientId}/action-furnish-invoices?quotes=${quotesIDs.join(
        ","
      )}`,
      {
        method: "POST",
        body: JSON.stringify({ furnishesOverride }),
      }
    );
    const data = await response.json();
    return data as FurnishQuotesResponse;
  };
}
