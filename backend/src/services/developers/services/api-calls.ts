import { captureException } from "@sentry/node";
import Express from "express";
import _ from "lodash";
import platform from "../../../platform";
import { id } from "../../../platform/db/utils";
import { Context, createContext, NotFoundError } from "../../../types";
import { Ctx } from "../../utils";
import ApiCalls, { ApiCallsDefinition } from "../entities/api-calls";

// Bodies are stored for debugging purposes only, keep them small
export const MAX_STORED_BODY = 10 * 1024;
export const RETENTION_DAYS = 30;

export const truncateBody = (
  body: unknown
): { value: string | null; size: number } => {
  if (body === undefined || body === null || body === "") {
    return { value: null, size: 0 };
  }
  let value: string;
  if (Buffer.isBuffer(body)) {
    return { value: `[binary ${body.length} bytes]`, size: body.length };
  } else if (typeof body === "string") {
    value = body;
  } else {
    try {
      value = JSON.stringify(body);
    } catch (e) {
      value = String(body);
    }
  }
  const size = Buffer.byteLength(value || "");
  if (value && value.length > MAX_STORED_BODY) {
    value = value.slice(0, MAX_STORED_BODY) + "…[truncated]";
  }
  return { value: value || null, size };
};

/**
 * Records every request authenticated with an api key (status, duration,
 * truncated request and response bodies) so developers can debug their integrations.
 */
export const apiCallsLogger = (
  req: Express.Request,
  res: Express.Response,
  next: () => void
) => {
  const ctx = Ctx.get(req)?.context;
  if (ctx?.role !== "API" || !ctx.api_key) return next();

  const start = Date.now();
  let responseBody: unknown = undefined;

  const json = res.json.bind(res);
  res.json = (body: any) => {
    responseBody = body;
    return json(body);
  };
  const send = res.send.bind(res);
  res.send = (body: any) => {
    // res.json calls res.send with the serialized body
    if (responseBody === undefined) responseBody = body;
    return send(body);
  };

  res.on("finish", () => {
    saveApiCall(ctx, req, res.statusCode, Date.now() - start, responseBody);
  });

  next();
};

const saveApiCall = async (
  ctx: Context,
  req: Express.Request,
  status: number,
  duration: number,
  responseBody: unknown
) => {
  try {
    const request = truncateBody(
      req.method === "GET" || _.isEmpty(req.body) ? null : req.body
    );
    const response = truncateBody(responseBody);
    const call: ApiCalls = {
      id: id(),
      client_id: ctx.api_key!.client_id,
      api_key_id: ctx.api_key!.id,
      user_id: ctx.id,
      req_id: ctx.req_id,
      method: req.method,
      url: (req.originalUrl || req.url || "").slice(0, 2000),
      status,
      duration_ms: duration,
      ip: (ctx.ip || "").slice(0, 64),
      user_agent: `${req.headers["user-agent"] || ""}`.slice(0, 500),
      request_body: request.value,
      request_size: request.size,
      response_body: response.value,
      response_size: response.size,
      created_at: Date.now(),
    };
    const db = await platform.Db.getService();
    await db.insert<ApiCalls>(
      createContext("SYSTEM", "SYSTEM"),
      ApiCallsDefinition.name,
      call,
      { triggers: false }
    );
  } catch (e) {
    console.error(e);
    captureException(e);
  }
};

type ApiCallsFilters = {
  // Only calls made with the keys of this user, unless "all"
  user_id?: string;
  api_key_id?: string;
  status?: "success" | "error";
  from?: number;
};

const whereClause = (clientId: string, filters: ApiCallsFilters) => {
  const where = ["client_id = $1"];
  const values: any[] = [clientId];
  if (filters.user_id) {
    values.push(filters.user_id);
    where.push(`user_id = $${values.length}`);
  }
  if (filters.api_key_id) {
    values.push(filters.api_key_id);
    where.push(`api_key_id = $${values.length}`);
  }
  if (filters.status === "success") where.push("status < 400");
  if (filters.status === "error") where.push("status >= 400");
  if (filters.from) {
    values.push(filters.from);
    where.push(`created_at >= $${values.length}`);
  }
  return { where: where.join(" AND "), values };
};

