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
  .join("\n\n")
  // Absolute paths: relative ones break when the manual is not opened at
  // /manuals/ exactly (/manuals, /manuals/index.html#...)
  .replace(/\]\(images\//g, `](${import.meta.env.BASE_URL}images/`);

// Scalar strips iframes from the Markdown: a thumbnail linking to a YouTube
// video is replaced by the player when clicked (and stays a link otherwise)
const youtubeId = (href: string) =>
  href.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{11})/)?.[1];
document.addEventListener(
  "click",
  (event) => {
    const link = (event.target as HTMLElement).closest?.("a");
    const thumbnail = link?.querySelector("img");
    const id = link && thumbnail && youtubeId(link.href);
    if (!link || !id) return;
    event.preventDefault();
    event.stopPropagation();
    const player = document.createElement("iframe");
    player.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    player.title = thumbnail.alt;
    player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    player.allowFullscreen = true;
    player.style.cssText =
      "display: block; width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 8px;";
    link.replaceWith(player);
  },
  true,
);

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
      max-width: 920px;
    }
    .introduction-section h3 {
      font-size: 1.05em;
    }
    .introduction-section img {
      max-width: 100%;
      border-radius: 8px;
      border: 1px solid var(--scalar-border-color);
    }
  `,
});
