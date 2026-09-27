import { TableDefinition } from "../../../platform/db/api";
import { DocumentedEntity } from "./entities";
import {
  WEBHOOKS_DESCRIPTION,
  webhooksEvents,
  webhooksPaths,
  webhooksSchemas,
} from "./webhooks";

/**
 * Generates the OpenAPI 3.1 document of the public api from the entities
 * definitions (the same `rest.schema` the REST service uses to validate documents).
 *
 * Typescript metadata (enums, comments) can be added with `metadata`, it is
 * extracted at build time from the sources (see backend/scripts/generate-openapi.ts).
 */

// Extra information about a property, extracted from the typescript sources
export type PropertyMetadata = {
  description?: string;
  enum?: (string | number)[];
  properties?: { [key: string]: PropertyMetadata };
  items?: PropertyMetadata;
};

export type EntitiesMetadata = {
  [table: string]: { [key: string]: PropertyMetadata };
};

type JsonSchema = { [key: string]: any };

type Schema = NonNullable<TableDefinition["rest"]>["schema"];

// Managed by the platform, can't be set through the api
const READ_ONLY = [
  "id",
  "client_id",
  "is_deleted",
  "revisions",
  "restored_from",
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "display_name",
];

// Internal columns never returned by the api
const INTERNAL = ["searchable", "searchable_generated", "comment_id"];

const COMMON_DESCRIPTIONS: { [key: string]: string } = {
  id: "Identifiant unique du document.",
  client_id: "Identifiant de l'entreprise (tenant) propriétaire du document.",
  is_deleted:
    "Le document a été supprimé (corbeille), il peut être restauré avec `/restore`.",
  revisions: "Nombre de modifications du document.",
  restored_from: "Révision depuis laquelle le document a été restauré.",
  created_at: "Date de création (timestamp en millisecondes).",
  created_by: "Utilisateur ayant créé le document.",
  updated_at: "Date de dernière modification (timestamp en millisecondes).",
  updated_by: "Dernier utilisateur ayant modifié le document.",
  display_name: "Libellé du document, généré automatiquement.",
  fields:
    "Valeurs des champs personnalisés (voir l'entité `fields`), indexées par code de champ.",
};

const schemaName = (table: string) =>
  table
    .split("_")
    .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
    .join("");

const typeToJsonSchema = (
  type: any,
  metadata: PropertyMetadata | undefined,
  column?: string
): JsonSchema => {
  let schema: JsonSchema;

  if (Array.isArray(type)) {
    schema = {
      type: "array",
      items: typeToJsonSchema(type[0], metadata?.items),
    };
  } else if (typeof type === "object" && type) {
    schema = objectToJsonSchema(type, metadata?.properties || {});
  } else if (type === "number") {
    schema = { type: "number" };
  } else if (type === "boolean") {
    schema = { type: "boolean" };
  } else if (type === "date") {
    schema = column?.startsWith("BIGINT")
      ? { type: "integer", format: "int64", description: "Timestamp (ms)." }
      : { type: "string", format: "date-time" };
  } else if (typeof type === "string" && type.startsWith("type:")) {
    const target = type.replace(/^type:/, "");
    schema = {
      type: "string",
      description: `Identifiant d'un document \`${target}\`.`,
      "x-reference": target,
    };
  } else {
    schema = { type: "string" };
  }

  if (metadata?.enum?.length && !schema.enum && schema.type !== "array") {
    schema.enum = metadata.enum;
  }
  if (metadata?.description) {
    schema.description = [schema.description, metadata.description]
      .filter(Boolean)
      .join(" ");
  }
  return schema;
};

const objectToJsonSchema = (
  schema: Schema | { [key: string]: any },
  metadata: { [key: string]: PropertyMetadata },
  columns: { [key: string]: string } = {}
): JsonSchema => {
  const properties: { [key: string]: JsonSchema } = {};
  for (const [key, type] of Object.entries(schema || {})) {
    properties[key] = typeToJsonSchema(type, metadata[key], columns[key]);
  }
  return { type: "object", properties };
};

