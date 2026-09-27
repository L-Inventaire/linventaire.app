import { createApiReference } from "@scalar/api-reference";
import "@scalar/api-reference/style.css";

// The manual is written in Markdown, one file per chapter (content/01-*.md,
// content/02-*.md...), concatenated in file name order. Scalar renders it as
// the description of an OpenAPI document without any endpoint: each `#` heading
// is a chapter in the sidebar, each `##` heading a section of that chapter.
const chapters = import.meta.glob<string>("../content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const description = Object.keys(chapters)
  .sort()
  .map((file) => chapters[file].trim())
  .join("\n\n");

createApiReference("#app", {
  content: {
    openapi: "3.1.0",
    info: {
      title: "Manuel d'utilisation",
      version: "",
      description,
    },
    paths: {},
  },
  layout: "modern",
  localization: { locale: "fr" },
  metaData: {
    title: "Manuel d'utilisation - L'inventaire",
  },
  favicon: "/favicon.svg",
  // Nothing API related in a user manual
  hideModels: true,
  hideClientButton: true,
  hiddenClients: true,
  hideTestRequestButton: true,
  documentDownloadType: "none",
  showDeveloperTools: "never",
  agent: { disabled: true },
  mcp: { disabled: true },
  customCss: `
    /* Right column (client libraries) and OpenAPI version badges of the introduction */
    .introduction-section .section-column:has(.introduction-card),
    .introduction-section .badge,
    .introduction-section [class*="badge"] {
      display: none;
    }
    /* Readable line length */
    .introduction-section .section-column {
      max-width: 820px;
    }
    .introduction-section img {
      max-width: 100%;
      border-radius: 8px;
      border: 1px solid var(--scalar-border-color);
    }
  `,
});
