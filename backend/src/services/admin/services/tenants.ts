import _ from "lodash";
import platform from "../../../platform";
import { Context, NotFoundError } from "../../../types";
import { ClientsDefinition } from "../../clients/entities/clients";
import { ClientsUsersDefinition } from "../../clients/entities/clients-users";
import { UsersDefinition } from "../../users/entities/users";

const DAY = 24 * 60 * 60 * 1000;
export const ACTIVITY_DAYS = 90;

// Business documents used to measure how much a company uses the app.
// The activity is the documents created or modified (created_at / updated_at),
// automated changes (recurring invoices, received e-invoices...) are included.
export const ACTIVITY_TABLES = [
  "invoices",
  "contacts",
  "articles",
  "crm_items",
  "service_items",
  "service_times",
  "stock_items",
  "accounting_transactions",
  "comments",
  "files",
];

export type TableActivityRow = {
  client_id: string;
  total: number; // Non deleted documents
  created_30d: number;
  updated_7d: number; // Created or modified in the last 7 days
  updated_30d: number; // Created or modified in the last 30 days
  last_activity_at: number | null;
};

export type TenantActivity = Omit<TableActivityRow, "client_id">;

export type TenantMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  roles: string[];
  created_at: number | null;
  invitation: boolean; // Invited by email, not joined yet
};

export type Tenant = {
  id: string;
  name: string;
  legal_name: string | null;
  registration_number: string | null;
  city: string | null;
  country: string | null;
  plan: string | null;
  created_at: number | null;
  members: number;
  invitations: number;
  owners: Pick<TenantMember, "user_id" | "full_name" | "email">[];
  activity: TenantActivity;
  documents: { [table: string]: number };
};

const emptyActivity = (): TenantActivity => ({
  total: 0,
  created_30d: 0,
  updated_7d: 0,
  updated_30d: 0,
  last_activity_at: null,
});

const toNumber = (value: any) => (value === null ? null : Number(value));

/** Sum the activity of each table, per company */
export const mergeActivity = (rowsByTable: {
  [table: string]: TableActivityRow[];
}) => {
  const activity: { [clientId: string]: TenantActivity } = {};
  const documents: { [clientId: string]: { [table: string]: number } } = {};
  for (const [table, rows] of Object.entries(rowsByTable)) {
    for (const row of rows) {
      const current = (activity[row.client_id] ||= emptyActivity());
      current.total += row.total;
      current.created_30d += row.created_30d;
      current.updated_7d += row.updated_7d;
      current.updated_30d += row.updated_30d;
      if (
        row.last_activity_at !== null &&
        row.last_activity_at > (current.last_activity_at || 0)
      ) {
        current.last_activity_at = row.last_activity_at;
      }
      (documents[row.client_id] ||= {})[table] = row.total;
    }
  }
  return { activity, documents };
};

/** Tables to use, some modules may not be installed */
const getActivityTables = async () => {
  const db = await platform.Db.getService();
  const definitions = db.getTablesDefinitions();
  return ACTIVITY_TABLES.filter((table) =>
    ["client_id", "created_at", "updated_at", "is_deleted"].every(
      (column) => definitions[table]?.columns?.[column]
    )
  );
};