const entitySchemas = (
  entity: DocumentedEntity,
  metadata: EntitiesMetadata
): { read: JsonSchema; write: JsonSchema } => {
  const { definition } = entity;
  const hidden = [...INTERNAL, ...(definition.rest?.hidden || [])];
  const schema = Object.fromEntries(
    Object.entries(definition.rest?.schema || {}).filter(
      ([key]) => !hidden.includes(key)
    )
  );

  const read = objectToJsonSchema(
    schema,
    metadata[definition.name] || {},
    definition.columns
  );
  read.properties.fields = {
    type: "object",
    additionalProperties: true,
  };
  for (const key of Object.keys(read.properties)) {
    if (COMMON_DESCRIPTIONS[key]) {
      read.properties[key].description = COMMON_DESCRIPTIONS[key];
    }
    if (READ_ONLY.includes(key)) read.properties[key].readOnly = true;
  }
  read.properties._label = {
    type: "string",
    readOnly: true,
    description: "Libellé du document (identique à `display_name`).",
  };
  read.description = entity.description;
  read.title = entity.title;

  const write: JsonSchema = {
    type: "object",
    title: entity.title,
    description: `Champs modifiables d'un document \`${definition.name}\`. Les champs inconnus sont ignorés.`,
    properties: Object.fromEntries(
      Object.entries(read.properties).filter(
        ([key]) => !READ_ONLY.includes(key) && key !== "_label"
      )
    ),
  };

  return { read, write };
};

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const jsonBody = (schema: JsonSchema, required = true) => ({
  required,
  content: { "application/json": { schema } },
});

const jsonResponse = (description: string, schema: JsonSchema) => ({
  description,
  content: { "application/json": { schema } },
});

const errorResponses = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "429": { $ref: "#/components/responses/TooManyRequests" },
  "500": { $ref: "#/components/responses/InternalError" },
};

const clientIdParameter = { $ref: "#/components/parameters/ClientId" };
const documentIdParameter = { $ref: "#/components/parameters/DocumentId" };

const entityPaths = (entity: DocumentedEntity) => {
  const table = entity.definition.name;
  const name = schemaName(table);
  const tag = entity.title;
  const base = `/api/rest/v1/{clientId}/${table}`;
  const permissions = (level: "read" | "write" | "manage") =>
    `\n\nPermission requise : \`${entity.permissions[level]}\`.`;

  return {
    [base]: {
      post: {
        tags: [tag],
        operationId: `create_${table}`,
        summary: "Créer",
        description: `Crée un document \`${table}\`.${permissions("write")}`,
        parameters: [clientIdParameter],
        requestBody: jsonBody(ref(`${name}Input`)),
        responses: {
          "200": jsonResponse("Le document créé.", ref(name)),
          ...errorResponses,
        },
      },
    },
    [`${base}/search`]: {
      post: {
        tags: [tag],
        operationId: `search_${table}`,
        summary: "Rechercher",
        description: `Recherche paginée parmi les documents \`${table}\`, voir [Recherche](#description/recherche).${permissions(
          "read"
        )}`,
        parameters: [clientIdParameter],
        requestBody: jsonBody(ref("SearchRequest"), false),
        responses: {
          "200": jsonResponse("Résultats de la recherche.", {
            type: "object",
            required: ["total", "list"],
            properties: {
              total: {
                type: "integer",
                description: "Nombre total de résultats.",
              },
              list: { type: "array", items: ref(name) },
            },
          }),
          ...errorResponses,
        },
      },
    },
    [`${base}/count`]: {
      post: {
        tags: [tag],
        operationId: `count_${table}`,
        summary: "Compter",
        description: `Compte les documents \`${table}\` correspondant à une recherche.${permissions(
          "read"
        )}`,
        parameters: [clientIdParameter],
        requestBody: jsonBody(ref("SearchRequest"), false),
        responses: {
          "200": jsonResponse("Nombre de résultats.", ref("CountResponse")),
          ...errorResponses,
        },
      },
    },
    [`${base}/{id}`]: {
      get: {
        tags: [tag],
        operationId: `get_${table}`,
        summary: "Récupérer",
        description: `Récupère un document \`${table}\` par son identifiant (y compris s'il est supprimé). Une révision passée peut être récupérée avec l'identifiant \`{id}~{revision}\`.${permissions(
          "read"
        )}`,
        parameters: [clientIdParameter, documentIdParameter],
        responses: {
          "200": jsonResponse("Le document.", ref(name)),
          ...errorResponses,
        },
      },
      put: {
        tags: [tag],
        operationId: `update_${table}`,
        summary: "Modifier",
        description: `Modifie un document \`${table}\`. Seuls les champs envoyés sont modifiés.${permissions(
          "write"
        )}`,
        parameters: [clientIdParameter, documentIdParameter],
        requestBody: jsonBody(ref(`${name}Input`)),
        responses: {
          "200": jsonResponse("Le document modifié.", ref(name)),
          ...errorResponses,
        },
      },
      delete: {
        tags: [tag],
        operationId: `delete_${table}`,
        summary: "Supprimer",
        description: `Supprime un document \`${table}\` (suppression logique, il peut être restauré).${permissions(
          "manage"
        )}`,
        parameters: [clientIdParameter, documentIdParameter],
        responses: {
          "200": jsonResponse("Suppression effectuée.", { type: "boolean" }),
          ...errorResponses,
        },
      },
    },
    [`${base}/{id}/restore`]: {
      post: {
        tags: [tag],
        operationId: `restore_${table}`,
        summary: "Restaurer",
        description: `Restaure un document \`${table}\` supprimé, ou une révision passée avec l'identifiant \`{id}~{revision}\`.${permissions(
          "manage"
        )}`,
        parameters: [clientIdParameter, documentIdParameter],
        responses: {
          "200": jsonResponse("Restauration effectuée.", {}),
          ...errorResponses,
        },
      },
    },
    [`${base}/{id}/history`]: {
      get: {
        tags: [tag],
        operationId: `history_${table}`,
        summary: "Historique",
        description: `Liste les révisions passées d'un document \`${table}\`.${permissions(
          "read"
        )}`,
        parameters: [
          clientIdParameter,
          documentIdParameter,
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          "200": jsonResponse("Révisions du document.", {
            type: "object",
            properties: {
              total: { type: "integer" },
              has_more: { type: "boolean" },
              list: { type: "array", items: ref(name) },
            },
          }),
          ...errorResponses,
        },
      },
    },
  };
};

