import { fetchServer } from "@features/utils/fetch-server";
import { StockItems } from "../types/types";

export class StockApiClient {
  static async importMultiple(clientId: string, items: StockItems[]) {
    const response = await fetchServer(`/api/stocks/v1/${clientId}/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      throw new Error("Failed to import stock items");
    }

    return response.json();
  }
}
