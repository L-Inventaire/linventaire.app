import { fetchServer } from "@features/utils/fetch-server";
import _ from "lodash";
import { SchemaType } from "../types/types";

/** This will group the GET requests into a single batch if requested under 10ms */
const fetchServerBatch = (() => {
  let pendingRequests: {
    [key: string]: {
      url: string;
      body?: any;
      resolves: ((res: any) => void)[];
    }[];
  } = {};
  let timeoutId: { [key: string]: NodeJS.Timeout | null } = {};

  const sendBatchRequest = async (clientId: string) => {
    const requestsToBatch = _.cloneDeep(pendingRequests);
    pendingRequests[clientId] = [];
    timeoutId[clientId] = null;

    const batchBody = requestsToBatch[clientId].map((req) => ({
      u: req.url,
      ...(req.body ? { d: req.body } : {}),
    }));

    const res = await fetchServer("/api/rest/v1/" + clientId + "/batch", {
      method: "POST",
      body: JSON.stringify(batchBody),
    });

    const jsonResponses = (await res.json()) as { status: number; body: any }[];
    requestsToBatch[clientId].forEach((req, index) => {
      req.resolves.map((r) => r(jsonResponses[index]));
    });
  };

  return (clientId: string, url: string, body?: any): Promise<any> => {
    return new Promise((resolve) => {
      const matchingRequest = pendingRequests[clientId]?.find(
        (req) => req.url === url && _.isEqual(req.body, body)
      );

      if (matchingRequest) {
        matchingRequest.resolves.push(resolve);
      } else {
        url = url.replace(/\/api\/rest\/v1\/.*?\//, "");
        pendingRequests[clientId] = pendingRequests[clientId] || [];
        const obj = { url, body, resolves: [resolve] };
        if (!obj.body) delete obj.body;
        pendingRequests[clientId].push(obj);
      }

      if (!timeoutId[clientId]) {
        timeoutId[clientId] = setTimeout(() => {
          sendBatchRequest(clientId);
        }, 10); // Delay batching for 10ms
      }
    });
  };
})();

export class RestApiClient<T> {
  constructor(private table: string) {}

  schema = async (clientId: string): Promise<{ [key: string]: any }> => {
    return (await (
      await fetchServer(`/api/rest/v1/${clientId}/${this.table}/schema`)
    ).json()) as SchemaType;
  };

  suggestions = async (
    clientId: string,
    column: string,
    query?: string
  ): Promise<
    {
      value: any;
      label?: string;
      item?: any;
      count?: number;
      updated?: number;
    }[]
  > => {
    const tmp = await (
      await fetchServer(`/api/rest/v1/${clientId}/${this.table}/suggestions`, {
        method: "POST",
        body: JSON.stringify({ column, query }),
      })
    ).json();
    if (_.isArray(tmp)) return tmp;
    return [];
  };

  history = async (
    clientId: string,
    id: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ total: number; list: T[]; has_more: boolean }> => {
    const tmp = await fetchServer(
      `/api/rest/v1/${clientId}/${this.table}/${id}/history?limit=${limit}&offset=${offset}`
    );
    if (tmp.status === 200) return await tmp.json();
    throw new Error("Error fetching data");
  };

  list = async (
    clientId: string,
    query?: Partial<T> | any,
    options?: {
      limit?: number;
      offset?: number;
      asc?: boolean;
    }
  ): Promise<{ total: number; list: T[] }> => {
    const tmp = await fetchServerBatch(
      clientId,
      `/api/rest/v1/${clientId}/${this.table}/search`,
      { query, options }
    );
    if (tmp.status === 200) return tmp.body;
    throw new Error("Error fetching data");
  };

  get = async (clientId: string, id: string): Promise<T> => {
    const tmp = await fetchServerBatch(
      clientId,
      `/api/rest/v1/${clientId}/${this.table}/${id}`
    );
    if (tmp.status === 200) return tmp.body;
    throw new Error("Error fetching data");
  };

  create = async (clientId: string, item: Partial<T>): Promise<T> => {
    const resp = await await fetchServer(
      `/api/rest/v1/${clientId}/${this.table}`,
      {
        method: "POST",
        body: JSON.stringify(item),
      }
    );

    if (resp.status !== 200) {
      throw new Error("Error updating data");
    }

    return resp.json();
  };

  update = async (
    clientId: string,
    item: Partial<T>,
    id?: string
  ): Promise<T> => {
    const resp = await await fetchServer(
      `/api/rest/v1/${clientId}/${this.table}/${(item as any).id || id}`,
      {
        method: "PUT",
        body: JSON.stringify(item),
      }
    );

    if (resp.status !== 200) {
      throw new Error("Error updating data");
    }

    return resp.json();
  };

  delete = async (clientId: string, id: string): Promise<void> => {
    const res = await fetchServer(
      `/api/rest/v1/${clientId}/${this.table}/${id}`,
      {
        method: "DELETE",
      }
    );
    if (res.status !== 200) {
      throw new Error("Error deleting data");
    }
  };

  restore = async (clientId: string, id: string): Promise<void> => {
    const res = await fetchServer(
      `/api/rest/v1/${clientId}/${this.table}/${id}/restore`,
      {
        method: "POST",
      }
    );
    if (res.status !== 200) {
      throw new Error("Error restoring data");
    }
  };
}
