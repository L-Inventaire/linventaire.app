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

  /**
   * Marks all notifications as read for the current user in the specified client
   * @param clientId The client ID
   * @returns A promise that resolves when all notifications have been marked as read
   */
  static async markAllNotificationsAsRead(clientId: string) {
    const response = await fetchServer(
      `/api/notifications/v1/${clientId}/read_all`,
      {
        method: "POST",
      }
    );
    return await response.json();
  }
}
