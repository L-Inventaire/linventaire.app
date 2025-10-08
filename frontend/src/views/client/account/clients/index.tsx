import Avatar from "@atoms/avatar/avatar";
import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Info } from "@atoms/text";
import { Table } from "@molecules/table";
import {
  useClientInvitations,
  useClients,
} from "@features/clients/state/use-clients";
import { getServerUri } from "@features/utils/format/strings";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Heading } from "@radix-ui/themes";
import { Page } from "../../_layout/page";
import { ClientsApiClient } from "@features/clients/api-client/api-client";
import { useAuth } from "@features/auth/state/use-auth";
import toast from "react-hot-toast";
import { ROUTES, getRoute } from "@features/routes";

export const AccountClientsPage = () => {
  const { user } = useAuth();
  const { loading, invitations, accept } = useClientInvitations();
  const { clients, loading: loadingClients } = useClients();

  return (
    <Page title={[{ label: "Compte" }, { label: "Mes Entreprises" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Invitations</Heading>
        {invitations?.length === 0 && !loading && (
          <>
            <Info>Vous n'avez aucune invitation en attente.</Info>
          </>
        )}
        {(invitations?.length > 0 || loading) && (
          <Table
            className="mt-4"
            loading={loading}
            data={invitations}
            columns={[
              {
                render: (c) => (
                  <>
                    <Avatar
                      size={5}
                      shape="square"
                      fallback={c.client.company.name}
                      avatar={getServerUri(c.client.preferences?.logo) || ""}
                      className="mr-2"
                    />
                    {c.client.company.name}
                  </>
                ),
              },
              {
                render: (c) => (
                  <div className="text-right w-full">
                    <Button size="md" onClick={() => accept(c.client_id)}>
                      Accepter
                    </Button>
                    <Button
                      theme="danger"
                      size="md"
                      className="ml-2"
                      onClick={() => accept(c.client_id, false)}
                    >
                      Refuser
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}

        <div className="mt-8">
          <Button
            className="float-right"
            size="sm"
            icon={(p) => <PlusIcon {...p} />}
            to={ROUTES.CreateCompany}
          >
            Créer une entreprise
          </Button>
          <Heading size="6">Entreprises</Heading>
          <Table
            className="mt-4"
            loading={loadingClients}
            data={clients}
            columns={[
              {
                title: "Entreprise",
                render: (c) => (
                  <>
                    <Avatar
                      size={5}
                      shape="square"
                      fallback={c.client.company.name}
                      avatar={getServerUri(c.client.preferences?.logo) || ""}
                      className="mr-2"
                    />
                    {c.client.company.name}
                  </>
                ),
              },
              {
                title: "Actions",
                headClassName: "justify-end",
                render: (c) => (
                  <div className="text-right w-full">
                    {c.roles.list.includes("CLIENT_MANAGE") && (
                      <Button
                        size="md"
                        theme="outlined"
                        className="mr-2"
                        to={getRoute(ROUTES.Settings, { client: c.client_id })}
                      >
                        Gérer
                      </Button>
                    )}
                    <ButtonConfirm
                      size="md"
                      theme="danger"
                      onClick={async () => {
                        try {
                          await ClientsApiClient.removeUser(
                            c.client_id,
                            user?.id || ""
                          );
                          document.location.reload();
                        } catch (e) {
                          console.error(e);
                          toast.error(
                            "Vous ne pouvez pas quitter cette entreprise."
                          );
                        }
                      }}
                    >
                      Quitter l'entreprise
                    </ButtonConfirm>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </Page>
  );
};