// Raw queries return BIGINT as strings
const toNumber = (value: any) =>
  value === null || value === undefined ? null : Number(value);

const LIST_COLUMNS = [
  "id",
  "api_key_id",
  "user_id",
  "req_id",
  "method",
  "url",
  "status",
  "duration_ms",
  "ip",
  "request_size",
  "response_size",
  "created_at",
];

export const listApiCalls = async (
  clientId: string,
  filters: ApiCallsFilters,
  options: { limit?: number; offset?: number } = {}
) => {
  const db = await platform.Db.getService();
  const ctx = createContext("SYSTEM", "SYSTEM");
  const { where, values } = whereClause(clientId, filters);
  const limit = Math.max(1, Math.min(100, options.limit || 50));
  const offset = Math.max(0, options.offset || 0);

  const [rows, count] = await Promise.all([
    db.custom<{ rows: any[] }>(
      ctx,
      `SELECT ${LIST_COLUMNS.join(", ")} FROM ${
        ApiCallsDefinition.name
      } WHERE ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      values
    ),
    db.custom<{ rows: any[] }>(
      ctx,
      `SELECT COUNT(*) AS total FROM ${ApiCallsDefinition.name} WHERE ${where}`,
      values
    ),
  ]);

  return {
    total: toNumber(count.rows[0]?.total) || 0,
    list: rows.rows.map((row: any) => ({
      ...row,
      created_at: toNumber(row.created_at),
    })) as Omit<ApiCalls, "request_body" | "response_body" | "client_id">[],
  };
};

export const getApiCall = async (
  clientId: string,
  callId: string,
  filters: Pick<ApiCallsFilters, "user_id">
) => {
  const db = await platform.Db.getService();
  const call = await db.selectOne<ApiCalls>(
    createContext("SYSTEM", "SYSTEM"),
    ApiCallsDefinition.name,
    { id: callId, client_id: clientId }
  );
  if (!call || (filters.user_id && call.user_id !== filters.user_id)) {
    throw NotFoundError("Api call not found");
  }
  return call;
};

export const getApiCallsStats = async (
  clientId: string,
  filters: ApiCallsFilters,
  days = 30
) => {
  const db = await platform.Db.getService();
  days = Math.max(1, Math.min(RETENTION_DAYS, days));
  const from = Date.now() - days * 24 * 60 * 60 * 1000;
  const { where, values } = whereClause(clientId, { ...filters, from });

  const result = await db.custom<{ rows: any[] }>(
    createContext("SYSTEM", "SYSTEM"),
    `SELECT
      to_char(date_trunc('day', to_timestamp(created_at / 1000.0)), 'YYYY-MM-DD') AS day,
      COUNT(*) AS count,
      COUNT(*) FILTER (WHERE status >= 400) AS errors,
      ROUND(AVG(duration_ms)) AS avg_duration_ms
    FROM ${ApiCallsDefinition.name}
    WHERE ${where}
    GROUP BY 1
    ORDER BY 1`,
    values
  );

  const perDay = result.rows.map((row: any) => ({
    day: row.day as string,
    count: toNumber(row.count) || 0,
    errors: toNumber(row.errors) || 0,
    avg_duration_ms: toNumber(row.avg_duration_ms) || 0,
  }));

  const total = _.sumBy(perDay, "count");
  const errors = _.sumBy(perDay, "errors");
  return {
    days,
    total,
    errors,
    error_rate: total ? errors / total : 0,
    avg_duration_ms: total
      ? Math.round(_.sumBy(perDay, (d) => d.avg_duration_ms * d.count) / total)
      : 0,
    per_day: perDay,
  };
};

export const purgeOldApiCalls = async () => {
  const db = await platform.Db.getService();
  await db.custom<{ rows: any[] }>(
    createContext("SYSTEM", "SYSTEM"),
    `DELETE FROM ${ApiCallsDefinition.name} WHERE created_at < $1`,
    [Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000]
  );
};
