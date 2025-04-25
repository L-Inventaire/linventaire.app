import { Router } from "express";
import { checkClientRoles, checkRole } from "../common";
import { Ctx } from "../utils";
import {
  createClient,
  getClient,
  getLogo,
  updateClient,
} from "./services/client";
import { getClients, getInvitations } from "./services/client-roles";
import {
  acceptInvitation,
  getUsers,
  removeUser,
  setUser,
} from "./services/client-users";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.get("/clients", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await getClients(ctx));
  });

  router.get("/invitations", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await getInvitations(ctx));
  });

  router.post(
    "/invitations/:clientId/:action",
    checkRole("USER"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(
        await acceptInvitation(
          ctx,
          req.params.clientId,
          req.params.action === "accept" ? true : false
        )
      );
    }
  );

  router.post("/clients", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await createClient(ctx, req.body));
  });

  router.get(
    "/clients/:clientId",
    checkRole("USER"),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(await getClient(ctx, req.params.clientId as string));
    }
  );

  router.post(
    "/clients/:clientId",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(
        await updateClient(ctx, req.params.clientId as string, req.body)
      );
    }
  );

  router.get(
    "/clients/:clientId/users",
    checkRole("USER"),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(await getUsers(ctx, req.params.clientId as string));
    }
  );

  router.post(
    "/clients/:clientId/users/:userId",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(
        await setUser(
          ctx,
          req.params.clientId as string,
          req.params.userId as string,
          { list: req.body.roles }
        )
      );
    }
  );

  router.delete(
    "/clients/:clientId/users/:userId",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(
        await removeUser(
          ctx,
          req.params.clientId as string,
          req.params.userId as string
        )
      );
    }
  );

  router.get(
    "/clients/:clientId/logo",
    checkRole("NOTHING"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      const img = await getLogo(ctx, req.params.clientId as string);
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": img.length,
      });
      res.end(img);
    }
  );
};
