# API documentation

Public documentation of the L'inventaire API, rendered with [Scalar](https://scalar.com). It is served under `/docs` of the frontend: `yarn build` in `frontend/` builds this site into `frontend/build/docs` (see the `build:docs` script), so both the S3 deployment and the nginx image ship it.

The OpenAPI document (`public/openapi.json`) is generated from the backend entities, nothing is written by hand:

- `backend/src/services/developers/openapi/entities.ts` lists the documented entities (title, description, permissions).
- Properties come from each entity `rest.schema` (the one the REST service uses to validate documents).
- `backend/scripts/generate-openapi.ts` reads the entities classes with the TypeScript compiler to add enums (string literal unions) and descriptions (comments next to each property).

`public/openapi.json` is committed so building the frontend does not require the backend. **Regenerate it after changing an entity**, the CI fails when it is outdated:

```bash
npm run openapi   # requires shared/ built and backend/ dependencies installed
```

## Commands

```bash
npm install
npm run dev      # http://localhost:3007
npm run build    # static site in build/ (set API_DOCS_BASE, e.g. /docs/, when not served at the root)
```
