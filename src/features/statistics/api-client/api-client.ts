import { fetchServer } from "@features/utils/fetch-server";

import { StandardOrErrorResponse } from "@features/utils/rest/types/types";
import { Statistics } from "../types";
import { Invoices } from "@features/invoices/types/types";

export class StatisticsApiClient {
  static getStatistics = async (
    clientID: string,
    period: string = "year"
  ): Promise<StandardOrErrorResponse<Statistics>> => {
    let uri = `/api/statistics/v1/${clientID}/all`;

    if (period) {
      uri += "?period=" + period;
    }

    const response = await fetchServer(uri.toString(), {
      method: "GET",
    });

    const data = await response.json();
    return data;
  };

  static getClientBalance = async (
    clientID: string,
    contactID: string
  ): Promise<{
    delay30Payments: Invoices[];
    delay60Payments: Invoices[];
    delay90Payments: Invoices[];
    delay120Payments: Invoices[];
    delayMore120Payments: Invoices[];
  }> => {
    let uri = `/api/statistics/v1/${clientID}/client-balance/` + contactID;

    const response = await fetchServer(uri.toString(), {
      method: "GET",
    });

    const data = await response.json();
    return data;
  };
}
