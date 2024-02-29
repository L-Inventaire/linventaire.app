import { fetchServer } from "@features/utils/fetch-server";
import { Customer, PublicCustomer } from "../types/customers";

export class CustomersApiClient {
  static createAccount = async (
    captcha_validation: string,
    email_validation: string,
    phone_validation?: string,
    full_name?: string
  ): Promise<Customer> => {
    const response = await fetchServer(`/api/users/v1/users`, {
      method: "POST",
      body: JSON.stringify({
        captcha_validation,
        email_validation,
        phone_validation,
        full_name,
      }),
    });
    const data = await response.json();
    return data as Customer;
  };

  static getAccount = async (): Promise<Customer> => {
    const response = await fetchServer(`/api/users/v1/users/me`, {
      method: "GET",
    });
    const data = await response.json();
    return data as Customer;
  };

  static setPreferences = async (
    preferences: Omit<Customer["preferences"], "version_id"> & {
      full_name?: string;
    }
  ): Promise<Customer> => {
    const response = await fetchServer(`/api/users/v1/users/preferences`, {
      method: "POST",
      body: JSON.stringify({
        ...preferences,
      }),
    });
    const data = await response.json();
    return data as Customer;
  };

  static searchUser = async (
    query: string,
    type?: "id" | "email" | "phone"
  ) => {
    if (!query) {
      return null;
    }

    if (!type) {
      if (query.indexOf("@") > 0) {
        type = "email";
      } else if (
        query.length === 36 &&
        query.replace(/[^-]/gm, "").length === 4 &&
        query.replace(/[^0-9a-f]/gm, "").length === 4
      ) {
        type = "id";
      } else if (query.replace(/[^0-9]/gm, "").length > 6) {
        type = "phone";
      } else {
        return null;
      }
    }

    if (type === "phone") {
      query = query.replace(/[^0-9]/gm, "");
    }

    const response = await fetchServer(
      `/api/users/v1/users?${[
        ...(type === "id" ? [`id=${encodeURIComponent(query)}`] : []),
        ...(type === "email" ? [`email=${encodeURIComponent(query)}`] : []),
        ...(type === "phone" ? [`phone=${encodeURIComponent(query)}`] : []),
      ].join("&")}`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    if (!data?.id) {
      return null;
    }
    return data as PublicCustomer;
  };
}
