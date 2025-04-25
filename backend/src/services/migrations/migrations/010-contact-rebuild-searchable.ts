import Framework from "#src/platform/index";
import Contacts, {
  ContactsDefinition,
} from "#src/services/modules/contacts/entities/contacts";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";

export const rebuildContactSearchables = async (ctx: Context) => {
  // For all invoices
  const db = await Framework.Db.getService();
  let contacts = [];
  let offset = 0;
  do {
    contacts = await db.select<Contacts>(
      ctx,
      ContactsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of contacts) {
      entity.searchable = expandSearchable(
        Framework.TriggersManager.getEntities()[
          ContactsDefinition.name
        ].rest.searchable(entity)
      );
      await db.update<Contacts>(
        ctx,
        ContactsDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        {
          searchable: entity.search,
        },
        { triggers: false }
      );
    }

    offset += contacts.length;
  } while (contacts.length > 0);
};
