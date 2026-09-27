import { WEBHOOK_EVENTS } from "../entities/webhooks";
import { DocumentedEntity } from "./entities";

// Documentation of the webhooks: guide, management endpoints and events payloads

export const WEBHOOKS_DESCRIPTION = `
## Webhooks

Un webhook appelle votre serveur (\`POST\`, corps JSON) à chaque création, modification ou suppression d'un document. Créez-les depuis **Paramètres → API et développeurs → Webhooks**, ou avec les routes \`/webhooks\` de cette API.

- Seuls les documents que le créateur du webhook peut lire sont envoyés (mêmes permissions que l'utilisateur).
- Événements : \`{table}.created\`, \`{table}.updated\` (avec \`previous_data\`) et \`{table}.deleted\`, plus \`ping\` pour les tests.
- Répondez avec un statut \`2xx\` en moins de 10 secondes. Les redirections ne sont pas suivies.
- En cas d'échec, l'envoi est retenté après 1 min, 5 min, 15 min, 1 h, 3 h, 6 h et 12 h (8 tentatives en tout). Après 20 envois en échec d'affilée, le webhook est désactivé.
- Un même événement peut arriver plusieurs fois ou dans le désordre : utilisez \`id\` pour ignorer les doublons et \`data.updated_at\` pour ne garder que la version la plus récente.
- L'historique des envois (réponse reçue, nombre de tentatives) est conservé 30 jours.

### Vérifier la signature

Chaque envoi contient l'en-tête \`X-Linventaire-Signature: t={timestamp},v1={signature}\` où \`signature\` est le HMAC SHA-256, en hexadécimal, de \`{timestamp}.{corps brut}\` avec le secret du webhook (\`whsec_...\`, affiché à la création).

\`\`\`js
import crypto from "crypto";

// rawBody : le corps de la requête tel que reçu, avant tout parsing JSON
export const isValidSignature = (header, rawBody, secret) => {
  const { t, v1 } = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${t}.\${rawBody}\`)
    .digest("hex");
  const recent = Math.abs(Date.now() / 1000 - Number(t)) < 5 * 60;
  return (
    recent &&
    v1?.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
  );
};
\`\`\`

Les en-têtes \`X-Linventaire-Event\` et \`X-Linventaire-Delivery\` contiennent le nom de l'événement et l'identifiant de l'envoi.
`.trim();

type JsonSchema = { [key: string]: any };

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const webhookProperties = (tables: string[]) => ({
  name: { type: "string", description: "Nom affiché dans l'application." },
  url: {
    type: "string",
    format: "uri",
    description:
      "Adresse appelée, en https. Les adresses privées ou internes sont refusées.",
  },
  entities: {
    type: "array",
    items: { type: "string", enum: tables },
    description: "Tables écoutées.",
  },
  events: {
    type: "array",
    items: { type: "string", enum: [...WEBHOOK_EVENTS] },
    description: "Actions écoutées, toutes par défaut.",
  },
  enabled: { type: "boolean", default: true },
});

export const webhooksSchemas = (
  entities: DocumentedEntity[]
): { [name: string]: JsonSchema } => {
  const tables = entities.map((e) => e.definition.name);
  return {
    WebhookInput: {
      type: "object",
      required: ["name", "url", "entities"],
      properties: webhookProperties(tables),
    },
    WebhookUpdate: {
      type: "object",
      properties: webhookProperties(tables),
    },
    Webhook: {
      type: "object",
      properties: {
        id: { type: "string" },
        client_id: { type: "string" },
        user_id: {
          type: "string",
          description:
            "Créateur du webhook, seuls les documents qu'il peut lire sont envoyés.",
        },
        ...webhookProperties(tables),
        disabled_reason: {
          type: ["string", "null"],
          description: "Raison de la désactivation automatique.",
        },
        consecutive_failures: { type: "integer" },
        last_delivery_at: { type: ["integer", "null"] },
        last_delivery_status: {
          type: ["string", "null"],
          enum: ["success", "failed", null],
        },
        created_at: { type: "integer" },
        updated_at: { type: "integer" },
      },
    },
    WebhookWithSecret: {
      allOf: [
        ref("Webhook"),
        {
          type: "object",
          properties: {
            secret: {
              type: "string",
              description:
                "Secret de signature (`whsec_...`), retourné uniquement à la création et lors de son renouvellement.",
            },
          },
        },
      ],
    },
    WebhookAttempt: {
      type: "object",
      properties: {
        at: { type: "integer" },
        status: {
          type: ["integer", "null"],
          description: "Statut HTTP reçu, null si la requête a échoué.",
        },
        duration_ms: { type: "integer" },
        error: { type: ["string", "null"] },
        response_body: {
          type: ["string", "null"],
          description: "Début de la réponse reçue (2 Ko).",
        },
        manual: {
          type: "boolean",
          description: "Tentative relancée manuellement.",
        },
      },
    },
    WebhookDelivery: {
      type: "object",
      properties: {
        id: { type: "string" },
        webhook_id: { type: "string" },
        event: { type: "string", examples: ["invoices.updated"] },
        entity_table: { type: ["string", "null"] },
        entity_id: { type: ["string", "null"] },
        status: {
          type: "string",
          enum: ["pending", "sending", "success", "failed"],
          description:
            "`pending` : en attente d'une nouvelle tentative, `failed` : abandonné après la dernière tentative.",
        },
        attempts: { type: "integer", description: "Nombre de tentatives." },
        next_attempt_at: { type: ["integer", "null"] },
        last_attempt_at: { type: ["integer", "null"] },
        response_status: { type: ["integer", "null"] },
        duration_ms: { type: ["integer", "null"] },
        error: { type: ["string", "null"] },
        created_at: { type: "integer" },
        completed_at: { type: ["integer", "null"] },
      },
    },
    WebhookDeliveryDetails: {
      allOf: [
        ref("WebhookDelivery"),
        {
          type: "object",
          properties: {
            payload: {
              type: "object",
              description: "Corps envoyé au webhook.",
            },
            attempts_log: {
              type: "object",
              properties: {
                list: { type: "array", items: ref("WebhookAttempt") },
              },
            },
          },
        },
      ],
    },
  };
};

