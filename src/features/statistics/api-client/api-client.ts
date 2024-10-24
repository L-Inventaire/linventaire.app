import { fetchServer } from "@features/utils/fetch-server";

import { StandardOrErrorResponse } from "@features/utils/rest/types/types";

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
}
