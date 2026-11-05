import Framework from "#src/platform/index";
import { Router } from "express";
import { checkClientRoles, checkRole } from "../../common";
import { Ctx } from "../../utils";
import { getSireneResult } from "./services/sirene";
import {
  searchFrenchDirectoryCompanies,
  getFrenchCompanyBySiren,
} from "./services/french-directory";
import { refreshContactEInvoicesStatus } from "./services/refresh-e-invoices-status";
import Contacts, { ContactsDefinition } from "./entities/contacts";

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

  // Check again the e-invoicing status of a contact whose e-invoicing is not
  // active (e.g. when a document is edited for it). Throttled per contact.
  router.post(
    "/clients/:clientId/contacts/:id/e-invoices-status/refresh",
    checkRole("USER"),
    checkClientRoles(["CONTACTS_READ"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const db = await Framework.Db.getService();
      const contact = await db.selectOne<Contacts>(
        ctx,
        ContactsDefinition.name,
        { client_id: req.params.clientId, id: req.params.id }
      );
      if (!contact) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const refreshed = await refreshContactEInvoicesStatus(ctx, contact);
      res.json({
        e_invoices_identifier: refreshed.e_invoices_identifier || "",
        e_invoices_active: !!refreshed.e_invoices_active,
        updated:
          refreshed.e_invoices_active !== contact.e_invoices_active ||
          refreshed.e_invoices_identifier !== contact.e_invoices_identifier,
      });
    }
  );
};
