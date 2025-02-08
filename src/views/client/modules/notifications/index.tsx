import { Info } from "@atoms/text";
import { RestUserTag } from "@components/deprecated-rest-tags/components/user";
import { useNotifications } from "@features/notifications/hooks/use-notifications";
import { Notifications } from "@features/notifications/types/types";
import { Heading, ScrollArea, Spinner, Text } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { formatDistance } from "date-fns";
import _ from "lodash";
import { Trans, useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

export const NotificationsPage = () => {
  const { notifications, update } = useNotifications();
  const { t } = useTranslation();
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
          <div className="border-r border-r-slate-100 dark:border-r-slate-700 w-1/2 max-w-[288px]">
            <ScrollArea scrollbars="vertical">
              {!notifications?.data?.total && (
                <Info className="p-3 text-center w-full block mt-8">
                  Aucune notification, revenez plus tard.
                </Info>
              )}
              {notifications?.data?.list?.map((n) => {
                const events = _.uniqBy(
                  [{ type: n.type, metadata: n.metadata }, ...(n.also || [])],
                  "type"
                );

                return (
                  <div
                    key={n.id}
                    className={twMerge(
                      "w-full border-b border-b-slate-100 dark:border-b-slate-700 flex",
                      "cursor-pointer hover:bg-slate-25 dark:hover:bg-slate-800"
                    )}
                    onClick={() => {
                      if (n.read) return;
                      update.mutateAsync({
                        id: n.id,
                        user_id: n.user_id,
                        read: true,
                      });
                    }}
                  >
                    <div className="pl-2 pr-1.5 pt-4 shrink-0">
                      <div
                        className={twMerge(
                          "rounded-full w-2 h-2",
                          !!n.read && "bg-slate-500 opacity-10",
                          !n.read && "bg-blue-500"
                        )}
                      ></div>
                    </div>
                    <div
                      className={twMerge(
                        "p-3 pl-0 grow",
                        !!n.read && "opacity-25"
                      )}
                    >
                      <Heading size="2" className="line-clamp-1">
                        <Trans
                          t={t}
                          i18nKey={[
                            `notifications.entities_names.${n.entity}`,
                            n.entity,
                          ]}
                          values={{
                            name: n.entity_display_name?.replace(
                              /<[^>]*>?/gm,
                              " "
                            ),
                          }}
                          components={[<span />]}
                        />
                      </Heading>
                      <Text
                        size={"2"}
                        className="leading-2 mt-1 line-clamp-2 min-h-8"
                      >
                        {(events || []).map((also) => (
                          <>
                            <NotificationText
                              key={also.type}
                              n={n}
                              type={also.type}
                              metadata={also.metadata}
                            />{" "}
                          </>
                        ))}
                      </Text>
                      <div className="flex w-full items-center mt-1 -mb-2">
                        <div className="grow">
                          <RestUserTag
                            id={n.updated_by}
                            size={"md"}
                            className="border-none -ml-2 bg-transparent"
                          />
                        </div>
                        <Text size="1" className="opacity-50 block">
                          {formatDistance(
                            new Date(n.last_notified_at),
                            new Date(),
                            {
                              addSuffix: true,
                            }
                          )}
                        </Text>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </div>
          <div className="p-3 grow border-r border-r-950 dark:border-r-950"></div>
        </div>
      )}
    </Page>
  );
};

const NotificationText = ({
  n,
  type,
  metadata,
}: {
  n: Notifications;
  metadata: any;
  type: string;
}) => {
  const { t } = useTranslation();

  return (
    <Trans
      t={t}
      i18nKey={[`notifications.${type}.title`, `notifications.${type}`, type]}
      values={metadata}
      components={[
        <Trans
          t={t}
          i18nKey={[`notifications.entities_names.${n.entity}`, n.entity]}
          values={{
            ...metadata,
            name: n.entity_display_name?.replace(/<[^>]*>?/gm, " "),
          }}
          components={[<span />]}
        />,
        <Name metadata={metadata} />,
      ]}
    />
  );
};

const Name = ({ metadata }: { metadata: any }) => {
  return <>{metadata?.by_name}</>;
};
