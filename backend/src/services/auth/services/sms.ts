import config from "config";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ValidResponse, BadRequestError, Context } from "../../../types";
import platform from "../../../platform";
import { AuthValidationJwtPayload } from "../types";
import { getStableOtp } from "../../../services/utils";

export const requestSmsValidation = async (
  ctx: Context,
  body: { phone: string; captcha_validation?: string }
): Promise<ValidResponse> => {
  const phone = (body.phone || "").replace(/[^0-9+]/gm, "").toLocaleLowerCase();

  if (!body.phone) {
    throw BadRequestError("Phone number is required");
  }

  //Verify there is a captcha validation if user isn't logged in
  if (!(await platform.Captcha.verify(ctx, body.captcha_validation))) {
    throw BadRequestError("Captcha validation failed for unlogged user");
  }

  const randomDigits = getStableOtp(body.phone);

  const message = platform.I18n.t(ctx, "sms.otp.message", {
    replacements: {
      val: `${`${randomDigits}`.slice(0, 4)}-${`${randomDigits}`.slice(4)}`,
    },
  });

  platform.PushTextMessage.push(ctx, phone, message, "L'Inventaire");

  const expire = new Date().getTime() + 1000 * 60 * 30;

  const token = jwt.sign(
    {
      token: crypto
        .createHash("sha256")
        .update(
          randomDigits.toString() +
            body.phone +
            expire +
            config.get<string>("jwt.secret")
        )
        .digest("base64"),
      phone: body.phone,
      expire,
    },
    config.get<string>("jwt.secret"),
    { expiresIn: 60 * 60 }
  );

  return {
    token,
    expire,
    success: true,
  };
};

export const verifySmsValidationCode = async (
  ctx: Context,
  body: { phone: string; code: string; token: string; expire: number }
): Promise<ValidResponse> => {
  body.code = body.code.replace(/[^0-9]/gm, "");

  const tokenInJwt = jwt.verify(
    body.token,
    config.get<string>("jwt.secret")
  ) as {
    token: string;
    expire: number;
    phone: string;
  };

  const token = crypto
    .createHash("sha256")
    .update(
      body.code +
        tokenInJwt.phone +
        tokenInJwt.expire +
        config.get<string>("jwt.secret")
    )
    .digest("base64");

  if (body.expire < new Date().getTime()) {
    throw BadRequestError("Challenge expired");
  }

  if (token !== tokenInJwt.token) {
    throw BadRequestError("Invalid code");
  }

  return {
    success: true,
    type: "phone",
    validation_token: jwt.sign(
      { type: "phone", phone: tokenInJwt.phone } as AuthValidationJwtPayload,
      config.get<string>("jwt.secret"),
      { expiresIn: 60 * 30 }
    ),
  };
};
