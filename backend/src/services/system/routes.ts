import { Router } from "express";
import { checkClientRoles, checkRole } from "../common";
import { Ctx } from "../utils";
import { getEvents } from "./services";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.get(
    "/events",
    checkRole("USER"),
    checkClientRoles(["EVENTS_READ"]),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.json(
        await getEvents(ctx, {
          from: parseInt(`${req.query.from || 0}`),
          to: parseInt(`${req.query.to || Date.now()}`),
          offset: parseInt(`${req.query.offset || 0}`),
          limit: Math.min(100, parseInt(`${req.query.limit || 100}`)),
        })
      );
    }
  );
};
