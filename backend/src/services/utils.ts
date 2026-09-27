import Framework from "#src/platform/index";
import config from "config";
import cors from "cors";
import express, { Express, Request } from "express";
import http from "http";
import jwt from "jsonwebtoken";
import seedrandom from "seedrandom";
import { id } from "../platform/db/utils";
import { Context, createContext } from "../types";
import Contacts from "./modules/contacts/entities/contacts";
import { getUnitCode } from "@shared/consts";
import { authenticateApiKey, isApiKey } from "./developers/services/api-keys";
import { DateTime } from "luxon";

const getTrustProxy = () => {
  const value = config.has("server.trust_proxy")
    ? config.get<string | boolean | number>("server.trust_proxy")
    : false;
  if (value === "true") return true;
  if (value === "false" || value === "") return false;
  if (typeof value === "string" && /^\d+$/.test(value)) return parseInt(value);
  return value;
};

/**
 * Resolve the client IP of a raw http request (e.g. a socket.io handshake)
 * the same way Express computes req.ip: walk X-Forwarded-For from the closest
 * hop and stop at the first address that is not a trusted proxy.
 */
export const getRequestIp = (
  request: Pick<http.IncomingMessage, "headers" | "socket">,
  trust?: ((addr: string, i: number) => boolean) | null
) => {
  const forwarded = request.headers?.["x-forwarded-for"];
  const addrs = [
    request.socket?.remoteAddress || "",
    ...(Array.isArray(forwarded) ? forwarded.join(",") : forwarded || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .reverse(),
  ];
  for (let i = 0; i < addrs.length - 1; i++) {
    if (!trust?.(addrs[i], i)) return addrs[i];
  }
  return addrs[addrs.length - 1];
};

export function secureExpress() {
  const app = express();
  app.use(
    cors({
      origin: /(localhost:[0-9]+|.+\.linventaire\.app|linventaire\.app)$/,
      credentials: true,
      maxAge: 86400,
    })
  );
  app.disable("x-powered-by");
  // Needed to get the real client IP (req.ip) behind nginx / load balancers
  app.set("trust proxy", getTrustProxy());
  app.use((req, res, next) => {
    // If it's /import route, set higher limit
    if (req.path.endsWith("/import")) {
      return express.json({ limit: "500mb" })(req, res, next);
    } else {
      return express.json({ limit: "5mb" })(req, res, next);
    }
  });
  app.use(express.urlencoded({ extended: true }));
  app.use((req, _, next) => {
    if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
      req.headers["content-type"] = "application/json";
    }
    next();
  });
  return app;
}

export class Ctx {
  static _bindings = new WeakMap<Request, Ctx>();

  context: Context;

  static bind(req: Request): void {
    const ctx = new Ctx();
    Ctx._bindings.set(req, ctx);
  }

  static get(req: Request): Ctx | null {
    const ctx = Ctx._bindings.get(req) || null;
    if (ctx.context) {
      ctx.context.client_id = ctx.context.client_id || req.params.clientId;
    }
    return ctx;
  }
}

export function useCtx(server: Express) {
  server.use((req, _, next) => {
    Ctx.bind(req);
    next();
  });
  server.use(async (req, res, next) => {
    //Create the default context
    const context: Context = {
      ...createContext("", "NOTHING"),
      client_id: null,
      id: "",
      role: "NOTHING",
      ip: req.ip,
      created_at: new Date().getTime(),
      req_id: id(),
    };

    // Api keys can be sent either as "Authorization: Bearer lin_..." or "X-Api-Key: lin_..."
    const bearer = req.headers.authorization?.split(" ")[1];
    const headerApiKey = req.headers["x-api-key"];
    const apiKey =
      typeof headerApiKey === "string"
        ? headerApiKey
        : isApiKey(bearer)
        ? bearer
        : null;

    try {
      if (apiKey) {
        // The key acts as its owner, but only for the company it was created for
        const key = await authenticateApiKey(apiKey);
        if (!key) {
          res.status(401).json({
            error: "Unauthorized",
            message: "Invalid, expired or revoked api key",
            id: context.req_id,
          });
          return;
        }
        context.id = key.user_id;
        context.role = "API";
        context.mfa = [];
        context.api_key = { id: key.id, client_id: key.client_id };
      } else if (req.headers.authorization !== undefined) {
        const auth: Context = jwt.verify(
          bearer,
          config.get<string>("jwt.secret")
        ) as Context;
        context.id = auth.id;
        context.role = auth.role;
        context.mfa = auth.mfa;
      }
    } catch (e: any) {
      console.log(e);
    }

    Framework.LoggerDb.get("api-gateway").info(
      context,
      `[${req.method}] ${req.url}`
    );

    const ctx = Ctx.get(req);
    ctx.context = context;

    next();
  });
}

