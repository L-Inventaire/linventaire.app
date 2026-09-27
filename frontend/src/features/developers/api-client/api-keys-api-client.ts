import { fetchServer } from "@features/utils/fetch-server";
import { ApiKey, CreatedApiKey } from "../types/types";

const base = (clientId: string) => `/api/developers/v1/${clientId}/api-keys`;

const json = async <T>(response: Response, error: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (response.status !== 200) {
    throw new Error(data?.message || error);
  }
  return data as T;
};

export class ApiKeysApiClient {
  static list = async (clientId: string, all = false) =>
    json<ApiKey[]>(
      await fetchServer(`${base(clientId)}${all ? "?all=1" : ""}`),
      "Error getting api keys",
    );

  static create = async (
    clientId: string,
    body: { name: string; expires_at: number | null },
  ) =>
    json<CreatedApiKey>(
      await fetchServer(base(clientId), {
        method: "POST",
        body: JSON.stringify(body),
      }),
      "Error creating api key",
    );

  static revoke = async (clientId: string, id: string) =>
    json<ApiKey>(
      await fetchServer(`${base(clientId)}/${id}`, { method: "DELETE" }),
      "Error revoking api key",
    );
}
