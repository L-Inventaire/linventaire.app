import _ from "lodash";
import platform from "../../../platform";
import { Context, NotFoundError } from "../../../types";
import Users, { UsersDefinition } from "../entities/users";
import { getUser, setAvatar } from "./system";

export const getSelf = async (ctx: Context) => {
  const driver = await platform.Db.getService();
  const user = await driver.selectOne<Users>(ctx, UsersDefinition.name, {
    id: ctx.id,
  });

  const cleanUser: Pick<Users, "full_name" | "preferences"> & {
    id: string;
    email: string;
    phone: string;
  } = {
    id: user.id,
    email: user.id_email,
    phone: user.id_phone,
    full_name: user.full_name,
    preferences: user.preferences,
  };

  return cleanUser;
};

export const getPublicUser = async (
  ctx: Context,
  id: string,
  email: string,
  phone: string
) => {
  const user = await getUser(ctx, id, email, phone);

  if (!user) {
    throw NotFoundError("User not found");
  }

  return {
    id: user.id,
    email: email || ctx.role === "SYSTEM" ? user.id_email : null,
    phone: phone || ctx.role === "SYSTEM" ? user.id_phone : null,
    avatar: user.preferences.avatar,
    full_name: user.full_name,
  };
};

export const getAvatar = async (_ctx: Context, userId: string) => {
  userId = userId.replace(/[/]/g, "");
  const content = await platform.S3.download(`/avatars/${userId}.png`);
  const base64 = Buffer.from(content).toString("base64");
  return Buffer.from(base64.split(",").pop(), "base64");
};

export const updatePreferences = async (
  ctx: Context,
  body: Partial<Users["preferences"]> & { full_name: string }
) => {
  if (typeof body.avatar === "string") {
    await setAvatar(ctx, ctx.id, body.avatar);
  }

  const db = await platform.Db.getService();
  return await db.transaction(ctx, async (ctx) => {
    const user = await db.selectOne<Users>(
      ctx,
      UsersDefinition.name,
      { id: ctx.id },
      {}
    );

    user.preferences = Object.assign(
      user.preferences,
      _.pick(body, "language", "currency")
    );

    if (body?.full_name) {
      user.full_name = body.full_name;
    }

    await db.update<Users>(
      ctx,
      UsersDefinition.name,
      { id: ctx.id },
      { preferences: user.preferences, full_name: user.full_name }
    );

    return user.preferences;
  });
};
