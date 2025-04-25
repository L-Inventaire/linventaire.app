import { getContactName } from "#src/services/utils";
import _ from "lodash";
import Framework from "../../../../platform";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import StockItems, { StockItemsDefinition } from "../entities/stock-items";
import { Context } from "#src/types";
import { expandSearchable } from "#src/services/rest/services/rest";

/** Make sure autocomputed data are autocomputed **/
export const setUpsertHook = () =>
  Framework.TriggersManager.registerTrigger<StockItems>(StockItemsDefinition, {
    test: (_, entity) => !!entity,
    callback: async (ctx, entity, prev) => {
      const db = await Framework.Db.getService();
      const updated = _.cloneDeep(entity);

      updated.cache = await updateCache(ctx, entity, prev);

      if (!_.isEqual(entity, updated)) {
        // Searchable is not updated here in hooks
        updated.searchable = expandSearchable(
          (updated.searchable || "") +
            " " +
            Object.values(updated.cache).join(" ")
        );
        await db.update<StockItems>(
          ctx,
          StockItemsDefinition.name,
          { client_id: entity.client_id, id: entity.id },
          updated
        );
      }
    },
    name: "upsert-hook-stock-items",
    priority: 1, // High priority
  });

export const updateCache = async (
  ctx: Context,
  entity: StockItems,
  prev?: StockItems,
  force?: boolean
) => {
  const db = await Framework.Db.getService();

  const cache = _.cloneDeep(entity?.cache) || ({} as any);

  if (force || entity?.article !== prev?.article) {
    const article = entity.article
      ? await db.selectOne<Articles>(ctx, ArticlesDefinition.name, {
          id: entity.article,
          client_id: entity.client_id,
        })
      : null;
    cache.article_name = article?.name;
  }

  if (force || entity?.for_rel_quote !== prev?.for_rel_quote) {
    const quote = entity.for_rel_quote
      ? await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
          id: entity.for_rel_quote,
          client_id: entity.client_id,
        })
      : null;
    cache.quote_name =
      (quote?.reference || "") + " " + (quote?.alt_reference || "");
  }

  if (
    force &&
    entity?.from_rel_supplier_quote !== prev?.from_rel_supplier_quote
  ) {
    const quote = entity.from_rel_supplier_quote
      ? await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
          id: entity.from_rel_supplier_quote,
          client_id: entity.client_id,
        })
      : null;
    cache.supplier_quote_name =
      (quote?.reference || "") + " " + (quote?.alt_reference || "");
  }

  if (force || entity?.client !== prev?.client) {
    const client = entity.client
      ? await db.selectOne<Contacts>(ctx, ContactsDefinition.name, {
          id: entity.client,
          client_id: entity.client_id,
        })
      : null;
    cache.client_name = getContactName(client);
  }

  return cache;
};
