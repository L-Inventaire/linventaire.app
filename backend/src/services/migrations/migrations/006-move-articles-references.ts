import Framework from "#src/platform/index";
import Articles, {
  ArticlesDefinition,
} from "#src/services/modules/articles/entities/articles";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";

export const moveArticleReferences = async (ctx: Context) => {
  // For all articles
  const db = await Framework.Db.getService();
  let articles: Articles[] = [];
  let offset = 0;
  do {
    articles = await db.select<Articles>(
      ctx,
      ArticlesDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of articles) {
      // Get reference in supplier details OR in internal_reference
      const reference =
        entity.internal_reference ||
        Object.values(entity?.suppliers_details || {}).find((a) => a.reference)
          ?.reference;
      entity.supplier_reference = reference;

      if (entity.internal_reference === entity.supplier_reference) {
        entity.internal_reference = "";
      }

      await db.update<Articles>(
        ctx,
        ArticlesDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        {
          internal_reference: entity.internal_reference,
          supplier_reference: entity.supplier_reference,
          searchable: expandSearchable(
            entity.searchable +
              " " +
              entity.supplier_reference +
              " " +
              entity.internal_reference
          ),
        },
        { triggers: false }
      );
    }

    offset += articles.length;
  } while (articles.length > 0);
};
