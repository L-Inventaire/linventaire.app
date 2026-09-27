import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import Link from "@atoms/link";
import { Info } from "@atoms/text";
import { ClientsApiClient } from "@features/clients/api-client/api-client";
import { useClients } from "@features/clients/state/use-clients";
import { Heading } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const IP_ENTRY =
  /^(\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?|[0-9a-fA-F:.]*:[0-9a-fA-F:.]*(\/\d{1,3})?)$/;

const parseList = (value: string) =>
  value
    .split(/[\s,;]+/)
    .map((a) => a.trim())
    .filter(Boolean);

// Only owners (CLIENT_MANAGE) can see and edit this section, and they are never restricted
export const IpRestrictionSettings = () => {
  const { client: clientUser, update, loading } = useClients();
  const restriction = clientUser?.client?.security?.ip_restriction;

  const [enabled, setEnabled] = useState(false);
  const [allowedIps, setAllowedIps] = useState("");
  const [myIp, setMyIp] = useState("");

  useEffect(() => {
    ClientsApiClient.getMyIp().then(setMyIp).catch(console.error);
  }, []);

  useEffect(() => {
    setEnabled(!!restriction?.enabled);
    setAllowedIps((restriction?.allowed_ips || []).join(", "));
  }, [restriction?.enabled, restriction?.allowed_ips?.join(",")]);

  const list = parseList(allowedIps);
  const invalid = list.filter((ip) => !IP_ENTRY.test(ip));

  return (
    <div className="mt-8 mb-8">
      <Heading size="6" className="mb-2">
        Restriction d'accès par adresse IP
      </Heading>
      <Info className="block mb-4">
        Lorsque cette option est activée, les collaborateurs ne peuvent accéder
        à l'entreprise que depuis les adresses IP autorisées. Les
        administrateurs ne sont jamais restreints.
        {myIp && (
          <>
            {" "}
            Votre adresse IP actuelle est <b>{myIp}</b>.
          </>
        )}
      </Info>

      <Checkbox
        label="Restreindre l'accès aux adresses IP autorisées"
        value={enabled}
        onChange={setEnabled}
        disabled={loading}
      />

      {enabled && (
        <>
          <InputLabel
            className="mt-4 max-w-xl"
            label="Adresses IP autorisées (séparées par des virgules, plages CIDR acceptées)"
            input={
              <Input
                placeholder="203.0.113.10, 198.51.100.0/24, 2001:db8::/32"
                value={allowedIps}
                disabled={loading}
                onChange={(e) => setAllowedIps(e.target.value)}
              />
            }
          />
          {myIp && !list.includes(myIp) && !loading && (
            <Link
              className="text-sm mt-1 inline-block"
              onClick={() => setAllowedIps([...list, myIp].join(", "))}
            >
              Ajouter mon adresse IP ({myIp})
            </Link>
          )}
          {!!invalid.length && (
            <Info className="block mt-1 text-red-500">
              Adresses invalides : {invalid.join(", ")}
            </Info>
          )}
          {!list.length && (
            <Info className="block mt-1 text-orange-500">
              Aucune adresse autorisée : seuls les administrateurs pourront
              accéder à l'entreprise.
            </Info>
          )}
        </>
      )}

      <div className="mt-4">
        <Button
          size="md"
          loading={loading}
          disabled={!!invalid.length}
          onClick={async () => {
            if (!clientUser) return;
            try {
              await update(clientUser.client_id, {
                security: {
                  ip_restriction: { enabled, allowed_ips: list },
                },
              });
            } catch (e: any) {
              console.error(e);
              toast.error("Erreur lors de l'enregistrement");
            }
          }}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
};
