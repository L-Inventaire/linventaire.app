import { fetchServer } from "@features/utils/fetch-server";

export class RestApiClient<T> {
  constructor(private table: string) {}

  schema = async (clientId: string): Promise<T[]> => {
    return await (
      await fetchServer(`/api/rest/v1/${clientId}/${this.table}/schema`)
    ).json();
  };

  list = async (
    clientId: string,
    query?: Partial<T> | any,
    options?: {
      limit?: number;
      offset?: number;
      asc?: boolean;
    }
  ): Promise<T[]> => {
    return await (
      await fetchServer(`/api/rest/v1/${clientId}/${this.table}/search`, {
        method: "POST",
        body: JSON.stringify({ query, options }),
      })
    ).json();
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
