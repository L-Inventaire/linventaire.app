export type AuthValidationJwtPayload =
  | {
      type: "password";
      email: string;
      phone: string;
    }
  | {
      type: "email";
      email: string;
    }
  | {
      type: "phone";
      phone: string;
    }
  | {
      type: "app";
      user_id: string;
      secret: string;
    };
