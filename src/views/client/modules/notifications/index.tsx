import { Info } from "@atoms/text";
import { useNotifications } from "@features/notifications/hooks/use-notifications";
import { Spinner } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";

export const NotificationsPage = () => {
  const { notifications } = useNotifications();
  return (
    <Page
      title={[
        {
          label: "Notifications",
        },
      ]}
      inset
    >
      {!notifications?.data && (
        <Spinner className="m-auto absolute left-0 right-0 top-0 bottom-0" />
      )}
      {!!notifications?.data && (
        <div className="flex flex-row w-full h-full">
          <div className="p-3 border-r border-r-slate-100 dark:border-r-slate-700 w-1/2 max-w-[288px]">
            {!notifications?.data?.total && (
              <Info className="text-center w-full block mt-8">
                Aucune notification, revenez plus tard.
              </Info>
            )}
          </div>
          <div className="p-3 grow border-r border-r-950 dark:border-r-950"></div>
        </div>
      )}
    </Page>
  );
};