const getTablesActivity = async (ctx: Context, clientId?: string) => {
  const db = await platform.Db.getService();
  const now = Date.now();
  const tables = await getActivityTables();
  const rowsByTable = await Promise.all(
    tables.map(async (table) => {
      // Table names come from ACTIVITY_TABLES, never from the request
      const result = await db.custom<{ rows: any[] }>(
        ctx,
        `SELECT
          client_id,
          COUNT(*) FILTER (WHERE is_deleted IS NOT TRUE) AS total,
          COUNT(*) FILTER (WHERE created_at >= $1) AS created_30d,
          COUNT(*) FILTER (WHERE GREATEST(created_at, updated_at) >= $2) AS updated_7d,
          COUNT(*) FILTER (WHERE GREATEST(created_at, updated_at) >= $1) AS updated_30d,
          MAX(GREATEST(created_at, updated_at)) AS last_activity_at
        FROM ${table}
        ${clientId ? "WHERE client_id = $3" : ""}
        GROUP BY client_id`,
        [now - 30 * DAY, now - 7 * DAY, ...(clientId ? [clientId] : [])]
      );
      return [
        table,
        result.rows.map(
          (row): TableActivityRow => ({
            client_id: row.client_id,
            total: toNumber(row.total),
            created_30d: toNumber(row.created_30d),
            updated_7d: toNumber(row.updated_7d),
            updated_30d: toNumber(row.updated_30d),
            last_activity_at: toNumber(row.last_activity_at),
          })
        ),
      ] as const;
    })
  );
  return Object.fromEntries(rowsByTable);
};

const getMembers = async (ctx: Context, clientId?: string) => {
  const db = await platform.Db.getService();
  // Removed users are kept with active = false, invitations use the email as user_id
  const result = await db.custom<{ rows: any[] }>(
    ctx,
    `SELECT cu.client_id, cu.user_id, cu.roles, cu.created_at, u.full_name, u.id_email
    FROM ${ClientsUsersDefinition.name} cu
    LEFT JOIN ${UsersDefinition.name} u ON u.id = cu.user_id
    WHERE cu.active IS NOT FALSE ${clientId ? "AND cu.client_id = $1" : ""}
    ORDER BY cu.created_at ASC`,
    clientId ? [clientId] : []
  );
  return result.rows.map((row) => ({
    client_id: row.client_id as string,
    user_id: row.user_id as string,
    full_name: row.full_name || null,
    email: row.id_email || (row.user_id.includes("@") ? row.user_id : null),
    roles: row.roles?.list || [],
    created_at: toNumber(row.created_at),
    invitation: !row.id_email && row.user_id.includes("@"),
  }));
};

const getClients = async (ctx: Context, clientId?: string) => {
  const db = await platform.Db.getService();
  // Never select the whole row: it contains secrets (smtp password...)
  const result = await db.custom<{ rows: any[] }>(
    ctx,
    `SELECT id, name, company, address, configuration, created_at
    FROM ${ClientsDefinition.name}
    ${clientId ? "WHERE id = $1" : ""}`,
    clientId ? [clientId] : []
  );
  return result.rows;
};

const buildTenant = (
  client: any,
  members: Awaited<ReturnType<typeof getMembers>>,
  activity: TenantActivity | undefined,
  documents: { [table: string]: number } | undefined
): Tenant => {
  const joined = members.filter((m) => !m.invitation);
  return {
    id: client.id,
    name: client.company?.name || client.name || client.id,
    legal_name: client.company?.legal_name || null,
    registration_number: client.company?.registration_number || null,
    city: client.address?.city || null,
    country: client.address?.country || null,
    plan: client.configuration?.plan || null,
    created_at: toNumber(client.created_at ?? null),
    members: joined.length,
    invitations: members.length - joined.length,
    owners: joined
      .filter((m) => m.roles.includes("CLIENT_MANAGE"))
      .map((m) => _.pick(m, "user_id", "full_name", "email")),
    activity: activity || emptyActivity(),
    documents: documents || {},
  };
};

