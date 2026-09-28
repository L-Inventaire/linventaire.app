import { Router } from "express";
import { checkMfa, checkRole } from "../common";
import { Ctx } from "../utils";
import { getTenant, listTenants } from "./services/tenants";

// Platform administration: only for users with the SYSADMIN role (set in database)
export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.get(
    "/tenants",
    checkRole("SYSADMIN"),
    checkMfa(),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(await listTenants(ctx));
    }
  );

  router.get(
    "/tenants/:id",
    checkRole("SYSADMIN"),
    checkMfa(),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(await getTenant(ctx, req.params.id));
    }
  );
};
