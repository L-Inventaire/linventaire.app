import platform from "../../../platform";
import { Context, NotFoundError } from "../../../types";
import UsersClientsUsers, {
  ClientsUsersDefinition,
  Role,
  Roles,
} from "../entities/clients-users";
import NodeCache from "node-cache";
import { getClient } from "./client";
import ClientsUsers from "../entities/clients-users";
import Clients from "../entities/clients";
import Services from "../../../services";
import _ from "lodash";
import { checkIpAccessOrThrow, IP_NOT_ALLOWED } from "./ip-restriction";

export const getInvitations = async (ctx: Context) => {
  const user = await Services.Users.getUser(
    { ...ctx, role: "SYSTEM" },
    { id: ctx.id }
  );
  return await getClients(ctx, user.id_email);
};

export const getClients = async (ctx: Context, id?: string) => {
  const driver = await platform.Db.getService();
  if (ctx.role !== "SYSTEM") {
    if (id?.includes("@")) {
      const user = await Services.Users.getUser(
        { ...ctx, role: "SYSTEM" },
        { email: id }
      );
      if (!user) throw NotFoundError("Clients not found");
    } else {
      id = ctx.id;
    }
  }

  if (!id) {
    throw NotFoundError("Clients not found");
  }

  const clients: (ClientsUsers & { client?: Clients })[] =
    await driver.select<UsersClientsUsers>(ctx, ClientsUsersDefinition.name, {
      user_id: id,
      active: true,
    });

  // Load the related client rows in parallel rather than sequentially: this is
  // on the hot path (loadPermissions runs on every authenticated request).
  // Order is preserved (map returns in order); IP-blocked clients are still
  // returned so the user understands why access is denied.
  const result: (ClientsUsers & { client?: Clients; ip_blocked?: boolean })[] =
    await Promise.all(
      clients.map(async (client) => {
        try {
          client.client = await getClient(ctx, client.client_id);
          return client;
        } catch (e: any) {
          if (e?.code !== IP_NOT_ALLOWED) throw e;
          const full = await getClient(
            { ...ctx, role: "SYSTEM" },
            client.client_id
          );
          return {
            ...client,
            ip_blocked: true,
            client: {
              id: full.id,
              company: full.company,
              preferences: _.pick(full.preferences, "logo"),
            } as Clients,
          };
        }
      })
    );

  return result;
};

export const getRoles = async (ctx: Context, clientId: string) => {
  if (!ctx.id || !clientId) throw NotFoundError("Roles not found");

  const driver = await platform.Db.getService();
  const member = await driver.selectOne<UsersClientsUsers>(
    ctx,
    ClientsUsersDefinition.name,
    {
      client_id: clientId,
      user_id: ctx.id,
      active: true,
    }
  );

  return member?.roles?.list || [];
};

const cache = new NodeCache({ stdTTL: 60 });

export const checkRoles = async (
  ctx: Context,
  clientId: string,
  roles: Role[],
  throwIfNot = false
) => {
  if (ctx.role === "SYSTEM") return true;
  if (!ctx.id || !clientId) return false;
  let userRoles = cache.get<string[]>(ctx.id + "_" + clientId);
  if (!userRoles) {
    userRoles = await getRoles(ctx, clientId);
    cache.set(ctx.id + "_" + clientId, userRoles);
  }
  // Checked on every call (not cached with roles) as the IP can change between requests
  await checkIpAccessOrThrow(ctx, clientId, userRoles);
  userRoles = impliedRoles(userRoles as any);
  const value = !roles.some((role) => !userRoles.includes(role));

  if (throwIfNot && !value) {
    throw NotFoundError(
      "You have no permissions to update this client, expected [" +
        roles.join(", ") +
        "] got [" +
        userRoles.join(", ") +
        "]"
    );
  }

  return value;
};

export const checkRolesOrThrow = async (
  ctx: Context,
  clientId: string,
  roles: Role[]
) => {
  await checkRoles(ctx, clientId, roles, true);
};

export const impliedRoles = (roles: Role[]) => {
  // Security: a user with no roles on a client (typically a non-member, since
  // getRoles returns [] when there is no active membership) must not inherit
  // any default role. Granting the "everyone" defaults below to an empty input
  // would let any authenticated user read/write files, tags and fields of any
  // tenant. Members always carry at least one explicit role.
  if (!roles || roles.length === 0) {
    return [];
  }

  const impliedRolesTree = {
    CLIENT_MANAGE: [],
  };

  Roles.forEach((role) => {
    if (role.includes("_MANAGE")) {
      impliedRolesTree[role] = [
        ...(impliedRolesTree[role] || []),
        role.replace("_MANAGE", "_WRITE"),
      ];
    }
    if (role.includes("_WRITE")) {
      impliedRolesTree[role] = [
        ...(impliedRolesTree[role] || []),
        role.replace("_WRITE", "_READ"),
      ];
    }
    impliedRolesTree["CLIENT_MANAGE"].push(role);
  });

  // Add implied roles to the list
  for (let i = 0; i < 3; i++) {
    // Max 3 levels of implied roles
    roles.forEach((role) => {
      roles.push(role);
      roles.push(...(impliedRolesTree[role] || []));
    });
    roles = _.uniq(roles);
  }

  // Roles everyone has by default
  roles.push(
    "ANY",
    "TAGS_READ",
    "USERS_READ",
    "FIELDS_READ",
    "FILES_READ",
    "FILES_WRITE"
  );

  return roles;
};
