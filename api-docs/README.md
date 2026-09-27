# API documentation

Public documentation of the L'inventaire API, rendered with [Scalar](https://scalar.com). It is a standalone static site, built and deployed separately from the app.

The OpenAPI document is generated from the backend entities, nothing is written by hand:

- `backend/src/services/developers/openapi/entities.ts` lists the documented entities (title, description, permissions).
- Properties come from each entity `rest.schema` (the one the REST service uses to validate documents).
- `backend/scripts/generate-openapi.ts` reads the entities classes with the TypeScript compiler to add enums (string literal unions) and descriptions (comments next to each property).

To document a new entity, add it to `entities.ts`.

## Commands

```bash
# Requires shared/ to be built and backend/ dependencies installed
npm install
npm run dev      # generate openapi.json and start on http://localhost:3007
npm run build    # generate openapi.json and build the static site in build/
```

The spec alone can be generated from the backend with `npm run openapi -- <output.json>`.

Set `API_DOCS_BASE` (e.g. `/developers/`) when the site is not served at the root of its domain.
