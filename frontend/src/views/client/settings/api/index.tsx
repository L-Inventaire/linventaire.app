import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import InputCopiable from "@atoms/input/input-copiable";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Select } from "@atoms/input/input-select";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { BaseSmall, Info } from "@atoms/text";
import Env from "@config/environment";
import { useHasAccess } from "@features/access";
import { useAuth } from "@features/auth/state/use-auth";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useClients } from "@features/clients/state/use-clients";
import { useApiKeys } from "@features/developers/hooks/use-api-keys";
import { ApiKey, CreatedApiKey } from "@features/developers/types/types";
import { formatTime } from "@features/utils/format/dates";
import { Table } from "@molecules/table";
import { Badge, Callout, Heading } from "@radix-ui/themes";
import { useState } from "react";
import { Page } from "../../_layout/page";

const DAY = 24 * 60 * 60 * 1000;

const expirations = [
  { label: "Jamais", value: 0 },
  { label: "30 jours", value: 30 },
  { label: "90 jours", value: 90 },
  { label: "1 an", value: 365 },
];

const keyStatus = (key: ApiKey) => {
  if (key.revoked_at) return <Badge color="gray">Révoquée</Badge>;
  if (key.expires_at && key.expires_at < Date.now())
    return <Badge color="orange">Expirée</Badge>;
  return <Badge color="green">Active</Badge>;
};

const isActive = (key: ApiKey) =>
  !key.revoked_at && (!key.expires_at || key.expires_at > Date.now());

const date = (value: number | null, fallback = "-") =>
  value ? formatTime(value, { keepDate: true, keepTime: true }) : fallback;

export const ApiPage = () => {
  const { user: me } = useAuth();
  const { client } = useClients();
  const clientId = client!.client_id;
  const hasAccess = useHasAccess();
  const isManager = hasAccess("CLIENT_MANAGE");

  const { keys, create, creating, revoke, revoking } = useApiKeys(clientId);
  const { keys: allKeys } = useApiKeys(isManager ? clientId : "", {
    all: true,
  });
  const { users } = useClientUsers(clientId);

  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState(0);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);

  const userName = (id: string) => {
    const user = users.find((u) => u.user_id === id)?.user as any;
    return user?.full_name || user?.email || id;
  };

  const columns = (withUser: boolean) => [
    {
      title: "Nom",
      render: (key: ApiKey) => key.name,
    },
    ...(withUser
      ? [
          {
            title: "Utilisateur",
            render: (key: ApiKey) => userName(key.user_id),
          },
        ]
      : []),
    {
      title: "Clé",
      render: (key: ApiKey) => (
        <code className="text-sm">{key.key_prefix}…</code>
      ),
    },
    {
      title: "Créée le",
      render: (key: ApiKey) => date(key.created_at),
    },
    {
      title: "Dernière utilisation",
      render: (key: ApiKey) => date(key.last_used_at, "Jamais"),
    },
    {
      title: "Expire le",
      render: (key: ApiKey) => date(key.expires_at, "Jamais"),
    },
    {
      title: "Statut",
      render: (key: ApiKey) => keyStatus(key),
    },
    {
      title: "Actions",
      thClassName: "w-1",
      render: (key: ApiKey) =>
        isActive(key) ? (
          <ButtonConfirm
            size="sm"
            theme="danger"
            loading={revoking}
            confirmTitle="Révoquer la clé ?"
            confirmMessage={`Les applications utilisant la clé "${key.name}" n'auront plus accès à l'API. Cette action est irréversible.`}
            confirmButtonTheme="danger"
            confirmButtonText="Révoquer"
            onClick={() => revoke(key.id)}
          >
            Révoquer
          </ButtonConfirm>
        ) : (
          <></>
        ),
    },
  ];

  return (
    <Page title={[{ label: "Paramètres" }, { label: "API et développeurs" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Modal open={!!createdKey} onClose={() => setCreatedKey(null)}>
          <ModalContent title="Votre nouvelle clé API">
            <div className="space-y-4">
              <Callout.Root color="orange">
                <Callout.Text>
                  Copiez cette clé maintenant, elle ne sera plus jamais
                  affichée. Conservez-la en lieu sûr : elle donne accès à
                  l'entreprise avec les mêmes permissions que vous.
                </Callout.Text>
              </Callout.Root>
              <InputCopiable readOnly value={createdKey?.key || ""} />
              <Button className="w-full" onClick={() => setCreatedKey(null)}>
                J'ai copié la clé
              </Button>
            </div>
          </ModalContent>
        </Modal>

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

        <Heading size="4" className="mt-8 mb-2">
          Créer une clé API
        </Heading>
        <div className="flex flex-col md:flex-row md:items-end gap-2">
          <InputLabel
            className="grow"
            label="Nom"
            input={
              <Input
                placeholder="Ex. Synchronisation site e-commerce"
                value={name}
                disabled={creating}
                onChange={(e) => setName(e.target.value)}
              />
            }
          />
          <InputLabel
            label="Expiration"
            input={
              <Select
                value={expiration}
                disabled={creating}
                onChange={(e) => setExpiration(parseInt(e.target.value))}
              >
                {expirations.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </Select>
            }
          />
          <Button
            loading={creating}
            disabled={!name.trim()}
            onClick={async () => {
              const key = await create({
                name: name.trim(),
                expires_at: expiration ? Date.now() + expiration * DAY : null,
              });
              setName("");
              setExpiration(0);
              setCreatedKey(key);
            }}
          >
            Créer la clé
          </Button>
        </div>

        <Heading size="4" className="mt-8 mb-2">
          Vos clés API
        </Heading>
        {keys.length ? (
          <Table rowIndex="id" data={keys} columns={columns(false)} />
        ) : (
          <BaseSmall className="block text-gray-500">
            Vous n'avez pas encore créé de clé API.
          </BaseSmall>
        )}

        {isManager && allKeys.some((k) => k.user_id !== me?.id) && (
          <>
            <Heading size="4" className="mt-8 mb-2">
              Toutes les clés de l'entreprise
            </Heading>
            <Info className="block mb-2">
              En tant qu'administrateur, vous pouvez révoquer les clés créées
              par vos collaborateurs.
            </Info>
            <Table rowIndex="id" data={allKeys} columns={columns(true)} />
          </>
        )}
      </div>
    </Page>
  );
};
