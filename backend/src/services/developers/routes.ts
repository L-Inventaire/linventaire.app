import { Router } from "express";
import { ForbiddenError } from "../../types";
import Services from "..";
import { checkClientRoles, checkRole, denyApiKeys } from "../common";
import { Ctx } from "../utils";
import { createApiKey, listApiKeys, revokeApiKey } from "./services/api-keys";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  // Tells who is behind the current credentials, handy to check an api key works
  router.get(
    "/:clientId/whoami",
    checkRole("USER"),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const user = await Services.Users.getPublicUser(ctx, { id: ctx.id });
      const clients = await Services.Clients.getUserClients(ctx);
      const client = clients.find((c) => c.client_id === req.params.clientId);
      res.json({
        user,
        client_id: req.params.clientId,
        client_name:
          client?.client?.company?.name ||
          client?.client?.company?.legal_name ||
          "",
        roles: client?.roles?.list || [],
        authentication: ctx.role === "API" ? "api_key" : "session",
        api_key_id: ctx.api_key?.id || null,
      });
    }
  );

  // Api keys management must be done by the user itself, never with an api key
  router.get(
    "/:clientId/api-keys",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const all = req.query.all === "1" || req.query.all === "true";
      if (
        all &&
        !(await Services.Clients.checkUserRoles(ctx, req.params.clientId, [
          "CLIENT_MANAGE",
        ]))
      ) {
        throw ForbiddenError("You don't have the required roles");
      }
      res.json(await listApiKeys(ctx, req.params.clientId, { all }));
    }
  );

  router.post(
    "/:clientId/api-keys",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(await createApiKey(ctx, req.params.clientId, req.body));
    }
  );

  // Users can revoke their own keys, company managers can revoke any key
  router.delete(
    "/:clientId/api-keys/:id",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const isManager = await Services.Clients.checkUserRoles(
        ctx,
        req.params.clientId,
        ["CLIENT_MANAGE"]
      );
      res.json(
        await revokeApiKey(ctx, req.params.clientId, req.params.id, {
          any_user: isManager,
        })
      );
    }
  );
};
