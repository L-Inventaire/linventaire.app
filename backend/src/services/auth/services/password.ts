import config from "config";
import jwt from "jsonwebtoken";
import Services from "../../../services";
import { Context, ForbiddenError, ValidResponse } from "../../../types";
import { getOrVerifyHash } from "../../common";
import { AuthValidationJwtPayload } from "../types";

export const verifyPassword = async (
  ctx: Context,
  body: { email?: string; phone?: string; code: string }
): Promise<ValidResponse> => {
  let user = null;
  if (body.email) {
    user = await Services.Users.getUser(ctx, {
      email: body.email,
    });
  }
  if (body.phone) {
    user = await Services.Users.getUser(ctx, {
      phone: body.phone,
    });
  }

  if (body.code.length < 6) {
    throw ForbiddenError("Invalid password");
  }

  if (!user || !user.mfas.list.find((mfa) => mfa.type === "password")) {
    throw ForbiddenError("Invalid password");
  }

  const challenge = user.mfas.list.find((mfa) => mfa.type === "password").value;

  if (!challenge) {
    throw ForbiddenError("Invalid password");
  }

  //check password is ok for user
  if ((await getOrVerifyHash(body.code, challenge)) !== true) {
    throw ForbiddenError("Invalid password");
  }

  return {
    success: true,
    type: "password",
    validation_token: jwt.sign(
      {
        type: "password",
        email: body.email,
        phone: body.phone,
      } as AuthValidationJwtPayload,
      config.get<string>("jwt.secret"),
      { expiresIn: 60 * 30 }
    ),
  };
};
