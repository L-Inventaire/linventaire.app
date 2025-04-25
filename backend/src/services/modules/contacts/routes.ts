import { Router } from "express";
import { checkClientRoles, checkRole } from "../../common";
import { Ctx } from "../../utils";
import { getSireneResult } from "./services/sirene";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.get(
    "/clients/:clientId/sirene/:siret",
    checkRole("USER"),
    checkClientRoles(["CONTACTS_MANAGE"]),
    async (req, res) => {
      res.json(await getSireneResult(Ctx.get(req)?.context, req.params.siret));
    }
  );
};
