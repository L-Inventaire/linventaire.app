import Avatar from "@atoms/avatar/avatar";
import { DropDownAtom } from "@atoms/dropdown";
import Link from "@atoms/link";
import { Base, Info } from "@atoms/text";
import { useAuth } from "@features/auth/state/use-auth";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { getServerUri } from "@features/utils/format/strings";
import { useSetRecoilState } from "recoil";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

export const Account = () => {
  const { user, logout } = useAuth();
  const { clients, client } = useClients();
  const setMenu = useSetRecoilState(DropDownAtom);

  return (
    <Link
      noColor
      className="py-px px-2 h-7 w-60 rounded text-black bg-black bg-opacity-0 hover:bg-opacity-5 active:bg-opacity-10 cursor-pointer flex items-center space-x-2"
      onClick={(e: any) => {
        setMenu({
          target: e.currentTarget,
          position: "bottom",
          menu: [
            {
              type: "label",
              label: (
                <div className="flex flex-row px-2 pt-2 pb-1 space-x-3 justify-center items-center">
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
              type: "divider",
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
              label: "Entreprises et invitations",
              to: getRoute(ROUTES.AccountClients),
            },
            {
              type: "divider",
            },
            {
              type: "danger",
              label: "Se déconnecter",
              onClick: () => logout(false, true),
            },
          ],
        });
      }}
    >
      <Avatar
        className="-ml-0.5 -mr-px"
        size={5}
        shape="square"
        fallback={client?.client?.company?.name || ""}
        avatar={getServerUri(client?.client?.preferences?.logo) || ""}
      />
      <Base className="mt-px font-semibold">
        {client?.client?.company?.name || "Chargement..."}
      </Base>
      <ChevronUpDownIcon className="w-4 h-4 !ml-0" />
    </Link>
  );
};
