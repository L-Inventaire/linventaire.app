import config from "config";
import jwt from "jsonwebtoken";
import {
  ValidResponse,
  BadRequestError,
  Context,
  ForbiddenError,
} from "../../../types";
import Services from "../../../services";
import Users from "../../users/entities/users";
import { AuthValidationJwtPayload } from "../types";

const expirationByType = {
  email: 1000 * 60 * 60 * 24,
  password: 1000 * 60 * 60 * 24,
  phone: 1000 * 60 * 60 * 1,
  app: 1000 * 60 * 60 * 1,
};

//Note: if user isn't logged in yet, only "email or password" is allowed

export const extendOrUpdateToken = async (
  ctx: Context,
  body: { auth_validation_token: string; fa2_validation_token?: string }
): Promise<ValidResponse> => {
  let mfas = ctx.mfa;
  let renewing = false;

  let user: Users = null;
  if (ctx.id) {
    renewing = true;
    user = await Services.Users.getUser(ctx, { id: ctx.id });
  }

  if (body.auth_validation_token) {
    const decoded = jwt.verify(
      body.auth_validation_token,
      config.get<string>("jwt.secret")
    ) as AuthValidationJwtPayload;
    if (decoded) {
      if (!ctx.id) {
        if (decoded.type !== "email" && decoded.type !== "password") {
          throw ForbiddenError(
            "Only email and password are allowed as primary authenticators."
          );
        }
      } else {
        //Verified item MUST match user phone or email
        if (decoded.type === "phone") {
          if (decoded.phone !== user.id_phone)
            throw BadRequestError("Invalid phone");
        } else if (decoded.type === "app") {
          if (decoded.user_id !== ctx.id)
            throw BadRequestError("Invalid user mfa token");
        } else if (
          !(decoded as any).email ||
          (decoded as any).email !== user.id_email
        ) {
          throw BadRequestError("Invalid email");
        }
      }

      if (
        !user &&
        (decoded.type === "password" || decoded.type == "phone") &&
        decoded.phone
      ) {
        user = await Services.Users.getUser(ctx, {
          phone: decoded.phone,
        });
      }

      if (
        !user &&
        (decoded.type === "password" || decoded.type == "email") &&
        decoded.email
      ) {
        user = await Services.Users.getUser(ctx, {
          email: decoded.email,
        });
      }

      if (user) {
        mfas = mfas.filter((mfa) => mfa.method !== decoded.type);
        if (user.mfas.list.find((mfa) => mfa.type === decoded.type)) {
          mfas.push({
            method: decoded?.type,
            exp:
              new Date().getTime() +
              (expirationByType[decoded.type] || 1000 * 60 * 5),
          });
        }
      }
    }
  }

  if (!user) {
    throw BadRequestError("No user found");
  }

  ctx.id = user.id;
  ctx.created_at = new Date().getTime();
  ctx.role = (user.role === "DISABLED" ? "NOTHING" : user.role) || "USER";
  ctx.mfa = mfas;

  //Extends base mfa expiration
  const mfaPriority = ["password", "email", "phone", "app"];
  const mfaCanBeExtended = ["password", "email"];
  const sortedMfas = user.mfas.list.sort(
    (a, b) => mfaPriority.indexOf(a.type) - mfaPriority.indexOf(b.type)
  );
  ctx.mfa.forEach((a, i) => {
    if (
      a.method === sortedMfas[0].type &&
      mfaCanBeExtended.includes(a.method)
    ) {
      ctx.mfa[i].exp +=
        new Date().getTime() + (expirationByType[a.method] || 1000 * 60 * 5);
    }
  });

  const newToken = jwt.sign(ctx, config.get<string>("jwt.secret"), {
    expiresIn: 60 * 60 * 24,
  });

  // During first login, if user has app or phone mfa, we need to ask for a fa2_validation_token
  if (
    user.mfas?.list?.find(
      (mfa) => mfa.type === "app" || mfa.type === "phone"
    ) &&
    !renewing
  ) {
    if (body.fa2_validation_token) {
      return await extendOrUpdateToken(ctx, {
        auth_validation_token: body.fa2_validation_token,
      });
    }
    const methods = await getMethods(ctx, {});
    methods.methods = methods.methods.filter(
      (m) => m.method === "app" || m.method === "phone"
    );
    return { ...methods, need_fa2_validation_token: true };
  }

  return {
    token: newToken,
  };
};

export const getMethods = async (
  ctx: Context,
  body: { email?: string; phone?: string }
): Promise<ValidResponse> => {
  let methods: { id: string; method: string }[] = [];
  let user = null;

  if (!ctx.id && !body.email && !body.phone) {
    throw BadRequestError("You must be logged in or send email or phone.");
  }

  if (ctx.id) {
    user = await Services.Users.getUser(ctx, { id: ctx.id });
  }
  if (body.email) {
    user = await Services.Users.getUser(ctx, { email: body.email });
  }
  if (body.phone) {
    user = await Services.Users.getUser(ctx, { phone: body.phone });
  }

  if (user) {
    user.mfas.list.forEach((mfa) => {
      methods.push({
        id: mfa.type,
        method: mfa.type,
      });
    });
  } else {
    if (body.email) {
      methods = [
        {
          id: "email",
          method: "email",
        },
      ];
    }
    if (body.phone) {
      methods = [
        {
          id: "phone",
          method: "phone",
        },
      ];
    }
  }

  //Remove mfa already present in token except secondary MFA that can be asked several time
  methods = methods.filter(
    (method) =>
      !(ctx.mfa || [])
        .map((mfa) => mfa.method)
        .includes(method.method as any) ||
      ["phone", "app"].includes(method.method)
  );

  if (!ctx.id) {
    //Only email and password are allowed as primary authenticators.
    methods = methods.filter((m) => {
      return m.method === "email" || m.method === "password";
    });
  }

  return {
    methods,
    current_authentication_factors: ctx.mfa.length,
  };
};
