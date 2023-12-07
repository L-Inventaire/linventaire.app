import Env from "@config/environment";
import { AuthJWT } from "../auth/jwt";

export const fetchServer = async (
  url: string,
  options: RequestInit
): Promise<Response> => {
  const domain = Env.server.replace(/\/$/, "");
  options.headers = {
    ...(AuthJWT.token ? { Authorization: `Bearer ${AuthJWT.token}` } : {}),
    ...options.headers,
    "Content-Type": "application/json",
  };
  const data = await fetch(domain + url, options);
  return data;
};
