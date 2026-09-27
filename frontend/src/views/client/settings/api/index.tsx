import InputCopiable from "@atoms/input/input-copiable";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Info } from "@atoms/text";
import Env from "@config/environment";
import { useHasAccess } from "@features/access";
import { useClients } from "@features/clients/state/use-clients";
import { Callout, Heading, Tabs } from "@radix-ui/themes";
import { useState } from "react";
import { Page } from "../../_layout/page";
import { ApiCallsTab } from "./api-calls-tab";
import { ApiKeysTab } from "./api-keys-tab";
import { WebhooksTab } from "./webhooks-tab";

export const ApiPage = () => {
  const { client } = useClients();
  const clientId = client!.client_id;
  const hasAccess = useHasAccess();
  const canUseApi = hasAccess("API_ACCESS");
  const ipRestricted = !!client?.client?.security?.ip_restriction?.enabled;
  const [tab, setTab] = useState("keys");

  return (
    <Page title={[{ label: "Paramètres" }, { label: "API et développeurs" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">API et développeurs</Heading>
        <Info className="mt-2 block">
          Connectez vos outils à L'inventaire grâce à l'API. Une clé API agit en
          votre nom, avec exactement les mêmes permissions que vous, et
          uniquement pour cette entreprise.{" "}
          <a
            href={Env.apiDocs}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Consulter la documentation de l'API
          </a>
          .
        </Info>

        {!canUseApi && (
          <Callout.Root color="orange" className="mt-4">
            <Callout.Text>
              Vous n'avez pas la permission « Accès à l'API et aux webhooks ».
              Demandez-la à un administrateur de l'entreprise : sans elle, vous
              ne pouvez pas créer de clé ni de webhook, et vos clés existantes
              sont refusées.
            </Callout.Text>
          </Callout.Root>
        )}
        {ipRestricted && (
          <Callout.Root color="blue" className="mt-4">
            <Callout.Text>
              La restriction d'accès par adresse IP est active pour cette
              entreprise. Elle s'applique aussi aux clés API et aux webhooks des
              collaborateurs : les appels depuis une adresse non autorisée sont
              refusés et leurs webhooks ne sont plus envoyés. Les
              administrateurs ne sont pas restreints.
            </Callout.Text>
          </Callout.Root>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputLabel
            label="Identifiant de l'entreprise (clientId)"
            input={<InputCopiable readOnly value={clientId} />}
          />
          <InputLabel
            label="Adresse de l'API"
            input={
              <InputCopiable readOnly value={Env.server.replace(/\/$/, "")} />
            }
          />
        </div>

        <Tabs.Root value={tab} onValueChange={setTab} className="mt-8">
          <Tabs.List>
            <Tabs.Trigger value="keys">Clés API</Tabs.Trigger>
            <Tabs.Trigger value="webhooks">Webhooks</Tabs.Trigger>
            <Tabs.Trigger value="calls">Historique des appels</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        <div className="mt-6">
          {tab === "keys" && (
            <ApiKeysTab clientId={clientId} canUseApi={canUseApi} />
          )}
          {tab === "webhooks" &&
            (canUseApi ? (
              <WebhooksTab clientId={clientId} />
            ) : (
              <Info className="block">
                Les webhooks nécessitent la permission « Accès à l'API et aux
                webhooks ».
              </Info>
            ))}
          {tab === "calls" && <ApiCallsTab clientId={clientId} />}
        </div>
      </div>
    </Page>
  );
};
