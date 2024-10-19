import { fetchServer } from "@features/utils/fetch-server";

import { StandardOrErrorResponse } from "@features/utils/rest/types/types";

export class StatisticsApiClient {
  static getStatistics = async (
    clientID: string
  ): Promise<StandardOrErrorResponse<Statistics>> => {
    const response = await fetchServer(`/api/statistics/v1/${clientID}/all`, {
      method: "GET",
    });

    const data = await response.json();
    return data;
  };
}
