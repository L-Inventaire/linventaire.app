import Avatar from "@atoms/avatar/avatar";
import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Info, Section } from "@atoms/text";
import { Table } from "@components/table";
import {
  useClientInvitations,
  useClients,
} from "@features/clients/state/use-clients";
import { getServerUri } from "@features/utils/format/strings";
import { PlusIcon } from "@heroicons/react/outline";
import { Page, PageBlock } from "../../_layout/page";

export const AccountClientsPage = () => {
  const { loading, invitations, accept } = useClientInvitations();
  const { clients, loading: loadingClients } = useClients();

  return (
    <Page title={[{ label: "Compte" }, { label: "Mes Entreprises" }]}>
      <PageBlock>
        <Section>Invitations</Section>
        {invitations?.length === 0 && !loading && (
          <>
            <Info>Vous n'avez aucune invitation en attente.</Info>
          </>
        )}
        {(invitations?.length > 0 || loading) && (
          <Table
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
                    <Button size="sm" onClick={() => accept(c.client_id)}>
                      Accepter
                    </Button>
                    <Button
                      theme="danger"
                      size="sm"
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
      </PageBlock>

      <PageBlock>
        <Button
          className="float-right"
          size="sm"
          icon={(p) => <PlusIcon {...p} />}
        >
          Créer une entreprise
        </Button>
        <Section>Entreprises</Section>
        <Table
          loading={loadingClients}
          data={clients}
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
          ]}
        />
      </PageBlock>
    </Page>
  );
};
