import { Router } from "express";
import { checkRole, checkRoleAny } from "../common";
import { verifyAppValidationCode } from "./services/app";
import {
  requestEmailValidation,
  verifyEmailValidationCode,
} from "./services/email";
import { extendOrUpdateToken, getMethods } from "./services/mfas";
import { verifyPassword } from "./services/password";
import { requestSmsValidation, verifySmsValidationCode } from "./services/sms";
import { Ctx } from "../utils";
import { BadRequestError } from "../../types";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    try {
      //Fixme: check if the service is up
    } catch (e) {
      res.json({ error: e.message });
      return;
    }
    res.json("ok");
  });

  router.post("/login", checkRole("NOTHING"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;

    if (req.body.type === "email") {
      res.json(
        await extendOrUpdateToken(ctx, {
          auth_validation_token: req.body.value,
        })
      );
    }
    if (req.body.type === "phone") {
      res.json(
        await extendOrUpdateToken(ctx, {
          auth_validation_token: req.body.value,
        })
      );
    }
    if (req.body.type === "password") {
      const result = await verifyPassword(ctx, {
        email: req.body.email,
        phone: req.body.phone,
        code: req.body.value,
      });
      res.json(
        await extendOrUpdateToken(ctx, {
          auth_validation_token: result.validation_token,
        })
      );
    }
  });

  router.post("/token", checkRoleAny(["NOTHING", "USER"]), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await extendOrUpdateToken(ctx, req.body));
  });

  router.get("/logout", checkRole("USER"), (req, res) => {
    res.json({ success: true });
  });

  router.post(
    "/mfa/methods",
    checkRoleAny(["NOTHING", "USER"]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(await getMethods(ctx, req.body));
    }
  );

  router.post(
    "/mfa/methods/:method_id/request",
    checkRoleAny(["NOTHING", "USER"]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      if (req.params.method_id === "email") {
        res.json(await requestEmailValidation(ctx, req.body));
      } else if (req.params.method_id === "phone") {
        res.json(await requestSmsValidation(ctx, req.body));
      } else {
        throw BadRequestError("Invalid MFA method");
      }
    }
  );

  router.post(
    "/mfa/methods/:method_id/validate",
    checkRoleAny(["NOTHING", "USER"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        if (req.params.method_id === "email") {
          res.json(await verifyEmailValidationCode(ctx, req.body));
        } else if (req.params.method_id === "phone") {
          res.json(await verifySmsValidationCode(ctx, req.body));
        } else if (req.params.method_id === "password") {
          res.json(await verifyPassword(ctx, req.body));
        } else if (req.params.method_id === "app") {
          res.json(await verifyAppValidationCode(ctx, req.body));
        } else {
          throw BadRequestError("Invalid MFA method");
        }
      } catch (e) {
        console.log(e);
        throw e;
      }
    }
  );
};
