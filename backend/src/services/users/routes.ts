import { Router } from "express";
import { checkMfa, checkRole } from "../common";
import { Ctx } from "../utils";
import { deleteMfa, getMfas, upsertMfa } from "./services/mfas";
import { signup } from "./services/signup";
import {
  getAvatar,
  getPublicUser,
  getSelf,
  updatePreferences,
} from "./services/user";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.post("/users", checkRole("NOTHING"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await signup(ctx, req.body));
  });

  router.get("/users", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(
      await getPublicUser(
        ctx,
        req.query.id as string,
        req.query.email as string,
        req.query.phone as string
      )
    );
  });

  router.post("/users", checkRole("NOTHING"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await signup(ctx, req.body));
  });

  router.get("/users/mfa", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await getMfas(ctx));
  });

  router.post("/users/mfa", checkRole("USER"), checkMfa(), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await upsertMfa(ctx, req.body));
  });

  router.delete(
    "/users/mfa/:id",
    checkRole("USER"),
    checkMfa(),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(await deleteMfa(ctx, req.params.id));
    }
  );

  router.get("/users/me", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await getSelf(ctx));
  });

  router.get("/users/:id/avatar", checkRole("NOTHING"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const img = await getAvatar(ctx, req.params.id);
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": img.length,
    });
    res.end(img);
  });

  router.post("/users/preferences", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    res.json(await updatePreferences(ctx, req.body));
  });
};