const DESCRIPTION =
  `
API de L'inventaire. Elle donne accès aux mêmes données que l'application, avec **les mêmes permissions que l'utilisateur** propriétaire de la clé.

## Authentification

Créez une clé depuis **Paramètres → API et développeurs** dans l'application. Chaque clé :

- agit au nom de l'utilisateur qui l'a créée, avec exactement ses permissions (si ses droits changent, ceux de la clé aussi) ;
- n'est valable que pour l'entreprise dans laquelle elle a été créée ;
- n'est affichée qu'une seule fois, conservez-la en lieu sûr ;
- peut être révoquée à tout moment.

Envoyez la clé dans l'en-tête \`Authorization\` :

\`\`\`bash
curl https://api.linventaire.app/api/developers/v1/{clientId}/whoami \\
  -H "Authorization: Bearer lin_xxxxxxxx"
\`\`\`

ou dans l'en-tête \`X-Api-Key: lin_xxxxxxxx\`.

Certaines actions liées au compte (connexion, facteurs d'authentification, gestion des clés API, invitations) ne sont pas accessibles avec une clé API.

## Permissions et restrictions

- **Permission « Accès à l'API et aux webhooks »** (\`API_ACCESS\`) : elle est nécessaire pour créer des clés et des webhooks, et pour qu'ils fonctionnent. Un administrateur l'accorde depuis **Paramètres → Vos collaborateurs** ; les administrateurs de l'entreprise l'ont d'office. Si elle est retirée, les clés de l'utilisateur sont refusées (\`401\`) et ses webhooks ne reçoivent plus rien.
- **Restriction par adresse IP** : si l'entreprise limite l'accès à certaines adresses IP, cette limite s'applique aussi aux appels faits avec une clé API (réponse \`403\` hors des adresses autorisées) et aux webhooks des utilisateurs concernés, qui ne sont plus envoyés. Comme dans l'application, les administrateurs ne sont pas restreints.
- Une clé cesse de fonctionner si son propriétaire est retiré de l'entreprise ou désactivé.

## Identifiant d'entreprise

Toutes les routes sont préfixées par l'identifiant de l'entreprise (\`clientId\`), visible dans **Paramètres → API et développeurs**.

## Recherche

Les routes \`/search\` et \`/count\` acceptent une liste de filtres :

\`\`\`json
{
  "query": [
    { "key": "type", "values": [{ "op": "equals", "value": "invoices" }] },
    { "key": "emit_date", "values": [{ "op": "range", "value": [1735689600000, 1767225599000] }] },
    { "key": "query", "values": [{ "op": "equals", "value": "texte libre" }] }
  ],
  "options": { "limit": 25, "offset": 0, "index": "created_at", "asc": false }
}
\`\`\`

- \`key\` : nom du champ (les champs imbriqués utilisent un point, ex. \`business_address.country\`). La clé spéciale \`query\` effectue une recherche plein texte.
- \`op\` : \`equals\`, \`regex\`, \`gte\`, \`lte\` ou \`range\` (valeur \`[min, max]\`).
- \`not: true\` inverse le filtre, \`empty: true\` recherche les valeurs vides.
- \`limit\` est plafonné à 500. Les documents supprimés sont exclus sauf avec \`options.deleted: true\`.

## Limites

Les requêtes sont limitées par adresse IP. Au-delà, l'API répond \`429 Too Many Requests\`.

L'historique de vos appels (statut, durée, contenus) est consultable pendant 30 jours dans **Paramètres → API et développeurs → Historique des appels**.
`.trim() +
  "\n\n" +
  WEBHOOKS_DESCRIPTION;

