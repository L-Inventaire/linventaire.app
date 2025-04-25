import config from "config";
import jwt from "jsonwebtoken";
import { v4 } from "uuid";
import platform from "../../../platform";
import { BadRequestError, Context, ForbiddenError } from "../../../types";
import { AuthValidationJwtPayload } from "../../auth/types";
import { getOrVerifyHash } from "../../common";
import Users, { UsersDefinition } from "../entities/users";

const allowedMfas = ["password", "phone", "email", "app"];

export const getMfas = async (ctx: Context) => {
  const driver = await platform.Db.getService();
  const user = await driver.select<Users>(ctx, UsersDefinition.name, {
    id: ctx.id,
  });
  if (user.length !== 1) {
    throw ForbiddenError("User not found");
  }
  const mfas = [];

  user[0]?.mfas.list.forEach((mfa) => {
    if (mfa.type === "password") {
      mfa.value = null;
    }
    mfas.push(mfa);
  });

  return { methods: mfas || [] };
};

export const upsertMfa = async (
  ctx: Context,
  body: { validation_token: string; type: string; value: string }
) => {
  let decoded: AuthValidationJwtPayload = {
    type: body.type,
  } as any;

  if (["email", "phone"].includes(body.type)) {
    decoded = jwt.verify(
      body.validation_token,
      config.get<string>("jwt.secret")
    ) as AuthValidationJwtPayload;

    if (!decoded) {
      throw BadRequestError("Invalid token");
    }
  }

  if (!allowedMfas.includes(body.type) || !allowedMfas.includes(decoded.type)) {
    throw BadRequestError("Invalid MFA type");
  }

  const db = await platform.Db.getService();
  return await db.transaction(ctx, async (ctx) => {
    const user = await db.selectOne<Users>(
      ctx,
      UsersDefinition.name,
      {
        id: ctx.id,
      },
      {}
    );

    user.mfas.list = user.mfas.list.filter((mfa) => mfa.type !== decoded.type);

    let value = null;
    if (body.type === "password") {
      value = await getOrVerifyHash(body.value);
    } else if (body.type === "email" && decoded.type === "email") {
      value = decoded.email;
    } else if (body.type === "phone" && decoded.type === "phone") {
      value = decoded.phone;
    } else if (body.type === "app") {
      value = body.value;
    }

    if (!value) {
      throw BadRequestError("Invalid payload");
    }

    const mfa = {
      id: v4(),
      type: decoded.type,
      value: value,
    };

    user.mfas.list.push(mfa);

    const update: Partial<Users> = {
      mfas: user.mfas,
      //Update indexed email and phone too
      id_email:
        user.mfas.list.find((mfa) => mfa.type === "email")?.value ||
        user.id_email,
      id_phone:
        user.mfas.list.find((mfa) => mfa.type === "phone")?.value ||
        user.id_phone,
    };

    await db.update<Users>(
      ctx,
      UsersDefinition.name,
      {
        id: ctx.id,
      },
      update
    );

    return mfa;
  });
};

export const deleteMfa = async (ctx: Context, id: string) => {
  if (id == "email" || id == "phone") {
    throw BadRequestError("Cannot delete this method " + id);
  }

  const db = await platform.Db.getService();
  await db.transaction(ctx, async (ctx) => {
    const user = await db.selectOne<Users>(
      ctx,
      UsersDefinition.name,
      {
        id: ctx.id,
      },
      {}
    );

    const mfa = user.mfas.list.find((mfa) => mfa.id === id);
    if (mfa.type === "email" || mfa.type === "phone") {
      throw BadRequestError("Cannot delete this method " + mfa.type);
    }

    user.mfas.list = user.mfas.list.filter((mfa) => mfa.id !== id);

    await db.update<Users>(
      ctx,
      UsersDefinition.name,
      {
        id: ctx.id,
      },
      { mfas: user.mfas }
    );
  });

  return;
};
