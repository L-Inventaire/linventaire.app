import { fetchServer } from "@features/utils/fetch-server";
import { TenantDetails, TenantsList } from "./types";

const json = async <T>(response: Response, error: string): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (response.status !== 200) {
    throw new Error(data?.message || error);
  }
  return data as T;
};

export class AdminApiClient {
  static getTenants = async () =>
    json<TenantsList>(
      await fetchServer(`/api/admin/v1/tenants`),
      "Error getting companies",
    );

  static getTenant = async (id: string) =>
    json<TenantDetails>(
      await fetchServer(`/api/admin/v1/tenants/${encodeURIComponent(id)}`),
      "Error getting company",
    );
}