const jwtSecret = config.get<string>("jwt.secret");
export const getStableOtp = (seed: string, delta = 0) => {
  if (
    process.env.NODE_ENV === "development" &&
    (seed.startsWith("dev-") || seed.startsWith("+000"))
  ) {
    console.log("Dev mail OTP for", seed, "is", 12345678);
    return 12345678;
  }

  // 1 code per 3 minutes
  const seedValue: string =
    Math.floor(new Date().getTime() / (180 * 1000) - delta).toString() +
    seed +
    jwtSecret;
  const s = seedrandom(seedValue);
  return Math.floor(10000000 + s() * 90000000).toString();
};

export const checkStableOtp = (seed: string, otp: string) => {
  return `${otp}` === getStableOtp(seed) || `${otp}` === getStableOtp(seed, -1);
};

export function flattenKeys(object: any, initialPathPrefix = "") {
  if (
    object &&
    typeof object === "object" &&
    Object.values(object).length === 0
  ) {
    return {};
  }

  if (!object || typeof object !== "object") {
    return [{ [initialPathPrefix]: object }];
  }

  const prefix = initialPathPrefix
    ? Array.isArray(object)
      ? initialPathPrefix
      : `${initialPathPrefix}.`
    : "";

  return Object.keys(object)
    .flatMap((key) =>
      flattenKeys(
        object[key],
        Array.isArray(object) ? `${prefix}[${key}]` : `${prefix}${key}`
      )
    )
    .reduce((acc, path) => ({ ...acc, ...path }));
}

/**
 * Format a date (timestamp) as YYYY-MM-DD in the given timezone.
 * Don't use toISOString() for this: it formats in UTC and dates stored at local
 * midnight (e.g. 2026-03-01 00:00 Europe/Paris = 2026-02-28T23:00Z) would be
 * shifted to the day before.
 */
export const formatDateInTimezone = (
  date: number | string | Date,
  timezone: string
) =>
  DateTime.fromMillis(new Date(date).getTime(), { zone: timezone }).toISODate()!;

export const getContactName = (contact: Partial<Contacts>) => {
  if (!contact) return "";
  return contact.type === "person"
    ? [contact.person_first_name, contact.person_last_name]
        .filter(Boolean)
        .join(" ")
    : contact.business_name || contact.business_registered_name;
};

export function timeDecimalToBase60(
  hourDecimal: number | undefined
): [number, number] {
  if (hourDecimal === undefined) {
    return [0, 0];
  }

  // Extract the whole hours
  const hours = Math.floor(hourDecimal);

  // Calculate the remaining minutes in decimal
  const decimalMinutes = (hourDecimal - hours) * 60;

  // Round minutes to the nearest whole number
  const minutes = Math.round(decimalMinutes);

  // If rounding minutes results in 60, adjust hours and reset minutes to 0
  if (minutes === 60) {
    return [hours + 1, 0];
  }

  // Format the output as "hours:minutes" with leading zero for minutes if necessary
  return [hours, minutes];
}

export function prettyPrintTime(timeArray: number[]): string {
  // Validate the input
  if (timeArray.length !== 2) {
    throw new Error('Invalid time format. Ensure it is in "HH:MM" format.');
  }

  // Extract the hours and minutes
  const [hours, minutes] = timeArray;

  // Format the output as "HH:MM" with leading zeros if necessary
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function timeBase60ToDecimal(timeArray: number[]): number {
  // Split the input into hours and minutes
  const [hours, minutes] = timeArray;

  // Validate the input
  if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes > 60) {
    throw new Error(
      'Invalid time format. Ensure it is in "HH:MM" format with minutes between 0 and 59.'
    );
  }

  // Convert hours and minutes to decimal
  return hours + minutes / 60;
}

export const formatQuantity = (quantity?: number, unit = "unité") => {
  return getUnitCode(unit) !== "HUR"
    ? quantity || 0
    : prettyPrintTime(timeDecimalToBase60(quantity || 0));
};
