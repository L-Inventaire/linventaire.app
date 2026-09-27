import { createApiReference } from "@scalar/api-reference";
import "@scalar/api-reference/style.css";

// openapi.json is generated from the backend entities (see backend/scripts/generate-openapi.ts)
createApiReference("#app", {
  url: `${import.meta.env.BASE_URL}openapi.json`,
  layout: "modern",
  defaultHttpClient: { targetKey: "shell", clientKey: "curl" },
  authentication: {
    preferredSecurityScheme: "BearerAuth",
  },
  metaData: {
    title: "API L'inventaire",
  },
  showDeveloperTools: "never",
  agent: { disabled: true },
  mcp: { disabled: true },
});