export const listTenants = async (ctx: Context) => {
  const [clients, members, tablesActivity] = await Promise.all([
    getClients(ctx),
    getMembers(ctx),
    getTablesActivity(ctx),
  ]);
  const { activity, documents } = mergeActivity(tablesActivity);
  const membersByClient = _.groupBy(members, "client_id");

  const tenants = clients.map((client) =>
    buildTenant(
      client,
      membersByClient[client.id] || [],
      activity[client.id],
      documents[client.id]
    )
  );

  const now = Date.now();
  const activeSince = (days: number) =>
    tenants.filter(
      (t) => (t.activity.last_activity_at || 0) >= now - days * DAY
    ).length;

  return {
    summary: {
      tenants: tenants.length,
      active_7d: activeSince(7),
      active_30d: activeSince(30),
      new_30d: tenants.filter((t) => (t.created_at || 0) >= now - 30 * DAY)
        .length,
      users: _.uniq(members.filter((m) => !m.invitation).map((m) => m.user_id))
        .length,
      documents_updated_30d: _.sumBy(tenants, (t) => t.activity.updated_30d),
    },
    tenants: _.orderBy(
      tenants,
      [(t) => t.activity.last_activity_at || 0],
      ["desc"]
    ),
  };
};

export const getTenant = async (ctx: Context, clientId: string) => {
  const [clients, members, tablesActivity] = await Promise.all([
    getClients(ctx, clientId),
    getMembers(ctx, clientId),
    getTablesActivity(ctx, clientId),
  ]);
  if (!clients.length) throw NotFoundError("Company not found");

  const { activity, documents } = mergeActivity(tablesActivity);
  const tenant = buildTenant(
    clients[0],
    members,
    activity[clientId],
    documents[clientId]
  );

  const db = await platform.Db.getService();
  const tables = Object.keys(tablesActivity);
  const from = Date.now() - (ACTIVITY_DAYS - 1) * DAY;

  const [perDay, perUser, invoicesByType] = await Promise.all([
    // Documents created per day
    tables.length
      ? db.custom<{ rows: any[] }>(
          ctx,
          `SELECT
            to_char(date_trunc('day', to_timestamp(created_at / 1000.0)), 'YYYY-MM-DD') AS day,
            COUNT(*) AS count
          FROM (${tables
            .map(
              (table) =>
                `SELECT created_at FROM ${table} WHERE client_id = $1 AND created_at >= $2`
            )
            .join(" UNION ALL ")}) documents
          GROUP BY 1
          ORDER BY 1`,
          [clientId, from]
        )
      : { rows: [] },
    // Last document created or modified by each user
    tables.length
      ? db.custom<{ rows: any[] }>(
          ctx,
          `SELECT
            updated_by,
            MAX(GREATEST(created_at, updated_at)) AS last_activity_at,
            COUNT(*) FILTER (WHERE GREATEST(created_at, updated_at) >= $2) AS updated_30d
          FROM (${tables
            .map(
              (table) =>
                `SELECT updated_by, created_at, updated_at FROM ${table} WHERE client_id = $1`
            )
            .join(" UNION ALL ")}) documents
          GROUP BY 1`,
          [clientId, Date.now() - 30 * DAY]
        )
      : { rows: [] },
    tables.includes("invoices")
      ? db.custom<{ rows: any[] }>(
          ctx,
          `SELECT type, COUNT(*) AS count
          FROM invoices
          WHERE client_id = $1 AND is_deleted IS NOT TRUE
          GROUP BY 1
          ORDER BY 2 DESC`,
          [clientId]
        )
      : { rows: [] },
  ]);

  const usersActivity = _.keyBy(perUser.rows, "updated_by");

  return {
    tenant,
    days: ACTIVITY_DAYS,
    per_day: perDay.rows.map((row) => ({
      day: row.day as string,
      count: toNumber(row.count),
    })),
    tables: tables.map((table) => {
      const row = tablesActivity[table][0];
      return {
        table,
        ...(row ? _.omit(row, "client_id") : emptyActivity()),
      };
    }),
    invoices_by_type: invoicesByType.rows.map((row) => ({
      type: row.type as string,
      count: toNumber(row.count),
    })),
    members: members.map((member) => ({
      ..._.omit(member, "client_id"),
      last_activity_at: toNumber(
        usersActivity[member.user_id]?.last_activity_at ?? null
      ),
      updated_30d: toNumber(usersActivity[member.user_id]?.updated_30d ?? 0),
    })),
  };
};
