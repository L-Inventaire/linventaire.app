import Framework from "#src/platform/index";
import Articles, {
  ArticlesDefinition,
} from "#src/services/modules/articles/entities/articles";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";

export const rebuildArticlesSearchables = async (ctx: Context) => {
  // For all article items
  const db = await Framework.Db.getService();
  let articleItems = [];
  let offset = 0;
  do {
    articleItems = await db.select<Articles>(
      ctx,
      ArticlesDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of articleItems) {
      entity.searchable = expandSearchable(
        Framework.TriggersManager.getEntities()[
          ArticlesDefinition.name
        ].rest.searchable(entity)
      );
      await db.update<Articles>(
        ctx,
        ArticlesDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        {
          searchable: entity.search,
        },
        { triggers: false }
      );
    }

    offset += articleItems.length;
  } while (articleItems.length > 0);
};
