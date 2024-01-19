import Avatar from "@atoms/avatar/avatar";
import { Button } from "@atoms/button/button";
import Link from "@atoms/link";
import { Base, Info, SectionSmall, Title } from "@atoms/text";
import { AnimatedBackground } from "@components/animated-background";
import SingleCenterCard from "@components/single-center-card/single-center-card";
import { Table } from "@components/table";
import {
  useClientInvitations,
  useClients,
} from "@features/clients/state/use-clients";
import { useState } from "react";
import { NewClientForm } from "./create";
import toast from "react-hot-toast";
import { useAuth } from "@features/auth/state/use-auth";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@features/routes";

export const NoClientView = () => {
  const { user, logout } = useAuth();
  const [create, setCreate] = useState(false);

  const navigate = useNavigate();

  const {
    invitations,
    refresh,
    accept: acceptInvitation,
    loading,
  } = useClientInvitations();
  const { clients, refresh: refreshClients } = useClients();

  const accept = async (clientId: string, accept: boolean) => {
    await acceptInvitation(clientId, accept);
    await refreshClients();
  };

  return (
    <div className="h-full w-full absolute sm:bg-transparent">
      <SingleCenterCard insetLogo>
        {!create && (
          <>
            {clients.length === 0 && (
              <Title>Oh! You do not belong to any company yet.</Title>
            )}
            {clients.length > 0 && (
              <>
                <Title>You joined a company!</Title>
                <Info className="block mb-2 mt-2">
                  You can continue to Lydim
                </Info>
                <Button
                  size="sm"
                  theme="primary"
                  onClick={() => navigate(ROUTES.Home)}
                >
                  Open Lydim
                </Button>
              </>
            )}

            <div className="mt-4">
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
                              <Base className="block">
                                {i.client.company.name}
                              </Base>
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

              <div className="my-4" />

              <SectionSmall className="block mb-2">
                Create my company
              </SectionSmall>
              <Info className="block mb-2">
                Your company also need to be created on Lydim. Create your
                company and invite your collaborators to join it.
              </Info>
              <Button onClick={() => setCreate(true)}>New company</Button>

              <br />
              <br />
              <Info>
                You are logged in as <b>{user?.email}</b>.{" "}
                <Link onClick={logout}>Logout ?</Link>
              </Info>
            </div>
          </>
        )}

        {create && <NewClientForm onClose={() => setCreate(false)} />}
      </SingleCenterCard>
      <AnimatedBackground />
    </div>
  );
};
