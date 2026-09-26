import { AnimatedBackground } from "@atoms/animated-background";
import { Button } from "@atoms/button/button";
import SingleCenterCard from "@atoms/single-center-card/single-center-card";
import { Info, Title } from "@atoms/text";
import { useAuth } from "@features/auth/state/use-auth";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";

// Shown when the company restricts access by IP and the user is not on an allowed IP
export const IpBlockedView = () => {
  const { logout } = useAuth();
  const { client, clients } = useClients();
  const others = clients.filter(
    (c) => c.client_id !== client?.client_id && !c.ip_blocked,
  );

  return (
    <div className="h-full w-full absolute sm:bg-transparent">
      <SingleCenterCard insetLogo>
        <Title>Accès restreint</Title>
        <Info className="block mb-4 mt-2">
          L'entreprise {client?.client?.company?.name} limite l'accès à
          certaines adresses IP. Votre adresse IP actuelle n'est pas autorisée.
          Contactez un administrateur de l'entreprise pour l'ajouter.
        </Info>
        <div className="space-y-2">
          {others.map((c) => (
            <Button
              key={c.client_id}
              size="md"
              theme="outlined"
              className="w-full"
              onClick={() => {
                document.location = getRoute(ROUTES.Home, {
                  client: c.client_id,
                });
              }}
            >
              Ouvrir {c.client?.company?.name}
            </Button>
          ))}
          <Button
            size="md"
            theme="default"
            className="w-full"
            onClick={() => logout()}
          >
            Se déconnecter
          </Button>
        </div>
      </SingleCenterCard>
      <AnimatedBackground />
    </div>
  );
};
