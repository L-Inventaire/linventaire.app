import Framework from "#src/platform/index";
import Invoices, {
  InvoicesDefinition,
} from "#src/services/modules/invoices/entities/invoices";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";

export const fixInvoicesSearchables = async (ctx: Context) => {
  // For all invoices
  const db = await Framework.Db.getService();
  let invoices = [];
  let offset = 0;
  do {
    invoices = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of invoices) {
      entity.searchable = expandSearchable(
        Framework.TriggersManager.getEntities()[
          InvoicesDefinition.name
        ].rest.searchable(entity)
      );
      await db.update<Invoices>(
        ctx,
        InvoicesDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        {
          searchable: entity.search,
        },
        { triggers: false }
      );
    }

    offset += invoices.length;
  } while (invoices.length > 0);
};
