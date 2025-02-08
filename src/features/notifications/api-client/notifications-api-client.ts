import { fetchServer } from "@features/utils/fetch-server";
import { NotificationsPreferences } from "../types/types";

export class NotificationsApiClient {
  static async getNotificationsPreferences(clientId: string) {
    const tmp = await fetchServer(
      `/api/notifications/v1/${clientId}/preferences`
    );
    return (await tmp.json()) as NotificationsPreferences;
  }

  static async setNotificationsPreferences(
    clientId: string,
    data: Partial<NotificationsPreferences>
  ) {
    const tmp = await fetchServer(
      `/api/notifications/v1/${clientId}/preferences`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return (await tmp.json()) as NotificationsPreferences;
  }
}
