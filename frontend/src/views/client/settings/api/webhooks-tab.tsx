import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Checkbox } from "@atoms/input/input-checkbox";
import InputCopiable from "@atoms/input/input-copiable";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Select } from "@atoms/input/input-select";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { BaseSmall, Info } from "@atoms/text";
import Env from "@config/environment";
import { useHasAccess } from "@features/access";
import { useAuth } from "@features/auth/state/use-auth";
import {
  useWebhookDeliveries,
  useWebhookDelivery,
  useWebhooks,
} from "@features/developers/hooks/use-webhooks";
import {
  entityLabel,
  WEBHOOK_ENTITIES,
  WEBHOOK_EVENT_LABELS,
} from "@features/developers/types/entities";
import {
  Webhook,
  WEBHOOK_EVENTS,
  WebhookDelivery,
  WebhookEvent,
} from "@features/developers/types/types";
import { Table } from "@molecules/table";
import { Badge, Callout, Heading } from "@radix-ui/themes";
import _ from "lodash";
import { useState } from "react";
import { CodeBlock, formatDate, HttpStatus, useUserName } from "./utils";

const PER_PAGE = 20;

const webhookStatus = (webhook: Webhook) => {
  if (!webhook.enabled)
    return (
      <Badge color="gray" title={webhook.disabled_reason || ""}>
        {webhook.disabled_reason ? "Désactivé (erreurs)" : "Désactivé"}
      </Badge>
    );
  if (webhook.last_delivery_status === "failed")
    return <Badge color="orange">En erreur</Badge>;
  return <Badge color="green">Actif</Badge>;
};

const deliveryStatus = (delivery: WebhookDelivery) => {
  switch (delivery.status) {
    case "success":
      return <Badge color="green">Livré</Badge>;
    case "failed":
      return <Badge color="red">Échec</Badge>;
    case "sending":
      return <Badge color="blue">Envoi…</Badge>;
    default:
      return <Badge color="orange">Nouvelle tentative</Badge>;
  }
};

type FormValue = {
  id?: string;
  name: string;
  url: string;
  entities: string[];
  events: WebhookEvent[];
};

const emptyForm: FormValue = {
  name: "",
  url: "https://",
  entities: [],
  events: [...WEBHOOK_EVENTS],
};

