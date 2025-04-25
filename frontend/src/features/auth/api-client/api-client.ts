import { fetchServer } from "@features/utils/fetch-server";

export class AuthApiClient {
  static getAvailableMFAs = async (email?: string) => {
    const response = await fetchServer(`/api/auth/v1/mfa/methods`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data as {
      methods: {
        id: string;
        method: "app" | "phone" | "email" | "password";
      }[];
      current_authentication_factors: number;
    };
  };

  static requestEmailMFA = async (email: string, captchaValidation: string) => {
    const response = await fetchServer(
      `/api/auth/v1/mfa/methods/email/request`,
      {
        method: "POST",
        body: JSON.stringify({ email, captcha_validation: captchaValidation }),
      }
    );
    const data = await response.json();
    return data as {
      expire: number;
      success: boolean;
      token: string;
      type: "email";
    };
  };

  static verifyEmailMFA = async (token: string, code: string) => {
    const response = await fetchServer(
      `/api/auth/v1/mfa/methods/email/validate`,
      {
        method: "POST",
        body: JSON.stringify({ token, code }),
      }
    );
    const data = await response.json();
    return data as {
      success: boolean;
      validation_token: string;
      type: "email";
    };
  };

  static requestPhoneMFA = async (phone: string, captchaValidation: string) => {
    const response = await fetchServer(
      `/api/auth/v1/mfa/methods/phone/request`,
      {
        method: "POST",
        body: JSON.stringify({ phone, captcha_validation: captchaValidation }),
      }
    );
    const data = await response.json();
    return data as {
      expire: number;
      success: boolean;
      token: string;
      type: "phone";
    };
  };

  static verifyPhoneMFA = async (token: string, code: string) => {
    const response = await fetchServer(
      `/api/auth/v1/mfa/methods/phone/validate`,
      {
        method: "POST",
        body: JSON.stringify({ token, code }),
      }
    );
    const data = await response.json();
    return data as {
      success: boolean;
      validation_token: string;
      type: "phone";
    };
  };

  static verifyPasswordMFA = async (email: string, code: string) => {
    const response = await fetchServer(
      `/api/auth/v1/mfa/methods/password/validate`,
      {
        method: "POST",
        body: JSON.stringify({ email, code }),
      }
    );
    const data = await response.json();
    return data as {
      success: boolean;
      validation_token: string;
      type: "password";
    };
  };

  static verifyAppMFA = async (token: string, code: string) => {
    const response = await fetchServer(
      `/api/auth/v1/mfa/methods/app/validate`,
      {
        method: "POST",
        body: JSON.stringify({ token, code }),
      }
    );
    const data = await response.json();
    return data as {
      success: boolean;
      validation_token: string;
      type: "app";
    };
  };

  static extendToken = async (
    validatonToken?: string,
    fa2ValidationToken?: string,
    email?: string
  ) => {
    const response = await fetchServer(`/api/auth/v1/token`, {
      method: "POST",
      body: JSON.stringify({
        auth_validation_token: validatonToken,
        fa2_validation_token: fa2ValidationToken,
        email,
      }),
    });
    const data = await response.json();
    return data as {
      token?: string;
      methods?: {
        id: string;
        method: "app" | "phone" | "email" | "password";
      }[];
      error?: string;
      need_fa2_validation_token?: boolean;
    };
  };
}