export const generateOpenApi = (options: {
  entities: DocumentedEntity[];
  metadata?: EntitiesMetadata;
  version: string;
  servers?: { url: string; description?: string }[];
}) => {
  const { entities, metadata = {}, version } = options;

  const schemas: { [key: string]: JsonSchema } = {
    Error: {
      type: "object",
      properties: {
        error: { type: "string" },
        message: { type: "string" },
        id: { type: "string", description: "Identifiant de la requête." },
      },
    },
    SearchQuery: {
      type: "object",
      required: ["key", "values"],
      properties: {
        key: {
          type: "string",
          description:
            "Champ sur lequel filtrer, ou `query` pour une recherche plein texte.",
        },
        not: { type: "boolean", description: "Inverse le filtre." },
        empty: {
          type: "boolean",
          description: "Recherche les valeurs vides (null, listes vides...).",
        },
        values: {
          type: "array",
          items: {
            type: "object",
            required: ["op", "value"],
            properties: {
              op: {
                type: "string",
                enum: ["equals", "regex", "gte", "lte", "range"],
              },
              value: {
                description:
                  "Valeur recherchée, ou `[min, max]` pour l'opérateur `range`.",
              },
            },
          },
        },
      },
    },
    SearchRequest: {
      type: "object",
      properties: {
        query: { type: "array", items: ref("SearchQuery") },
        options: {
          type: "object",
          properties: {
            limit: { type: "integer", default: 25, maximum: 500 },
            offset: { type: "integer", default: 0 },
            index: {
              type: "string",
              description: "Champ utilisé pour le tri.",
            },
            asc: { type: "boolean", description: "Tri croissant." },
            deleted: {
              type: "boolean",
              description: "Inclure les documents supprimés.",
            },
          },
        },
      },
    },
    CountResponse: {
      type: "object",
      properties: {
        total: { type: "integer" },
        list: { type: "array", items: {}, maxItems: 0 },
      },
    },
    WhoAmI: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            full_name: { type: "string" },
            avatar: { type: "string" },
          },
        },
        client_id: { type: "string" },
        client_name: { type: "string" },
        roles: {
          type: "array",
          items: { type: "string" },
          description: "Permissions de l'utilisateur dans cette entreprise.",
        },
        authentication: { type: "string", enum: ["api_key", "session"] },
        api_key_id: { type: ["string", "null"] },
      },
    },
  };

  const tags: { name: string; description: string }[] = [
    {
      name: "Général",
      description: "Vérifier ses accès.",
    },
  ];

  let paths: { [path: string]: any } = {
    "/api/developers/v1/{clientId}/whoami": {
      get: {
        tags: ["Général"],
        operationId: "whoami",
        summary: "Qui suis-je ?",
        description:
          "Retourne l'utilisateur et les permissions associés aux identifiants utilisés. Pratique pour vérifier qu'une clé API fonctionne.",
        parameters: [clientIdParameter],
        responses: {
          "200": jsonResponse("Informations sur la clé.", ref("WhoAmI")),
          ...errorResponses,
        },
      },
    },
  };

  Object.assign(schemas, webhooksSchemas(entities));
  tags.push({
    name: "Gestion des webhooks",
    description:
      "Être notifié des créations, modifications et suppressions de documents, voir [Webhooks](#description/webhooks).\n\nPermission requise : `API_ACCESS`.",
  });
  paths = { ...paths, ...webhooksPaths(errorResponses) };

  for (const entity of entities) {
    const name = schemaName(entity.definition.name);
    const { read, write } = entitySchemas(entity, metadata);
    schemas[name] = read;
    schemas[`${name}Input`] = write;
    tags.push({
      name: entity.title,
      description: `${entity.description}\n\nTable : \`${entity.definition.name}\`.`,
    });
    paths = { ...paths, ...entityPaths(entity) };
  }

  const error = (description: string) => ({
    description,
    content: { "application/json": { schema: ref("Error") } },
  });

  return {
    openapi: "3.1.0",
    info: {
      title: "L'inventaire API",
      version,
      description: DESCRIPTION,
      contact: { name: "L'inventaire", url: "https://linventaire.app" },
    },
    servers: options.servers || [
      { url: "https://api.linventaire.app", description: "Production" },
    ],
    security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
    tags,
    paths,
    webhooks: webhooksEvents(entities),
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Clé API envoyée comme `Authorization: Bearer lin_...`.",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-Api-Key",
          description: "Clé API envoyée dans l'en-tête `X-Api-Key`.",
        },
      },
      parameters: {
        ClientId: {
          name: "clientId",
          in: "path",
          required: true,
          description: "Identifiant de l'entreprise.",
          schema: { type: "string" },
        },
        DocumentId: {
          name: "id",
          in: "path",
          required: true,
          description: "Identifiant du document.",
          schema: { type: "string" },
        },
      },
      responses: {
        BadRequest: error("Requête invalide."),
        Unauthorized: error("Clé API absente, invalide ou révoquée."),
        Forbidden: error("Permissions insuffisantes."),
        TooManyRequests: error("Trop de requêtes."),
        InternalError: error("Erreur interne."),
      },
      schemas,
    },
  };
};
