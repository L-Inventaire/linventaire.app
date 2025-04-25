import config from "config";
import jwt from "jsonwebtoken";
import { v4 } from "uuid";
import { Context, BadRequestError, ValidResponse } from "../../../types";
import platform from "../../../platform";
import { getOrVerifyHash } from "../../common";
import Users, { UsersDefinition } from "../entities/users";

export const signup = async (
  ctx: Context,
  body: {
    captcha_validation?: string;
    email_validation?: string;
    phone_validation?: string;
    full_name: string;
    language?: string;
    id?: string;
    password?: string;
  }
): Promise<ValidResponse> => {
  const db = await platform.Db.getService();

  // Verify captcha validation
  if (
    ctx.role !== "SYSTEM" &&
    !(await platform.Captcha.verify(ctx, body.captcha_validation))
  ) {
    throw BadRequestError("Captcha validation failed");
  }

  let email = "";
  let phone = "";

  // Verify email validation
  if (body.email_validation) {
    if (jwt.verify(body.email_validation, config.get<string>("jwt.secret"))) {
      email = (jwt.decode(body.email_validation) as any).email;
      email = (email || "").toLocaleLowerCase().trim();
    }
  }

  // Verify phone validation
  if (body.phone_validation) {
    if (jwt.verify(body.phone_validation, config.get<string>("jwt.secret"))) {
      phone = (jwt.decode(body.phone_validation) as any).phone;
      phone = (phone || "").toLocaleLowerCase().replace(/ /gm, "");
    }
  }

  //User must have at least one way to authenticate
  if (!email) {
    throw BadRequestError(
      "At least one email must be provided to create the account."
    );
  }

  //Initiate MFA for the user
  const mfas: Users["mfas"]["list"] = [];
  if (email)
    mfas.push({
      id: v4(),
      type: "email",
      value: email,
    });

  if (phone)
    mfas.push({
      id: v4(),
      type: "phone",
      value: phone,
    });

  if (ctx.role === "SYSTEM" && body.password) {
    mfas.push({
      id: v4(),
      type: "password",
      value: (await getOrVerifyHash(body.password)) as string,
    });
  }

  //We can create the user object now
  const user: Users = {
    id: v4(),
    role: "USER",
    created_at: new Date().getTime(),
    mfas: { list: mfas },
    id_email: email?.toLocaleLowerCase() || "",
    id_phone: phone || "",
    full_name: body.full_name,
    preferences: {
      avatar: "",
      language: platform.I18n.getLanguage(ctx, body.language),
    },
  };

  if (process?.env?.NODE_ENV?.toLocaleLowerCase() === "tests" && body.id) {
    user.id = body.id;
  }

  await db.transaction(ctx, async (ctx) => {
    let existing = [];

    //We do not anymore prevent the creation of multiple accounts with the same phone number

    if (user.id_email)
      existing = await db.select<Users>(
        ctx,
        UsersDefinition.name,
        { id_email: user.id_email?.toLocaleLowerCase() },
        {}
      );
    if (existing.length !== 0)
      throw BadRequestError(
        "User with email " + user.id_email + " already exists"
      );

    existing = await db.select<Users>(
      ctx,
      UsersDefinition.name,
      { id: user.id },
      {}
    );
    if (existing.length !== 0)
      throw BadRequestError("User was already created");

    await db.insert(ctx, UsersDefinition.name, user);
  });

  return user;
};
