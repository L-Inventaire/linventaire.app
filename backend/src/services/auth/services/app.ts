import config from "config";
import jwt from "jsonwebtoken";
import totp from "totp-generator";
import Services from "../../../services";
import { AuthValidationJwtPayload } from "../types";
import { ValidResponse, BadRequestError, Context } from "../../../types";

export const verifyAppValidationCode = async (
  ctx: Context,
  body: { code: string; token: string }
): Promise<ValidResponse> => {
  if (!ctx.id && !body.token) {
    throw BadRequestError("Invalid request");
  }

  const user = await Services.Users.getUser(ctx, {
    id: ctx.id,
    email: body.token,
  });

  const challenge = (user?.mfas?.list || []).find(
    (mfa) => mfa.type === "app"
  ).value;

  if (!user || !challenge) {
    throw BadRequestError("Invalid request");
  }

  if (
    body.code !==
    totp(challenge, {
      period: 30,
      algorithm: "SHA-512",
      digits: body.code.length,
      timestamp: new Date().getTime(),
    })
  ) {
    throw BadRequestError("Invalid code");
  }

  return {
    success: true,
    type: "app",
    validation_token: jwt.sign(
      { type: "app", user_id: user.id } as AuthValidationJwtPayload,
      config.get<string>("jwt.secret"),
      { expiresIn: 60 * 30 }
    ),
  };
};
