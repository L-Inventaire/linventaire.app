import { fetchServer } from "@features/utils/fetch-server";

export type MethodType = {
  id: string;
  type: "email" | "phone" | "app" | "password";
  value: string;
};

export class CustomersMfasApiClient {
  static getMFAs = async () => {
    const response = await fetchServer(`/api/customers/v1/customers/mfa`, {
      method: "GET",
    });
    const data = await response.json();
    return data as {
      methods: MethodType[];
    };
  };

  static setMFA = async (mfa: {
    type: "email" | "phone" | "app" | "password";
    value: string;
    validation_token: string;
  }) => {
    await fetchServer(`/api/customers/v1/customers/mfa`, {
      method: "POST",
      body: JSON.stringify(mfa),
    });
    return CustomersMfasApiClient.getMFAs();
  };

  static deleteMFA = async (id: string) => {
    await fetchServer(`/api/customers/v1/customers/mfa/${id}`, {
      method: "DELETE",
    });
    return CustomersMfasApiClient.getMFAs();
  };
}
