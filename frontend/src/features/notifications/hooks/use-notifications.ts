import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { useAuth } from "@features/auth/state/use-auth";
import { useCurrentClient } from "@features/clients/state/use-clients";
import {
  RestOptions,
  RestSearchQuery,
  useRest,
} from "@features/utils/rest/hooks/use-rest";
import { useCallback, useEffect } from "react";
import { NotificationsApiClient } from "../api-client/notifications-api-client";
import { Notifications } from "../types/types";

export const useNotifications = (options?: RestOptions<Notifications>) => {
  const { user } = useAuth();
  const { id: clientId } = useCurrentClient();
  const rest = useRest<Notifications>("notifications", {
    ...options,
    index: "last_notified_at desc",
    asc: true,
    limit: 100,
    query: [
      ...Array.from((options?.query as RestSearchQuery[]) || []),
      { key: "user_id", values: [{ op: "equals", value: user?.id }] },
    ],
  });

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);
  /**
   * Marks all notifications as read and refreshes the notifications list
   */
  const markAllAsRead = useCallback(async () => {
    if (!clientId) return;

    try {
      await NotificationsApiClient.markAllNotificationsAsRead(clientId);
      // Refresh the notifications list after marking all as read
      rest.refresh();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [clientId, rest]);

  return {
    notifications: rest.items,
    markAllAsRead,
    ...rest,
  };
};

export const useNotification = (id: string) => {
  const rest = useNotifications({
    query: generateQueryFromMap({ id }),
    limit: id ? 1 : 0,
    key: "notification_" + id,
  });
  return {
    notification: id ? (rest.notifications.data?.list || [])[0] : null,
    isPending: id ? rest.notifications.isPending : false,
    ...rest,
  };
};
