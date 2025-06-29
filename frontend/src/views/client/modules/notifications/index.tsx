import { Input } from "@atoms/input/input-text";
import { Info } from "@atoms/text";
import { RestUserTag } from "@components/deprecated-rest-tags/components/user";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { CtrlKRestEntities, useParamsOrContextId } from "@features/ctrlk";
import {
  useNotification,
  useNotifications,
} from "@features/notifications/hooks/use-notifications";
import { Notifications } from "@features/notifications/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  CheckIcon,
  CogIcon,
  EllipsisHorizontalIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  DropdownMenu,
  Heading,
  Link,
  ScrollArea,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { formatDistance } from "date-fns";
import _ from "lodash";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

export const NotificationsPage = () => {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { notifications, update, markAllAsRead } = useNotifications({
    query: buildQueryFromMap({
      read: unreadOnly ? false : undefined,
      query: searchQuery,
    }),
  });
  const { t } = useTranslation();
  const navigate = useNavigateAlt();
  const { id } = useParamsOrContextId();

  const filteredNotifications = notifications?.data?.list || [];

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
            <div className="flex flex-col grow w-full text-black dark:text-white min-h-full sm:bg-transparent">
              {/* Search and filters header */}
              <div className="border-b border-b-slate-100 dark:border-b-slate-700">
                <div className="flex items-center">
                  <Input
                    size="sm"
                    className="grow py-2 !border-none !outline-none !ring-0 !shadow-none !bg-transparent"
                    placeholder="Filtrer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button
                        variant="ghost"
                        className="h-6 w-6 p-0 rounded-full mx-1"
                      >
                        <EllipsisHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item
                        onSelect={() => setUnreadOnly(!unreadOnly)}
                      >
                        <div className="flex items-center">
                          <FunnelIcon className="h-3 w-3 mr-2" />
                          {!unreadOnly ? (
                            <Text>Non lus uniquement</Text>
                          ) : (
                            <Text>Afficher les notification lues</Text>
                          )}
                        </div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => markAllAsRead()}
                        disabled={
                          !notifications?.data?.list?.some((n) => !n.read)
                        }
                      >
                        <div className="flex items-center">
                          <CheckIcon className="h-3 w-3 mr-2" />
                          <Text>Tout marquer comme lu</Text>
                        </div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={(e) =>
                          navigate(getRoute(ROUTES.AccountNotifications), {
                            event: e as any,
                          })
                        }
                      >
                        <div className="flex items-center">
                          <CogIcon className="h-3 w-3 mr-2" />
                          <Text>Paramètres des notifications</Text>
                        </div>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>

              <div className="grow relative">
                <ScrollArea
                  scrollbars="vertical"
                  className="!absolute left-0 top-0 w-full h-full"
                >
                  {!filteredNotifications.length && (
                    <Info className="p-3 text-center w-full block mt-8">
                      {searchQuery || unreadOnly
                        ? "Aucune notification ne correspond aux critères."
                        : "Aucune notification, revenez plus tard."}
                    </Info>
                  )}
                  {filteredNotifications.map((n) => {
                    const events = _.uniqBy(
                      [
                        { type: n.type, metadata: n.metadata },
                        ...(n.also || []),
                      ],
                      "type"
                    );

                    return (
                      <div
                        key={n.id}
                        className={twMerge(
                          "w-full border-b border-b-slate-100 dark:border-b-slate-700 flex",
                          id !== n.id &&
                            "cursor-pointer hover:bg-slate-25 dark:hover:bg-slate-800",
                          id === n.id && "bg-blue-50 dark:bg-blue-800"
                        )}
                        onClick={(event: any) => {
                          navigate(
                            getRoute(ROUTES.NotificationsPreview, { id: n.id }),
                            { event }
                          );
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
                            !!n.read && id !== n.id && "opacity-25"
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
                              {n.created_by && (
                                <RestUserTag
                                  id={n.created_by}
                                  size={"md"}
                                  className="border-none -ml-2 bg-transparent"
                                />
                              )}
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
            </div>
          </div>
          <div className="grow border-r border-r-950 dark:border-r-950">
            {id && <NotificationPreview id={id} key={id} />}
          </div>
        </div>
      )}
    </Page>
  );
};

const NotificationPreview = ({ id }: { id: string }) => {
  const { notification } = useNotification(id);
  const configuration = CtrlKRestEntities[notification?.entity || ""];
  if (!notification) return null;
  if (!configuration?.renderPage) {
    let viewRoute = configuration?.viewRoute;
    if (notification?.entity === "crm_items") viewRoute = ROUTES.CRMView;
    if (!viewRoute) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Link
          href={getRoute(viewRoute || "", {
            id: notification!.entity_id,
          })}
        >
          <Button variant="surface">Voir le document</Button>
        </Link>
      </div>
    );
  }
  return (
    <>
      {configuration.renderPage({
        id: notification!.entity_id,
        readonly: true,
      })}
    </>
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
