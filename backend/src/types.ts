import { v4 } from "uuid";
import { TransactionExecutor } from "./platform/db/api";

export type Context = {
  req_id: string;
  client_id: string;
  client_roles: string[];
  id: string;
  role:
    | "USER"
    | "SYSTEM"
    | "NOTHING"
    | "DISABLED"
    | "SYSADMIN"
    | "SYSAGENT"
    | "API";
  mfa: {
    method: "phone" | "email" | "password" | "app";
    exp: number;
  }[];
  created_at: number;
  lang?: string;
  ip?: string;
  db_tnx?: TransactionExecutor;
  _batch_import_ignore_triggers?: boolean;
  trigger_path: string[];
  cache: any;
};

export const setCtxCache = (ctx: Context, key: string, value: any) => {
  ctx.cache = ctx.cache || {};
  ctx.cache[key] = value;
};

export const getCtxCache = (ctx: Context, key: string) => {
  return ctx.cache?.[key];
};

export const createContext = (id = "SYSTEM", role = "SYSTEM") => {
  return {
    req_id: v4(),
    client_id: "*",
    id,
    role,
    mfa: [],
    created_at: new Date().getTime(),
  } as Context;
};

export type ValidResponse =
  | {
      error: string;
      message?: string;
      req_id: string;
    }
  | any;

export const ForbiddenError = (message) => {
  return { status: 403, error: "Forbidden", message };
};

export const NotFoundError = (message) => {
  return { status: 404, error: "Entity not found", message };
};

export const UnauthorizedError = (message) => {
  return { status: 401, error: "Unauthorized", message };
};

export const BadRequestError = (message) => {
  return { status: 400, error: "Bad Request", message };
};
