import { Router } from "express";
import express from "express";
import { checkClientRoles, checkRole } from "../../common";
import { Ctx } from "../../utils";
import { exportData } from "./services/export";
import { importData } from "./services/import";
import Framework from "#src/platform/index";

export default (router: Router) => {
  // Export data for selected tables
  router.post(
    "/:clientId/export",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        const { tables } = req.body;

        if (!Array.isArray(tables) || tables.length === 0) {
          return res.status(400).json({ error: "Invalid tables selection" });
        }

        const result = await exportData(ctx, tables);
        return res.json(result);
      } catch (error) {
        console.error("Export error:", error);
        return res
          .status(500)
          .json({ error: error.message || "Export failed" });
      }
    }
  );

  // Get list of available tables for export
  router.get(
    "/:clientId/tables",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (_req, res) => {
      try {
        const entities = Framework.TriggersManager.getEntities();
        const availableTables = Object.keys(entities)
          .filter((name) => {
            const entity = entities[name];
            // Only include tables that have client_id column (client-specific data)
            // Filter out system tables and history tables
            return (
              entity.columns.client_id &&
              !name.endsWith("_history") &&
              name !== "events" &&
              name !== "tasks" &&
              name !== "migrations"
            );
          })
          .map((name) => {
            const entity = entities[name];
            return {
              name,
              label: name
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
              hasRest: !!entity.rest,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        return res.json(availableTables);
      } catch (error) {
        console.error("Failed to get tables:", error);
        return res.status(500).json({ error: "Failed to retrieve tables" });
      }
    }
  );

  // Import data from JSON - larger body limit for data imports
  router.post(
    "/:clientId/import",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        const { data } = req.body;

        if (!data || typeof data !== "object") {
          return res.status(400).json({ error: "Invalid import data" });
        }

        const result = await importData(ctx, data);
        return res.json(result);
      } catch (error) {
        console.error("Import error:", error);
        return res
          .status(500)
          .json({ error: error.message || "Import failed" });
      }
    }
  );
};
