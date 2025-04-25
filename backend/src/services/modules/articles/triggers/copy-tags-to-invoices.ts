import _ from "lodash";
import { default as Framework } from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import { setArticlesTagsToInvoices } from "../../invoices/services/db";
import Articles, { ArticlesDefinition } from "../entities/articles";

/** We need to track article tags inside Invoices entity in order to show stats to the user. **/
export const setCopyTagsToInvoices = () =>
  Framework.TriggersManager.registerTrigger<Articles>(ArticlesDefinition, {
    test: (_ctx, entity, oldEntity) => {
      return entity && !_.isEqual(entity?.tags, oldEntity?.tags);
    },
    callback: async (ctx, entity) => {
      const db = await Framework.Db.getService();

      const associatedInvoices = await db.select<Invoices>(
        { ...ctx, role: "SYSTEM" },
        InvoicesDefinition.name,
        {
          where: `$1 IN (SELECT jsonb_array_elements_text(articles->'all')) AND is_deleted = false`,
          values: [entity.id],
        }
      );

      for (const invoice of associatedInvoices) {
        const intialTags = _.cloneDeep(invoice?.articles?.computed_tags);

        await setArticlesTagsToInvoices(ctx, invoice);

        if (!_.isEqual(invoice?.articles?.computed_tags, intialTags)) {
          await db.update(
            ctx,
            InvoicesDefinition.name,
            { id: invoice.id },
            invoice
          );
        }
      }
    },
    name: "copy-tags-to-invoices",
  });
