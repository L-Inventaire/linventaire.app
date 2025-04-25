import config from "config";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ValidResponse, BadRequestError, Context } from "../../../types";
import platform from "../../../platform";
import { AuthValidationJwtPayload } from "../types";
import { getStableOtp } from "../../../services/utils";

export const requestEmailValidation = async (
  ctx: Context,
  body: { email: string; captcha_validation?: string }
): Promise<ValidResponse> => {
  const email = (body.email || "").replace(/ /gm, "").toLocaleLowerCase();

  const randomDigits = getStableOtp(body.email);

  if (!body.email) {
    throw BadRequestError("Email value is required");
  }

  //Verify there is a captcha validation if user isn't logged in
  if (!platform.Captcha.verify(ctx, body.captcha_validation)) {
    throw BadRequestError("Captcha validation failed for unlogged user");
  }

  const message = platform.I18n.t(ctx, "emails.otp.message", {
    replacements: {
      val: `${`${randomDigits}`.slice(0, 4)}-${`${randomDigits}`.slice(4)}`,
    },
  });

  platform.PushEMail.push(ctx, email, message, {
    subject: platform.I18n.t(ctx, "emails.otp.subject"),
  });

  const expire = new Date().getTime() + 1000 * 60 * 30;

  const token = jwt.sign(
    {
      token: crypto
        .createHash("sha256")
        .update(
          randomDigits.toString() +
            body.email +
            expire +
            config.get<string>("jwt.secret")
        )
        .digest("base64"),
      email: body.email,
      expire,
    },
    config.get<string>("jwt.secret"),
    { expiresIn: 60 * 60 }
  );

  return {
    token,
    expire,
    success: true,
    type: "email",
  };
};

export const verifyEmailValidationCode = async (
  ctx: Context,
  body: { code: string; token: string }
): Promise<ValidResponse> => {
  body.code = body.code.replace(/[^0-9]/gm, "");

  const tokenInJwt = jwt.verify(
    body.token,
    config.get<string>("jwt.secret")
  ) as {
    token: string;
    expire: number;
    email: string;
  };

  const token = crypto
    .createHash("sha256")
    .update(
      body.code +
        tokenInJwt.email +
        tokenInJwt.expire +
        config.get<string>("jwt.secret")
    )
    .digest("base64");

  if (tokenInJwt.expire < new Date().getTime()) {
    throw BadRequestError("Challenge expired");
  }

  if (token !== tokenInJwt.token) {
    throw BadRequestError("Invalid code");
  }

  return {
    success: true,
    type: "email",
    validation_token: jwt.sign(
      { type: "email", email: tokenInJwt.email } as AuthValidationJwtPayload,
      config.get<string>("jwt.secret"),
      { expiresIn: 60 * 30 }
    ),
  };
};
