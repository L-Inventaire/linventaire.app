import { Button } from "@atoms/button/button";
import Link from "@atoms/link";
import { Info, SectionSmall, Title } from "@atoms/text";
import { AnimatedBackground } from "@components/animated-background";
import SingleCenterCard from "@components/single-center-card/single-center-card";
import { useAuth } from "@features/auth/state/use-auth";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import {
  useClientInvitations,
  useClients,
} from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { NewClientForm } from "./create";
import { JoinCompany } from "./join";

export const NoClientView = () => {
  const { user, logout } = useAuth();
  const [create, setCreate] = useState(false);
  const { clients } = useClients();
  const navigate = useNavigate();

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
                <Title>You joined {clients?.[0]?.client?.company?.name}!</Title>
                <Info className="block mb-2 mt-2">
                  You can continue to L'inventaire, everything is ready
                </Info>
                <Button
                  size="md"
                  theme="primary"
                  onClick={() =>
                    navigate(
                      getRoute(ROUTES.Home, {
                        client: clients?.[0]?.client?.id,
                      })
                    )
                  }
                >
                  Open {clients?.[0]?.client?.company?.name}
                </Button>
              </>
            )}

            <div className="mt-4">
              <JoinCompany />

              <div className="my-4" />

              <SectionSmall className="block mb-2">
                Create my company
              </SectionSmall>
              <Info className="block mb-2">
                Your company also need to be created on L'inventaire. Create
                your company and invite your collaborators to join it.
              </Info>
              <Button
                theme={!clients.length ? "primary" : "default"}
                size="sm"
                onClick={() => setCreate(true)}
              >
                New company
              </Button>

              <br />
              <br />
              <Info>
                You are logged in as <b>{user?.email}</b>.<br />
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
