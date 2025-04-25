import bcrypt from "bcrypt";
import Express from "express";
import Joi from "joi";
import _ from "lodash";
import Services from ".";
import {
  BadRequestError,
  Context,
  ForbiddenError,
  UnauthorizedError,
} from "../types";
import ClientsUsers, { Role } from "./clients/entities/clients-users";
import { Ctx } from "./utils";
import Clients from "./clients";

export const checkRoleFromCtxOrThrow = (
  ctx: Context,
  roles: Context["role"][]
) => {
  //If one of the requested role is SYSAGENT then SYSADMIN can also operate
  if (roles.includes("SYSAGENT")) roles = _.uniq([...roles, "SYSADMIN"]);

  //If one of the requested role is USER then SYSAGENT and SYSADMIN can also operate
  if (roles.includes("USER"))
    roles = _.uniq([...roles, "SYSAGENT", "SYSADMIN"]);

  //NOTHING role can be impersonated by USER
  if (roles.includes("NOTHING")) roles = _.uniq([...roles, "USER"]);

  //USER role can be impersonated by API
  if (roles.includes("USER")) roles = _.uniq([...roles, "API"]);

  if (!ctx) {
    throw UnauthorizedError("No context found");
  }
  if (roles.indexOf(ctx.role) < 0) {
    throw ForbiddenError(
      `Expected role is one of [${roles.join(",")}], but got ${ctx.role}`
    );
  }
};

export const checkRoleAny =
  (roles: Context["role"][]) =>
  async (req: Express.Request, res: Express.Response, next: () => void) => {
    const ctx = Ctx.get(req)?.context;
    checkRoleFromCtxOrThrow(ctx, roles);
    if (ctx.client_id && ctx.id) {
      await loadPermissions(req);
    }
    next();
  };

const UsersRolesCache: {
  [key: string]: {
    instances: (ClientsUsers & {
      client?: Clients;
    })[];
    date: Date;
  };
} = {};

export const loadPermissions = async (req: Express.Request) => {
  const ctx = Ctx.get(req)?.context;
  const clientId = req.params.clientId;
  if (!clientId) {
    return;
  }

  let cachedResult = UsersRolesCache[ctx.id] || null;
  if (
    cachedResult &&
    new Date().getTime() - cachedResult.date.getTime() < 60000 // Keep cache for 1 minute
  ) {
    cachedResult = null;
    return;
  }

  // Load permissions for user
  const instances =
    cachedResult?.instances || (await Services.Clients.getUserClients(ctx));
  const instance = instances.find((a) => a.client_id === clientId);

  if (!instance) {
    return;
  }

  ctx.client_roles = instance.roles?.list || [];
};

export const checkMfa =
  (options: { min?: number } = {}) =>
  async (req: Express.Request, res: Express.Response, next: () => void) => {
    const ctx = Ctx.get(req)?.context;
    if (!ctx) {
      throw UnauthorizedError("No context found");
    }
    if (ctx.mfa.length < 2) {
      const user = await Services.Users.getUser(ctx, { id: ctx.id });
      if (
        !user?.mfas?.list?.some((a) => a.type === "app" || a.type === "phone")
      ) {
        options.min = 1;
      }
    }
    if (ctx.mfa.length < (options.min || 2) && ctx.role !== "API") {
      throw UnauthorizedError(
        "You need to use at least 2 authentication factors"
      );
    }
    next();
  };

export const checkRole = (role: Context["role"]) => checkRoleAny([role]);

export const checkClientRoles =
  (roles: Role[] | ((req: Express.Request) => Role[])) =>
  async (req: Express.Request, _res: Express.Response, next: () => void) => {
    const clientId = req.params.clientId;
    if (!clientId) {
      throw BadRequestError("Client ID is missing");
    }
    const ctx = Ctx.get(req)?.context;
    if (
      !(await Services.Clients.checkUserRoles(
        ctx,
        clientId,
        typeof roles === "function" ? (roles as any)(req) : roles
      ))
    ) {
      throw ForbiddenError("You don't have the required roles");
    }
    next();
  };

export const checkSchema = (schema: Joi.ObjectSchema) => {
  return (req: Express.Request, _: Express.Response, next: () => void) => {
    if (!schema.validate(req.body).value) {
      throw BadRequestError("Request is malformed");
    }
    next();
  };
};

export const getOrVerifyHash = async (password: string, hash?: string) => {
  if (password.length < 4) {
    return false;
  }
  if (hash) {
    try {
      const result = await bcrypt.compare(password, hash);
      return !!result;
    } catch (e) {
      throw new Error(e);
    }
  }
  return new Promise((resolve, reject) => {
    try {
      bcrypt.hash(
        password,
        10,
        function (err, hash) {
          resolve(hash);
        },
        reject
      );
    } catch (e) {
      reject(e);
    }
  })
    .catch((e) => {
      throw new Error(e);
    })
    .then((hash) => {
      return hash;
    });
};
