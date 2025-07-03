import Env from "@config/environment";
import { AuthJWT } from "@features/auth/jwt";

export interface SignatureResponse {
  date: string;
  svg: string;
  full_name: string;
  server_signature: string;
}

export class SignatureApiClient {
  static saveSignature = async (
    clientId: string,
    svg: string,
    fullName?: string
  ): Promise<SignatureResponse> => {
    const url = `/api/fields/v1/${clientId}/signatures`;

    const response = await fetch(Env.server + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AuthJWT.token}`,
      },
      body: JSON.stringify({
        svg,
        full_name: fullName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save signature: ${response.status}`);
    }

    return (await response.json()) as SignatureResponse;
  };
}