export const WebhooksTab = ({ clientId }: { clientId: string }) => {
  const { user: me } = useAuth();
  const hasAccess = useHasAccess();
  const isManager = hasAccess("CLIENT_MANAGE");
  const userName = useUserName(clientId);

  const {
    webhooks,
    create,
    update,
    remove,
    rotateSecret,
    test,
    saving,
    testing,
  } = useWebhooks(clientId, { all: isManager });

  const [form, setForm] = useState<FormValue | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedWebhook = webhooks.find((w) => w.id === selected);

  const save = async () => {
    if (!form) return;
    const body = _.pick(form, ["name", "url", "entities", "events"]);
    if (form.id) {
      await update({ id: form.id, ...body });
    } else {
      const created = await create(body);
      setSecret(created.secret);
      setSelected(created.id);
    }
    setForm(null);
  };

  return (
    <>
      <Modal open={!!form} onClose={() => setForm(null)}>
        <ModalContent
          title={form?.id ? "Modifier le webhook" : "Nouveau webhook"}
        >
          {form && (
            <WebhookForm
              value={form}
              onChange={setForm}
              onSave={save}
              saving={saving}
            />
          )}
        </ModalContent>
      </Modal>

      <Modal open={!!secret} onClose={() => setSecret(null)}>
        <ModalContent title="Secret de signature">
          <div className="space-y-4">
            <Callout.Root color="orange">
              <Callout.Text>
                Copiez ce secret maintenant, il ne sera plus affiché. Il permet
                de vérifier que les appels reçus viennent bien de L'inventaire
                (en-tête <code>X-Linventaire-Signature</code>).
              </Callout.Text>
            </Callout.Root>
            <InputCopiable readOnly value={secret || ""} />
            <Button className="w-full" onClick={() => setSecret(null)}>
              J'ai copié le secret
            </Button>
          </div>
        </ModalContent>
      </Modal>

      <div className="flex items-center justify-between mb-2">
        <Heading size="4">Webhooks</Heading>
        <Button size="sm" onClick={() => setForm({ ...emptyForm })}>
          Nouveau webhook
        </Button>
      </div>
      <Info className="block mb-4">
        Recevez un appel HTTP sur votre serveur à chaque création, modification
        ou suppression d'un document. Seuls les documents auxquels le créateur
        du webhook a accès sont envoyés. Voir la{" "}
        <a
          href={Env.apiDocs + "#description/webhooks"}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          documentation des webhooks
        </a>
        .
      </Info>

      {webhooks.length ? (
        <Table
          rowIndex="id"
          data={webhooks}
          onClick={(webhook) =>
            setSelected(selected === webhook.id ? null : webhook.id)
          }
          cellClassName={(webhook) =>
            webhook.id === selected ? "bg-blue-50 dark:bg-blue-950" : ""
          }
          columns={[
            {
              title: "Nom",
              render: (webhook) => (
                <div>
                  <div>{webhook.name}</div>
                  <BaseSmall className="text-gray-500 break-all">
                    {webhook.url}
                  </BaseSmall>
                </div>
              ),
            },
            ...(isManager && webhooks.some((w) => w.user_id !== me?.id)
              ? [
                  {
                    title: "Utilisateur",
                    render: (webhook: Webhook) => userName(webhook.user_id),
                  },
                ]
              : []),
            {
              title: "Documents",
              render: (webhook) => (
                <BaseSmall>
                  {webhook.entities.map(entityLabel).join(", ")}
                </BaseSmall>
              ),
            },
            {
              title: "Dernier envoi",
              render: (webhook) =>
                formatDate(webhook.last_delivery_at, "Jamais"),
            },
            {
              title: "Statut",
              render: (webhook) => webhookStatus(webhook),
            },
            {
              title: "Actions",
              thClassName: "w-1",
              render: (webhook) => (
                <div
                  className="flex gap-1 justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    theme="outlined"
                    loading={testing}
                    onClick={() => test(webhook.id)}
                  >
                    Tester
                  </Button>
                  <Button
                    size="sm"
                    theme="outlined"
                    onClick={() =>
                      setForm({
                        id: webhook.id,
                        ..._.pick(webhook, [
                          "name",
                          "url",
                          "entities",
                          "events",
                        ]),
                      })
                    }
                  >
                    Modifier
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <BaseSmall className="block text-gray-500">
          Aucun webhook pour le moment.
        </BaseSmall>
      )}

      {selectedWebhook && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <Heading size="4">Envois de « {selectedWebhook.name} »</Heading>
            <div className="flex gap-1">
              <Button
                size="sm"
                theme="outlined"
                onClick={() =>
                  update({
                    id: selectedWebhook.id,
                    enabled: !selectedWebhook.enabled,
                  })
                }
              >
                {selectedWebhook.enabled ? "Désactiver" : "Réactiver"}
              </Button>
              <ButtonConfirm
                size="sm"
                theme="outlined"
                confirmTitle="Générer un nouveau secret ?"
                confirmMessage="L'ancien secret cessera immédiatement de fonctionner, pensez à mettre à jour votre serveur."
                confirmButtonText="Générer"
                onClick={async () =>
                  setSecret((await rotateSecret(selectedWebhook.id)).secret)
                }
              >
                Nouveau secret
              </ButtonConfirm>
              <ButtonConfirm
                size="sm"
                theme="danger"
                confirmTitle="Supprimer le webhook ?"
                confirmMessage="Le webhook et son historique d'envois seront supprimés."
                confirmButtonTheme="danger"
                confirmButtonText="Supprimer"
                onClick={async () => {
                  await remove(selectedWebhook.id);
                  setSelected(null);
                }}
              >
                Supprimer
              </ButtonConfirm>
            </div>
          </div>
          {selectedWebhook.disabled_reason && !selectedWebhook.enabled && (
            <Callout.Root color="orange" className="mb-4">
              <Callout.Text>
                Ce webhook a été désactivé automatiquement :{" "}
                {selectedWebhook.disabled_reason}. Corrigez votre serveur puis
                réactivez-le.
              </Callout.Text>
            </Callout.Root>
          )}
          <WebhookDeliveries clientId={clientId} webhook={selectedWebhook} />
        </div>
      )}
    </>
  );
};

const WebhookForm = ({
  value,
  onChange,
  onSave,
  saving,
}: {
  value: FormValue;
  onChange: (value: FormValue) => void;
  onSave: () => void;
  saving: boolean;
}) => {
  const toggle = <T,>(list: T[], item: T, checked: boolean) =>
    checked ? _.uniq([...list, item]) : list.filter((i) => i !== item);

  return (
    <div className="space-y-4">
      <InputLabel
        label="Nom"
        input={
          <Input
            placeholder="Ex. Synchronisation CRM"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        }
      />
      <InputLabel
        label="URL"
        input={
          <Input
            placeholder="https://exemple.com/webhooks/linventaire"
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
          />
        }
      />
      <InputLabel
        label="Documents"
        input={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {WEBHOOK_ENTITIES.map((entity) => (
              <Checkbox
                key={entity.table}
                label={entity.label}
                value={value.entities.includes(entity.table)}
                onChange={(checked) =>
                  onChange({
                    ...value,
                    entities: toggle(value.entities, entity.table, checked),
                  })
                }
              />
            ))}
          </div>
        }
      />
      <InputLabel
        label="Événements"
        input={
          <div className="flex gap-4">
            {WEBHOOK_EVENTS.map((event) => (
              <Checkbox
                key={event}
                label={WEBHOOK_EVENT_LABELS[event]}
                value={value.events.includes(event)}
                onChange={(checked) =>
                  onChange({
                    ...value,
                    events: toggle(value.events, event, checked),
                  })
                }
              />
            ))}
          </div>
        }
      />
      <Button
        className="w-full"
        loading={saving}
        disabled={
          !value.name.trim() ||
          !value.url.trim() ||
          !value.entities.length ||
          !value.events.length
        }
        onClick={onSave}
      >
        Enregistrer
      </Button>
    </div>
  );
};

const WebhookDeliveries = ({
  clientId,
  webhook,
}: {
  clientId: string;
  webhook: Webhook;
}) => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<string | null>(null);
  const { deliveries, total, loading, retry, retrying } = useWebhookDeliveries(
    clientId,
    webhook.id,
    { status, limit: PER_PAGE, offset: (page - 1) * PER_PAGE },
  );

  return (
    <>
      <DeliveryModal
        clientId={clientId}
        webhookId={webhook.id}
        deliveryId={opened}
        onClose={() => setOpened(null)}
        onRetry={(id) => retry(id)}
        retrying={retrying}
      />
      <div className="flex items-center gap-2 mb-2">
        <Select
          className="w-auto"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les envois</option>
          <option value="success">Livrés</option>
          <option value="pending">En attente de nouvelle tentative</option>
          <option value="failed">En échec</option>
        </Select>
        <BaseSmall className="text-gray-500">
          Conservés 30 jours. Chaque envoi est retenté jusqu'à 8 fois pendant
          environ 24 h.
        </BaseSmall>
      </div>
      <Table
        key={status}
        rowIndex="id"
        data={deliveries}
        loading={loading}
        onClick={(delivery) => setOpened(delivery.id)}
        showPagination="simple"
        total={total}
        initialPagination={{ page: 1, perPage: PER_PAGE }}
        onRequestData={async ({ page }) => setPage(page)}
        columns={[
          {
            title: "Date",
            render: (delivery) => formatDate(delivery.created_at),
          },
          {
            title: "Événement",
            render: (delivery) => (
              <code className="text-sm">{delivery.event}</code>
            ),
          },
          {
            title: "Statut",
            render: (delivery) => deliveryStatus(delivery),
          },
          {
            title: "Réponse",
            render: (delivery) => (
              <div className="flex items-center gap-2">
                <HttpStatus status={delivery.response_status} />
                {delivery.error && !delivery.response_status && (
                  <BaseSmall className="text-gray-500 truncate max-w-48">
                    {delivery.error}
                  </BaseSmall>
                )}
              </div>
            ),
          },
          {
            title: "Tentatives",
            render: (delivery) => delivery.attempts,
          },
          {
            title: "Prochaine tentative",
            render: (delivery) =>
              delivery.status === "pending"
                ? formatDate(delivery.next_attempt_at)
                : "-",
          },
        ]}
      />
    </>
  );
};

const DeliveryModal = ({
  clientId,
  webhookId,
  deliveryId,
  onClose,
  onRetry,
  retrying,
}: {
  clientId: string;
  webhookId: string;
  deliveryId: string | null;
  onClose: () => void;
  onRetry: (id: string) => Promise<unknown>;
  retrying: boolean;
}) => {
  const { data: delivery, refetch } = useWebhookDelivery(
    clientId,
    webhookId,
    deliveryId,
  );
  return (
    <Modal open={!!deliveryId} onClose={onClose} className="sm:!max-w-3xl">
      <ModalContent title="Détail de l'envoi">
        {delivery && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-sm">{delivery.event}</code>
              {deliveryStatus(delivery)}
              <BaseSmall className="text-gray-500">
                {formatDate(delivery.created_at)} · {delivery.attempts}{" "}
                tentative{delivery.attempts > 1 ? "s" : ""}
              </BaseSmall>
              <div className="grow" />
              <Button
                size="sm"
                theme="outlined"
                loading={retrying}
                onClick={async () => {
                  await onRetry(delivery.id);
                  refetch();
                }}
              >
                Renvoyer maintenant
              </Button>
            </div>

            <div>
              <BaseSmall className="font-medium block mb-1">
                Tentatives
              </BaseSmall>
              <Table
                rowIndex="at"
                data={[...(delivery.attempts_log?.list || [])].reverse()}
                columns={[
                  {
                    title: "Date",
                    render: (attempt) => (
                      <>
                        {formatDate(attempt.at)}
                        {attempt.manual && (
                          <Badge color="gray" className="ml-2">
                            Manuel
                          </Badge>
                        )}
                      </>
                    ),
                  },
                  {
                    title: "Réponse",
                    render: (attempt) => <HttpStatus status={attempt.status} />,
                  },
                  {
                    title: "Durée",
                    render: (attempt) => `${attempt.duration_ms} ms`,
                  },
                  {
                    title: "Erreur",
                    render: (attempt) => (
                      <BaseSmall className="break-all">
                        {attempt.error || "-"}
                      </BaseSmall>
                    ),
                  },
                ]}
              />
            </div>

            {delivery.attempts_log?.list?.length ? (
              <div>
                <BaseSmall className="font-medium block mb-1">
                  Dernière réponse reçue
                </BaseSmall>
                <CodeBlock
                  value={_.last(delivery.attempts_log.list)?.response_body}
                />
              </div>
            ) : null}

            <div>
              <BaseSmall className="font-medium block mb-1">
                Contenu envoyé
              </BaseSmall>
              <CodeBlock value={delivery.payload} />
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};
