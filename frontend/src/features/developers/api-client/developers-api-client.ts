import { fetchServer } from "@features/utils/fetch-server";
import {
  ApiCall,
  ApiCallsStats,
  Paginated,
  Webhook,
  WebhookDelivery,
  WebhookWithSecret,
} from "../types/types";

const base = (clientId: string) => `/api/developers/v1/${clientId}`;

const json = async <T>(response: Response, error: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (response.status !== 200) {
    throw new Error(data?.message || error);
  }
  return data as T;
};

const query = (params: Record<string, any>) => {
  const search = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, `${v}`]),
  ).toString();
  return search ? `?${search}` : "";
};

export type WebhookInput = Pick<
  Webhook,
  "name" | "url" | "entities" | "events"
> & { enabled?: boolean };

export class WebhooksApiClient {
  static list = async (clientId: string, all = false) =>
    json<Webhook[]>(
      await fetchServer(
        `${base(clientId)}/webhooks${query({ all: all ? 1 : "" })}`,
      ),
      "Error getting webhooks",
    );

  static create = async (clientId: string, body: WebhookInput) =>
    json<WebhookWithSecret>(
      await fetchServer(`${base(clientId)}/webhooks`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
      "Error creating webhook",
    );

  static update = async (
    clientId: string,
    id: string,
    body: Partial<WebhookInput>,
  ) =>
    json<Webhook>(
      await fetchServer(`${base(clientId)}/webhooks/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
      "Error updating webhook",
    );

  static remove = async (clientId: string, id: string) =>
    json<boolean>(
      await fetchServer(`${base(clientId)}/webhooks/${id}`, {
        method: "DELETE",
      }),
      "Error deleting webhook",
    );

  static rotateSecret = async (clientId: string, id: string) =>
    json<WebhookWithSecret>(
      await fetchServer(`${base(clientId)}/webhooks/${id}/rotate-secret`, {
        method: "POST",
      }),
      "Error rotating secret",
    );

  static test = async (clientId: string, id: string) =>
    json<WebhookDelivery>(
      await fetchServer(`${base(clientId)}/webhooks/${id}/test`, {
        method: "POST",
      }),
      "Error testing webhook",
    );

  static deliveries = async (
    clientId: string,
    id: string,
    params: { status?: string; limit?: number; offset?: number },
  ) =>
    json<Paginated<WebhookDelivery>>(
      await fetchServer(
        `${base(clientId)}/webhooks/${id}/deliveries${query(params)}`,
      ),
      "Error getting deliveries",
    );

  static delivery = async (clientId: string, id: string, deliveryId: string) =>
    json<WebhookDelivery>(
      await fetchServer(
        `${base(clientId)}/webhooks/${id}/deliveries/${deliveryId}`,
      ),
      "Error getting delivery",
    );

  static retry = async (clientId: string, id: string, deliveryId: string) =>
    json<WebhookDelivery>(
      await fetchServer(
        `${base(clientId)}/webhooks/${id}/deliveries/${deliveryId}/retry`,
        { method: "POST" },
      ),
      "Error retrying delivery",
    );
}

export type ApiCallsFilters = {
  all?: boolean;
  api_key_id?: string;
  status?: "success" | "error" | "";
};

export class ApiCallsApiClient {
  static list = async (
    clientId: string,
    filters: ApiCallsFilters & { limit?: number; offset?: number },
  ) =>
    json<Paginated<ApiCall>>(
      await fetchServer(
        `${base(clientId)}/api-calls${query({
          ...filters,
          all: filters.all ? 1 : "",
        })}`,
      ),
      "Error getting api calls",
    );

  static stats = async (clientId: string, filters: ApiCallsFilters) =>
    json<ApiCallsStats>(
      await fetchServer(
        `${base(clientId)}/api-calls/stats${query({
          api_key_id: filters.api_key_id,
          all: filters.all ? 1 : "",
        })}`,
      ),
      "Error getting api calls statistics",
    );

  static get = async (clientId: string, id: string) =>
    json<ApiCall>(
      await fetchServer(`${base(clientId)}/api-calls/${id}`),
      "Error getting api call",
    );
}
