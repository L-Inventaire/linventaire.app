import { captureException } from "@sentry/node";
import { Router, query } from "express";
import Framework from "../../platform";
import { checkClientRoles, checkRole } from "../common";
import { Ctx } from "../utils";
import { searchHistory } from "./services/history";
import {
  create,
  get,
  getWithRevision,
  remove,
  restore,
  schema,
  search,
  update,
} from "./services/rest";
import { suggestions } from "./services/suggestions";
import url from "url";

function chunkArray(arr: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const checkClientRolesFromObject = (action: "READ" | "WRITE" | "MANAGE") =>
  checkClientRoles((req) => {
    const ctx = Ctx.get(req)?.context;
    const object = req.params.object;
    return Framework.TriggersManager.hasEntitiesRole(
      ctx,
      object,
      action,
      req.body
    )
      ? ["ANY"]
      : ["CLIENT_MANAGE"];
  });

/**
 * This is the global service to work with any document we want as a single unified API
 * Any change to a document will trigger:
 * - A message to the client
 * - The associated triggers (that can potentially return an error)
 * - Save events to event database
 */
export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  // Get type schema
  router.get(
    ["/:clientId/:object/schema"],
    checkRole("USER"),
    checkClientRolesFromObject("READ"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      return res.json(await schema(ctx, req.params.object));
    }
  );

  // Get type schema
  router.post(
    ["/:clientId/:object/suggestions"],
    checkRole("USER"),
    checkClientRolesFromObject("READ"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      return res.json(
        await suggestions(
          ctx,
          req.params.object,
          req.body.column,
          req.body.query
        )
      );
    }
  );

  // Get single object history
  router.get(
    ["/:clientId/:object/:id/history"],
    checkRole("USER"),
    checkClientRolesFromObject("READ"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      let id = req.params.id;
      if (req.params.id && req.params.id.includes("~")) {
        id = req.params.id.split("~")[0];
      }
      return res.json(
        await searchHistory(
          ctx,
          req.params.object,
          id,
          parseInt(req.query.limit as string) || 10,
          parseInt(req.query.offset as string) || 0
        )
      );
    }
  );

  // Search
  router.post(
    "/:clientId/:object/search",
    checkRole("USER"),
    checkClientRolesFromObject("READ"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      return res.json(
        await search(
          ctx,
          req.params.object,
          req.body?.query || {},
          req.body.options || {}
        )
      );
    }
  );

  // Get single object
  router.get(
    ["/:clientId/:object/:id", "/:object"],
    checkRole("USER"),
    checkClientRolesFromObject("READ"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      return res.json(
        await getWithRevision(ctx, req.params.object, req.params.id, req.query)
      );
    }
  );

  // Batch processing
  router.post("/:clientId/batch", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;

    try {
      const requests = req.body; // Array of { url: string, body: object|null }
      if (!Array.isArray(requests)) {
        return res.status(400).json({ error: "Invalid request format" });
      }

      const accessCache = {};

      const execRequest = async (request: { d: any; u: string }) => {
        try {
          const body = request.d;
          const u = request.u;

          const parsedUrl = url.parse(u, true); // Parse the URL for params and query
          const pathParts = parsedUrl.pathname.split("/");

          const object = pathParts[0];
          const id = pathParts[1];
          const query = parsedUrl.query;

          // Small cache if we request several time the same object
          const cacheKey = object + JSON.stringify(Object.keys(body || {}));
          const hasAccess =
            accessCache[cacheKey] ||
            Framework.TriggersManager.hasEntitiesRole(
              ctx,
              object,
              "READ",
              body
            );
          accessCache[cacheKey] = hasAccess;

          if (!hasAccess) {
            return { status: 401, error: "Access denied" };
          }

          // Route the request to the appropriate handler
          if (id === "search") {
            // Search request
            return {
              status: 200,
              body: await search(
                ctx,
                object,
                body?.query || {},
                body?.options || {}
              ),
            };
          } else if (pathParts.length === 2) {
            // Get single object
            return {
              status: 200,
              body: id ? await getWithRevision(ctx, object, id, query) : null,
            };
          } else {
            throw new Error("Invalid URL format: " + u);
          }
        } catch (err) {
          if (err !== "Invalid URL format") {
            captureException(err);
            console.error(err);
          }
          return { status: 500, error: err.message }; // Return error for individual request
        }
      };

      // Process each request in parallel
      const chunkedRequests = chunkArray(requests, 10);

      const results = [];
      for (const chunk of chunkedRequests) {
        // If client is gone, stop
        if (res.headersSent || res.finished) break;

        const chunkResults = await Promise.all(
          chunk.map(async (request) => {
            // Double-check again
            if (res.headersSent || res.finished) return null;

            // Do your async work:
            return await execRequest(request);
          })
        );

        results.push(...chunkResults);
      }

      return res.json(results);
    } catch (err) {
      console.error(err);
      captureException(err);
      return res.status(500).json({ error: "Batch processing failed" });
    }
  });

  // Update object
  router.put(
    "/:clientId/:object/:id",
    checkRole("USER"),
    checkClientRolesFromObject("WRITE"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      let id = req.params.id;
      const body = req.body || {};
      if (req.params.id && req.params.id.includes("~")) {
        const revision = req.params.id.split("~")[1];
        id = req.params.id.split("~")[0];
        body.restored_from = revision;
      }
      return res.json(
        await update(
          ctx,
          req.params.object,
          Object.values(query || {}).length ? req.query : { id },
          body
        )
      );
    }
  );

  // Create object
  router.post(
    "/:clientId/:object",
    checkRole("USER"),
    checkClientRolesFromObject("WRITE"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      return res.json(await create(ctx, req.params.object, req.body));
    }
  );

  // Restore object
  router.post(
    "/:clientId/:object/:id/restore",
    checkRole("USER"),
    checkClientRolesFromObject("MANAGE"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      let id = req.params.id;
      if (req.params.id && req.params.id.includes("~")) {
        // Restore from revision
        const revision = req.params.id.split("~")[1];
        id = req.params.id.split("~")[0];
        const body = await get(ctx, req.params.object, { id }, revision);
        if (!body) {
          throw new Error("Revision not found");
        }
        (body as any).id = id;
        (body as any).restored_from = parseInt(revision);
        return res.json(
          await update(
            ctx,
            req.params.object,
            Object.values(query || {}).length ? req.query : { id },
            body
          )
        );
      } else {
        // Restore deleted object
        return res.json(
          await restore(
            ctx,
            req.params.object,
            Object.values(query || {}).length ? req.query : { id }
          )
        );
      }
    }
  );

  // Delete object
  router.delete(
    "/:clientId/:object/:id",
    checkRole("USER"),
    checkClientRolesFromObject("MANAGE"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      return res.json(
        await remove(
          ctx,
          req.params.object,
          Object.values(query || {}).length ? req.query : { id: req.params.id }
        )
      );
    }
  );
};