const jsonBody = (schema: JsonSchema) => ({
  required: true,
  content: { "application/json": { schema } },
});

const jsonResponse = (description: string, schema: JsonSchema) => ({
  description,
  content: { "application/json": { schema } },
});

export const webhooksPaths = (errorResponses: { [code: string]: any }) => {
  const tag = "Gestion des webhooks";
  const clientId = { $ref: "#/components/parameters/ClientId" };
  const webhookId = {
    name: "webhookId",
    in: "path",
    required: true,
    schema: { type: "string" },
  };
  const deliveryId = {
    name: "deliveryId",
    in: "path",
    required: true,
    schema: { type: "string" },
  };
  const base = "/api/developers/v1/{clientId}/webhooks";
  const managers =
    "\n\nLes utilisateurs ayant la permission `CLIENT_MANAGE` peuvent gérer tous les webhooks de l'entreprise, les autres uniquement les leurs.";

  return {
    [base]: {
      get: {
        tags: [tag],
        operationId: "list_webhooks",
        summary: "Lister les webhooks",
        description:
          "Liste vos webhooks, ou ceux de toute l'entreprise avec `all=1`." +
          managers,
        parameters: [
          clientId,
          { name: "all", in: "query", schema: { type: "string", enum: ["1"] } },
        ],
        responses: {
          "200": jsonResponse("Webhooks.", {
            type: "array",
            items: ref("Webhook"),
          }),
          ...errorResponses,
        },
      },
      post: {
        tags: [tag],
        operationId: "create_webhook",
        summary: "Créer un webhook",
        description:
          "Crée un webhook. Le secret de signature n'est retourné qu'ici, conservez-le.",
        parameters: [clientId],
        requestBody: jsonBody(ref("WebhookInput")),
        responses: {
          "200": jsonResponse("Le webhook créé.", ref("WebhookWithSecret")),
          ...errorResponses,
        },
      },
    },
    [`${base}/{webhookId}`]: {
      get: {
        tags: [tag],
        operationId: "get_webhook",
        summary: "Récupérer un webhook",
        parameters: [clientId, webhookId],
        responses: {
          "200": jsonResponse("Le webhook.", ref("Webhook")),
          ...errorResponses,
        },
      },
      put: {
        tags: [tag],
        operationId: "update_webhook",
        summary: "Modifier un webhook",
        description:
          "Seuls les champs envoyés sont modifiés. Réactiver un webhook (`enabled: true`) remet son compteur d'échecs à zéro." +
          managers,
        parameters: [clientId, webhookId],
        requestBody: jsonBody(ref("WebhookUpdate")),
        responses: {
          "200": jsonResponse("Le webhook modifié.", ref("Webhook")),
          ...errorResponses,
        },
      },
      delete: {
        tags: [tag],
        operationId: "delete_webhook",
        summary: "Supprimer un webhook",
        description: "Supprime le webhook et son historique d'envois.",
        parameters: [clientId, webhookId],
        responses: {
          "200": jsonResponse("Suppression effectuée.", { type: "boolean" }),
          ...errorResponses,
        },
      },
    },
    [`${base}/{webhookId}/rotate-secret`]: {
      post: {
        tags: [tag],
        operationId: "rotate_webhook_secret",
        summary: "Renouveler le secret",
        description: "L'ancien secret cesse immédiatement de fonctionner.",
        parameters: [clientId, webhookId],
        responses: {
          "200": jsonResponse(
            "Le webhook avec son nouveau secret.",
            ref("WebhookWithSecret")
          ),
          ...errorResponses,
        },
      },
    },
    [`${base}/{webhookId}/test`]: {
      post: {
        tags: [tag],
        operationId: "test_webhook",
        summary: "Tester un webhook",
        description:
          "Envoie immédiatement un événement `ping` et retourne le résultat de l'envoi.",
        parameters: [clientId, webhookId],
        responses: {
          "200": jsonResponse("Résultat de l'envoi.", ref("WebhookDelivery")),
          ...errorResponses,
        },
      },
    },
    [`${base}/{webhookId}/deliveries`]: {
      get: {
        tags: [tag],
        operationId: "list_webhook_deliveries",
        summary: "Historique des envois",
        description:
          "Envois des 30 derniers jours, du plus récent au plus ancien.",
        parameters: [
          clientId,
          webhookId,
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["success", "pending", "failed"] },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 100 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          "200": jsonResponse("Envois.", {
            type: "object",
            properties: {
              total: { type: "integer" },
              list: { type: "array", items: ref("WebhookDelivery") },
            },
          }),
          ...errorResponses,
        },
      },
    },
    [`${base}/{webhookId}/deliveries/{deliveryId}`]: {
      get: {
        tags: [tag],
        operationId: "get_webhook_delivery",
        summary: "Détail d'un envoi",
        description: "Contenu envoyé et réponse reçue à chaque tentative.",
        parameters: [clientId, webhookId, deliveryId],
        responses: {
          "200": jsonResponse("L'envoi.", ref("WebhookDeliveryDetails")),
          ...errorResponses,
        },
      },
    },
    [`${base}/{webhookId}/deliveries/{deliveryId}/retry`]: {
      post: {
        tags: [tag],
        operationId: "retry_webhook_delivery",
        summary: "Renvoyer un envoi",
        description:
          "Renvoie immédiatement l'événement, quel que soit son statut.",
        parameters: [clientId, webhookId, deliveryId],
        responses: {
          "200": jsonResponse(
            "Résultat de l'envoi.",
            ref("WebhookDeliveryDetails")
          ),
          ...errorResponses,
        },
      },
    },
  };
};

