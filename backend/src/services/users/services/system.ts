import { Context } from "../../../types";
import platform from "../../../platform";
import Users, { UsersDefinition } from "../entities/users";

export const getUser = async (
  ctx: Context,
  id: string,
  email: string,
  phone: string
) => {
  email = (email || "").toLocaleLowerCase().trim();
  phone = (phone || "").toLocaleLowerCase().replace(/ /gm, "");

  if (!id && !email && !phone) {
    throw new Error("At least one of id, email or phone must be provided");
  }

  const driver = await platform.Db.getService();
  const user = await driver.selectOne<Users>(ctx, UsersDefinition.name, {
    id: id || undefined,
    id_email: email?.toLocaleLowerCase() || undefined,
    id_phone: phone || undefined,
  });

  return user;
};

export const setAvatar = async (
  ctx: Context,
  id: string,
  avatar: string
): Promise<void> => {
  const db = await platform.Db.getService();
  await db.transaction(ctx, async (ctx) => {
    const user = await db.selectOne<Users>(
      ctx,
      UsersDefinition.name,
      { id },
      {}
    );

    if (avatar && avatar.length > 0 && avatar.indexOf("/api/") === -1) {
      //Upload avatar and store url to preferences
      //      const base64Data = Buffer.from(avatar.split(",").pop(), "base64");
      await platform.S3.upload(
        `/avatars/${user.id}.png`,
        Buffer.from(avatar.split(",").pop(), "base64")
      );
      avatar = `/api/users/v1/users/${user.id}/avatar?t=${Date.now()}`;
    }

    user.preferences = Object.assign(user.preferences, { avatar });

    await db.update<Users>(
      ctx,
      UsersDefinition.name,
      { id },
      { preferences: user.preferences }
    );

    return user.preferences;
  });
};
