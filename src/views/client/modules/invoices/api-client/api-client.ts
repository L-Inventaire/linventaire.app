import { fetchServer } from "@features/utils/fetch-server";
import { FurnishQuotesFurnish, FurnishQuotesResponse } from "../types";

export class InvoicesApiClient {
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
}
