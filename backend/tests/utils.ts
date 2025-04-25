import fetch, { Response } from "node-fetch";
import { start, stop } from "../src";

const SERVER = "http://localhost:3000/";
let didSetup = false;
let didStart = false;

global.console = require("console");

export const stopServer = async () => {
  if (process.env.CREATE_SERVER) {
    await stop();
  }
};

export const waitForServer = async () => {
  if (!didStart) {
    if (process.env.CREATE_SERVER) {
      start();
    }
    didStart = true;
  }

  let res = null;
  while (!res) {
    try {
      res = await fetch(SERVER + "/api/auth/v1/status");
    } catch (e) {
      console.log("Waiting for server to start...");
    }
    if (!res) await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!didSetup) {
    await setupServer();
    didSetup = true;
  }
};

export const fetchServer = async <T>(
  method: "POST" | "GET" | "PUT",
  path: string,
  body?: any,
  options?: any
): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(SERVER + path.replace(/^\/+/, ""), {
      method,
      ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (options?.raw) return res as unknown as T;
    return res.json() as unknown as T;
  } catch (e) {
    console.log(res);
    console.error(e);
    return {} as T;
  }
};

export const setupServer = async () => {};
