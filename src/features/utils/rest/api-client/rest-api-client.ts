import { fetchServer } from "@features/utils/fetch-server";
import _ from "lodash";
import { SchemaType } from "../types/types";

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
  ): Promise<{ total: number; list: T[] }> => {
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
    const tmp = await fetchServer(
      `/api/rest/v1/${clientId}/${this.table}/search?${this.table}`,
      {
        method: "POST",
        body: JSON.stringify({ query, options }),
      }
    );
    if (tmp.status === 200) return await tmp.json();
    throw new Error("Error fetching data");
  };

  create = async (clientId: string, item: Partial<T>): Promise<T> => {
    return await (
      await fetchServer(`/api/rest/v1/${clientId}/${this.table}`, {
        method: "POST",
        body: JSON.stringify(item),
      })
    ).json();
  };

  update = async (
    clientId: string,
    item: Partial<T>,
    id?: string
  ): Promise<T> => {
    return await (
      await fetchServer(
        `/api/rest/v1/${clientId}/${this.table}/${(item as any).id || id}`,
        {
          method: "PUT",
          body: JSON.stringify(item),
        }
      )
    ).json();
  };

  delete = async (clientId: string, id: string): Promise<void> => {
    await fetchServer(`/api/rest/v1/${clientId}/${this.table}/${id}`, {
      method: "DELETE",
    });
  };
}