const schemaName = (table: string) =>
  table
    .split("_")
    .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
    .join("");

// Events received by webhooks, OpenAPI 3.1 "webhooks" section
export const webhooksEvents = (entities: DocumentedEntity[]) => {
  const headers = {
    "X-Linventaire-Signature": {
      description:
        "`t={timestamp},v1={signature}`, voir « Vérifier la signature ».",
      schema: { type: "string" },
    },
    "X-Linventaire-Event": { schema: { type: "string" } },
    "X-Linventaire-Delivery": { schema: { type: "string" } },
  };
  const operation = (
    summary: string,
    description: string,
    schema: JsonSchema
  ) => ({
    post: {
      summary,
      description,
      parameters: Object.entries(headers).map(([name, header]) => ({
        name,
        in: "header",
        required: true,
        ...header,
      })),
      requestBody: jsonBody(schema),
      responses: {
        "2XX": { description: "Envoi reçu." },
      },
    },
  });

  const events: { [name: string]: any } = {
    ping: operation(
      "ping",
      "Envoyé par le bouton « Tester » ou la route `/test`.",
      {
        type: "object",
        properties: {
          id: { type: "string" },
          event: { type: "string", const: "ping" },
          client_id: { type: "string" },
          created_at: { type: "integer" },
          data: {
            type: "object",
            properties: {
              webhook_id: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      }
    ),
  };

  for (const entity of entities) {
    const table = entity.definition.name;
    const name = schemaName(table);
    events[table] = operation(
      `${table}.*`,
      `${entity.title} : \`${table}.created\`, \`${table}.updated\` ou \`${table}.deleted\`.`,
      {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "Identifiant de l'envoi, à utiliser pour ignorer les doublons.",
          },
          event: {
            type: "string",
            enum: WEBHOOK_EVENTS.map((action) => `${table}.${action}`),
          },
          entity: { type: "string", const: table },
          action: { type: "string", enum: [...WEBHOOK_EVENTS] },
          client_id: { type: "string" },
          created_at: {
            type: "integer",
            description: "Date de l'événement (timestamp en millisecondes).",
          },
          data: {
            ...ref(name),
            description:
              "Le document (sa dernière version connue pour `deleted`).",
          },
          previous_data: {
            ...ref(name),
            description:
              "Le document avant la modification, pour `updated` uniquement.",
          },
        },
      }
    );
  }
  return events;
};
