import { useCurrentClient } from "@features/clients/state/use-clients";
import { useQuery } from "@tanstack/react-query";
import { NotificationsApiClient } from "../api-client/notifications-api-client";
import { NotificationsPreferences } from "../types/types";

export const useNotificationsPreferences = () => {
  const { client } = useCurrentClient();
  const preferences = useQuery({
    queryKey: ["notifications", client?.id],
    queryFn: () =>
      NotificationsApiClient.getNotificationsPreferences(client!.id),
  });

  return {
    ...preferences,
    update: async (data: Partial<NotificationsPreferences>) => {
      await NotificationsApiClient.setNotificationsPreferences(
        client!.id,
        data
      );
      preferences.refetch();
    },
  };
};
