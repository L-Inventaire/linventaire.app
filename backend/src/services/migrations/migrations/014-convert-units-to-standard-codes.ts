import Framework from "#src/platform/index";
import Articles, {
  ArticlesDefinition,
} from "#src/services/modules/articles/entities/articles";
import Invoices, {
  InvoicesDefinition,
} from "#src/services/modules/invoices/entities/invoices";
import { getUnitCode } from "#src/services/modules/invoices/types/maps";
import { Context } from "#src/types";

export const convertUnitsToStandardCodes = async (ctx: Context) => {
  const db = await Framework.Db.getService();

  // Process articles
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
      if (entity.unit) {
        const standardCode = getUnitCode(entity.unit);
        if (standardCode && standardCode !== entity.unit) {
          await db.update<Articles>(
            ctx,
            ArticlesDefinition.name,
            { id: entity.id, client_id: entity.client_id },
            {
              unit: standardCode,
            },
            { triggers: false }
          );
        }
      }
    }

    offset += articleItems.length;
  } while (articleItems.length > 0);

  // Process invoices
  let invoiceItems = [];
  offset = 0;
  do {
    invoiceItems = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of invoiceItems) {
      if (entity.content && entity.content.length > 0) {
        let hasChanges = false;
        const updatedContent = entity.content.map((line) => {
          if (line.unit) {
            const standardCode = getUnitCode(line.unit);
            if (standardCode && standardCode !== line.unit) {
              hasChanges = true;
              return { ...line, unit: standardCode };
            }
          }
          return line;
        });

        if (hasChanges) {
          await db.update<Invoices>(
            ctx,
            InvoicesDefinition.name,
            { id: entity.id, client_id: entity.client_id },
            {
              content: updatedContent,
            },
            { triggers: false }
          );
        }
      }
    }

    offset += invoiceItems.length;
  } while (invoiceItems.length > 0);
};
