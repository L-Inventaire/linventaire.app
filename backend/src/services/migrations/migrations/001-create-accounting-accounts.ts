import Framework from "#src/platform/index";
import { ensureContactHasAccountingAccount } from "#src/services/modules/accounting/triggers/on-contact-create-default";
import Contacts from "#src/services/modules/contacts/entities/contacts";
import { ContactsDefinition } from "#src/services/modules/contacts/entities/contacts";
import { Context } from "#src/types";

export const createAccountingAccounts = async (ctx: Context) => {
  // Select all contacts and apply ensureContactHasAccountingAccount
  const db = await Framework.Db.getService();
  let contacts: Contacts[] = [];
  let offset = 0;
  const limit = 100;
  do {
    contacts = await db.select<Contacts>(
      ctx,
      ContactsDefinition.name,
      {},
      {
        limit,
        offset,
      }
    );
    for (const contact of contacts) {
      await ensureContactHasAccountingAccount(ctx, contact);
    }
    offset += limit;
  } while (contacts?.length > 0);
};
