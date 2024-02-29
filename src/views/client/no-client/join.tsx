import Avatar from "@atoms/avatar/avatar";
import { Button } from "@atoms/button/button";
import Link from "@atoms/link";
import { Base, Info, SectionSmall } from "@atoms/text";
import { Table } from "@components/table";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import {
  useClientInvitations,
  useClients,
} from "@features/clients/state/use-clients";
import toast from "react-hot-toast";
import { useSetRecoilState } from "recoil";

export const JoinCompany = () => {
  const setAfterSignUpOrNewCompany = useSetRecoilState(
    DidCreateCompanyOrSignupAtom
  );

  const {
    invitations,
    refresh,
    accept: acceptInvitation,
    loading,
  } = useClientInvitations();
  const { clients, refresh: refreshClients } = useClients();

  const accept = async (clientId: string, accept: boolean) => {
    setAfterSignUpOrNewCompany(true);
    await acceptInvitation(clientId, accept);
    await refreshClients();
  };

  return (
    <>
      <SectionSmall className="block mb-2">Invitations</SectionSmall>
      <Info>
        {!!invitations.length && (
          <Table
            showPagination={false}
            useResponsiveMode={false}
            data={invitations}
            loading={loading}
            columns={[
              {
                render: (i) => (
                  <div className="flex flex-row items-center">
                    <Avatar
                      className="mr-2"
                      size={11}
                      fallback={i.client.company.name}
                      avatar={i.client.preferences.logo}
                    />
                    <div className="grow">
                      <Base className="block">{i.client.company.name}</Base>
                      <Info>{i.client.company.legal_name}</Info>
                    </div>
                  </div>
                ),
              },
              {
                cellClassName: "justify-end",
                render: (i) => (
                  <>
                    <Button
                      size="sm"
                      loading={loading}
                      onClick={() => accept(i.client_id, true)}
                    >
                      Join
                    </Button>
                    <Button
                      size="sm"
                      theme="default"
                      className="ml-2"
                      loading={loading}
                      onClick={() => accept(i.client_id, false)}
                    >
                      Refuse
                    </Button>
                  </>
                ),
              },
            ]}
          />
        )}
        {!invitations.length &&
          clients.length === 0 &&
          "Nobody invited you to join their company."}
        {!invitations.length &&
          clients.length > 0 &&
          "No other invitation to display."}
        <Link
          className="block mt-2"
          onClick={() => {
            refresh();
            toast.success("Invitations refreshed");
          }}
        >
          Refresh
        </Link>
      </Info>
    </>
  );
};
