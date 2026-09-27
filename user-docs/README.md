# Manuel d'utilisation

User manual of L'inventaire, in French, rendered with [Scalar](https://scalar.com) like the API documentation (`api-docs/`). It is served under `/manuals` of the frontend: `yarn build` in `frontend/` builds this site into `frontend/build/manuals` (see the `build:manual` script), so both the S3 deployment and the nginx image ship it. The app opens it from the book icon of the header ("Manuel d'utilisation").

## How it works

Scalar renders OpenAPI documents. The manual is an OpenAPI document **without any endpoint**, whose description is the whole manual written in Markdown (`src/main.ts`):

- `content/*.md`: one file per chapter, concatenated in file name order (`01-…`, `02-…`). Renaming a file changes the order.
- `# Titre` starts a chapter (top level of the sidebar), `## Titre` a section of that chapter (second level). `###` titles are shown in the page only.
- Everything API related (clients, models, download button, test requests) is hidden.

## Writing

Standard Markdown (GitHub flavour): lists, tables, bold, links, plus callouts:

```md
> [!TIP]
> Un conseil.

> [!NOTE]
> Une information.

> [!WARNING]
> Une mise en garde.
```

- **Links between sections**: `[Le stock](#description/le-stock)`. The anchor is the title in lowercase, spaces replaced by `-`, apostrophes and punctuation removed, **accents kept** (`## Services et temps passé` → `#description/services-et-temps-passé`, `## Commandes et factures d'achat` → `#description/commandes-et-factures-dachat`). Changing a title breaks the links to it.
- **Images**: put them in `public/images/` and reference them with a relative path, wrapped in a link so that a click opens the full size image: `[![Le devis](images/devis.png)](images/devis.png)` (no leading `/`, the site is served under `/manuals/`).
- **Screenshots** of the app are generated from demo data by `screenshots/` (see its README): regenerate them when the UI changes rather than editing them by hand.
- **Video**: raw HTML (`<video>`, `<iframe>`) is stripped by Scalar. Put the file in `public/videos/` (or host it on YouTube) and link to it, ideally with a thumbnail: `[![Voir la vidéo](images/video.png)](videos/presentation.mp4)`.
- Quote the UI labels exactly as they appear in the app, in **bold**, so that users can find them.

## Commands

```bash
npm install
npm run dev      # http://localhost:3008, reloads on every change of content/
npm run build    # static site in build/ (set USER_DOCS_BASE, e.g. /manuals/, when not served at the root)
```
