import { fetchServer } from "@features/utils/fetch-server";
import { FurnishQuotesResponse } from "../types";

export class InvoicesApiClient {
  static getFurnishQuotes = async (clientId: string, quotesIDs: string[]) => {
    const response = await fetchServer(
      `/api/invoices/v1/${clientId}/furnish-invoices?quotes=${quotesIDs.join(
        ","
      )}`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    return data as FurnishQuotesResponse;
  };
}
