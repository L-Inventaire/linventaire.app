import { create } from "#src/services/rest/services/rest";
import { Ctx } from "#src/services/utils";
import config from "config";
import { Router } from "express";
import { DataAnalysisDefinition } from "./entities/data-analysis";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.get("/collect", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const email = req.query.email as string;
    const external_id = req.query.external_id as string;

    await create(
      { ...ctx, id: "-", role: "SYSTEM" },
      DataAnalysisDefinition.name,
      {
        email: req.query.email,
        external_id: req.query.external_id,
      }
    );

    const url = new URL(config.get<string>("data-analysis.typeform-url"));
    url.searchParams.append("email", email);
    url.searchParams.append("external_id", external_id);

    res.redirect(url.toString());
  });
};
