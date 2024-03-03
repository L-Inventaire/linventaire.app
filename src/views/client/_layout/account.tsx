import Avatar from "@atoms/avatar/avatar";
import { DropDownAtom } from "@atoms/dropdown";
import Link from "@atoms/link";
import { Base, Info } from "@atoms/text";
import { useAuth } from "@features/auth/state/use-auth";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { getServerUri } from "@features/utils/format/strings";
import { useSetRecoilState } from "recoil";

export const Account = () => {
  const { user, logout } = useAuth();
  const { clients, client } = useClients();
  const setMenu = useSetRecoilState(DropDownAtom);

  return (
    <div className="absolute top-0 w-full pt-6 pb-3 bg-wood-50 dark:bg-wood-990">
      <Link
        noColor
        to={getRoute(ROUTES.Account)}
        className="w-20 flex items-center justify-center"
        onMouseEnter={(e: any) => {
          setMenu({
            target: e.currentTarget,
            position: "right",
            menu: [
              {
                type: "label",
                label: (
                  <div className="flex flex-row px-2 py-1 space-x-3 justify-center items-center">
                    <Avatar
                      size={8}
                      fallback={user?.full_name || ""}
                      avatar={getServerUri(user?.preferences?.avatar) || ""}
                    />
                    <div className="flex flex-col flex grow">
                      <Base>{user?.full_name}</Base>
                      <Info>{user?.email}</Info>
                    </div>
                  </div>
                ),
              },
              {
                label: "Préférence et profil",
                to: getRoute(ROUTES.AccountProfile),
              },
              {
                label: "Sécurité",
                to: getRoute(ROUTES.AccountSecurity),
              },
              {
                type: "divider",
              },
              ...clients.map((c) => ({
                to: getRoute(ROUTES.Home, { client: c.client.id }),
                label: (
                  <div className="flex flex-row items-center justify-center space-x-2">
                    <Avatar
                      shape="square"
                      size={5}
                      fallback={c.client?.company?.name || ""}
                      avatar={getServerUri(c.client?.preferences?.logo) || ""}
                    />
                    <div className="grow">{c.client.company.name}</div>
                  </div>
                ),
              })),
              {
                label: "Gérer mes entreprise",
                to: getRoute(ROUTES.AccountClients),
              },
              {
                type: "divider",
              },
              {
                type: "danger",
                label: "Se déconnecter",
                onClick: () => logout(),
              },
            ],
          });
        }}
      >
        <Avatar
          size={8}
          shape="square"
          fallback={client?.client?.company?.name || ""}
          avatar={getServerUri(client?.client?.preferences?.logo) || ""}
        />
      </Link>
    </div>
  );
};
