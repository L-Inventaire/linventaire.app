import { Router } from "express";
import { checkClientRoles, checkRole } from "../../common";
import { Ctx } from "../../utils";
import { getSireneResult } from "./services/sirene";
import {
  searchFrenchDirectoryCompanies,
  getFrenchCompanyBySiren,
} from "./services/french-directory";

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  router.get(
    "/clients/:clientId/sirene/:siret",
    checkRole("USER"),
    checkClientRoles(["CONTACTS_MANAGE"]),
    async (req, res) => {
      res.json(await getSireneResult(Ctx.get(req)!.context, req.params.siret));
    }
  );

  // French Directory - Search companies
  router.get(
    "/clients/:clientId/french-directory/search",
    checkRole("USER"),
    checkClientRoles(["CONTACTS_MANAGE"]),
    async (req, res) => {
      try {
        const options: any = {};
        if (req.query.formal_name_starts_with) {
          options.formal_name_starts_with = req.query
            .formal_name_starts_with as string;
        }
        if (req.query.post_code_starts_with) {
          options.post_code_starts_with = req.query
            .post_code_starts_with as string;
        }
        if (req.query.number) {
          options.number = req.query.number as string;
        }
        if (req.query.limit) {
          options.limit = parseInt(req.query.limit as string, 10);
        }

        const result = await searchFrenchDirectoryCompanies(
          Ctx.get(req)!.context,
          options
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // French Directory - Get full company details by SIREN
  router.get(
    "/clients/:clientId/french-directory/:siren",
    checkRole("USER"),
    checkClientRoles(["CONTACTS_MANAGE"]),
    async (req, res) => {
      try {
        const result = await getFrenchCompanyBySiren(
          Ctx.get(req)!.context,
          req.params.siren
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );
};
