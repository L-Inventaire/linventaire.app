import Users, { UsersDefinition } from "#src/services/users/entities/users";
import Framework from "../../../platform";
import platform from "../../../platform";
import Services from "../../../services";
import { Context, NotFoundError } from "../../../types";
import Clients, { ClientsDefinition } from "../entities/clients";
import ClientsUsers, {
  ClientsUsersDefinition,
} from "../entities/clients-users";
import { checkRoles, checkRolesOrThrow, getClients } from "./client-roles";
import config from "config";

export const getUsers = async (ctx: Context, clientId: string) => {
  await checkRolesOrThrow(ctx, clientId, []);

  const driver = await platform.Db.getService();
  const members = await driver.select<ClientsUsers>(
    ctx,
    ClientsUsersDefinition.name,
    { client_id: clientId },
    {}
  );

  return await Promise.all(
    members.map(async (member) => ({
      ...member,
      user: member.user_id?.includes("@")
        ? { email: member.user_id }
        : await Services.Users.getPublicUser(
            { ...ctx, role: "SYSTEM" },
            { id: member.user_id }
          ),
    }))
  );
};

export const acceptInvitation = async (
  ctx: Context,
  clientId: string,
  accept = true
) => {
  const user = await Services.Users.getUser(
    { ...ctx, role: "SYSTEM" },
    { id: ctx.id }
  );
  if (!user) throw NotFoundError("User not found");

  const invitations = await getClients(ctx, user.id_email);
  const invitation = invitations.find((i) => i.client_id === clientId);

  if (!invitation || !invitation.user_id?.includes("@"))
    throw NotFoundError("Invitation not found");

  const driver = await platform.Db.getService();
  await driver.delete<ClientsUsers>(
    ctx,
    ClientsUsersDefinition.name,
    { client_id: invitation.client_id, user_id: invitation.user_id },
    {}
  );

  if (accept) {
    // Check if user was previously active = false
    const existingUser = await driver.selectOne<ClientsUsers>(
      ctx,
      ClientsUsersDefinition.name,
      { client_id: invitation.client_id, user_id: ctx.id },
      {}
    );

    if (existingUser) {
      await driver.update<ClientsUsers>(
        ctx,
        ClientsUsersDefinition.name,
        { client_id: existingUser.client_id, user_id: existingUser.user_id },
        {
          roles: invitation.roles,
          active: true,
        }
      );
    } else {
      await driver.insert<ClientsUsers>(ctx, ClientsUsersDefinition.name, {
        roles: invitation.roles,
        client_id: invitation.client_id,
        user_id: ctx.id,
        created_at: Date.now(),
        updated_at: Date.now(),
        updated_by: ctx.id,
        active: true,
      });
    }
  }

  return await getClients(ctx);
};

export const removeUser = async (
  ctx: Context,
  clientId: string,
  userId: string
) => {
  if (
    !(await checkRoles(ctx, clientId, ["CLIENT_MANAGE"])) &&
    userId !== ctx.id
  ) {
    throw NotFoundError(
      "You have no permissions to update this client needed CLIENT_MANAGE or SYSTEM"
    );
  }

  if (!userId) throw NotFoundError("User not found");

  const driver = await platform.Db.getService();

  // Lowercase emails
  userId = userId.toLowerCase();

  // Check if at least one CLIENT_MANAGE user is left
  const users = await getUsers(ctx, clientId);
  if (
    users.filter((u) => u.active).length > 1 &&
    users.filter(
      (u) =>
        u.active &&
        u.user_id !== userId &&
        u.roles.list.includes("CLIENT_MANAGE")
    ).length === 0
  ) {
    throw NotFoundError("At least one CLIENT_MANAGE user is needed");
  }

  await driver.update<ClientsUsers>(
    ctx,
    ClientsUsersDefinition.name,
    { client_id: clientId, user_id: userId },
    {
      active: false,
      updated_at: Date.now(),
      updated_by: ctx.id,
    }
  );
};

// Note: userId can be an id or an email
export const setUser = async (
  ctx: Context,
  clientId: string,
  userId: string,
  roles: ClientsUsers["roles"]
) => {
  if (
    !(await checkRoles(ctx, clientId, ["CLIENT_MANAGE"])) &&
    ctx.role !== "SYSTEM"
  )
    throw NotFoundError(
      "You have no permissions to update this client needed CLIENT_MANAGE or SYSTEM"
    );

  if (!userId) throw NotFoundError("User not found");

  // Lowercase emails
  userId = userId.toLowerCase();

  const driver = await platform.Db.getService();

  // Check if user already exists, if not add it to client
  const user = await driver.selectOne<ClientsUsers>(
    ctx,
    ClientsUsersDefinition.name,
    { client_id: clientId, user_id: userId },
    {}
  );

  if (!user) {
    //Add the user
    await driver.insert<ClientsUsers>(ctx, ClientsUsersDefinition.name, {
      client_id: clientId,
      user_id: userId,
      roles: roles,
      created_at: Date.now(),
      updated_at: Date.now(),
      updated_by: ctx.id,
      active: true,
    });

    const client = await driver.selectOne<Clients>(
      ctx,
      ClientsDefinition.name,
      { id: clientId },
      {}
    );
    const existingUser =
      (await driver.selectOne<Users>(
        ctx,
        UsersDefinition.name,
        { id: userId },
        {}
      )) ||
      (await driver.selectOne<Users>(
        ctx,
        UsersDefinition.name,
        { id_email: userId },
        {}
      ));

    let email = userId;
    if (existingUser) {
      email = existingUser.id_email;
    }

    // Send an invitation by email
    if (ctx.id !== userId) {
      await Framework.PushEMail.push(
        ctx,
        email,
        Framework.I18n.t(ctx, "emails.invite.message", {
          replacements: {
            company: client?.company?.name || client?.company?.legal_name,
            link:
              config.get<string>("server.domain") +
              `/accept-invitation/${clientId}`,
          },
        }),
        {
          subject: Framework.I18n.t(ctx, "emails.invite.subject", {
            replacements: {
              company: client?.company?.name || client?.company?.legal_name,
            },
          }),
        }
      );
    }
  } else {
    // Update the client user
    await driver.update<ClientsUsers>(
      ctx,
      ClientsUsersDefinition.name,
      {
        client_id: clientId,
        user_id: userId,
      },
      {
        active: true, // For invited users removed then re-added
        roles: roles,
        updated_at: Date.now(),
        updated_by: ctx.id,
      }
    );
  }

  return (await getUsers(ctx, clientId)).find((u) => u.user_id === userId);
};
