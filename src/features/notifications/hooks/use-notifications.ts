import { useAuth } from "@features/auth/state/use-auth";
import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { useEffect } from "react";
import { Notifications } from "../types/types";

export const useNotifications = (options?: RestOptions<Notifications>) => {
  const { user } = useAuth();
  const rest = useRest<Notifications>("notifications", {
    ...options,
    query: {
      user_id: user?.id,
    },
  });

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { notifications: rest.items, ...rest };
};

export const useNotification = (id: string) => {
  const rest = useNotifications({ id, limit: id ? 1 : 0 });
  return {
    notification: id ? (rest.notifications.data?.list || [])[0] : null,
    isPending: id ? rest.notifications.isPending : false,
    ...rest,
  };
};
