import { Context } from "#src/types";
import Framework from "../../../../platform";
import { create } from "../../../rest/services/rest";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import AccountingAccounts from "../entities/accounts";

export const setOnContactCreateDefaultTrigger = () => {
  Framework.TriggersManager.registerTrigger<Contacts>(ContactsDefinition, {
    name: "on-contact-create-set-default-accounting-accounts",
    test: (_ctx, entity, old) => {
      return (
        (entity?.is_client && !old?.is_client) ||
        (entity?.is_supplier && !old?.is_supplier)
      );
    },
    callback: async (ctx, entity) => {
      ensureContactHasAccountingAccount(ctx, entity);
    },
  });
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "on-invoice-create-contact-default-accounting-accounts",
    test: (_ctx, entity, old) => {
      return !!(
        (entity?.client !== old?.client && entity?.client) ||
        (entity?.supplier !== old?.supplier && entity?.supplier) ||
        (entity?.contact && !old?.contact)
      );
    },
    callback: async (ctx, entity) => {
      const db = await Framework.Db.getService();
      for (const contact of [entity.client, entity.supplier, entity.contact]) {
        if (contact) {
          const entity = await db.selectOne<Contacts>(
            ctx,
            ContactsDefinition.name,
            { id: contact, client_id: ctx.client_id }
          );
          await ensureContactHasAccountingAccount(ctx, entity);
        }
      }
    },
  });
};

export const ensureContactHasAccountingAccount = async (
  ctx: Context,
  entity: Contacts
) => {
  if (!entity) return;

  const db = await Framework.Db.getService();
  const types = [];
  if (entity.is_client) {
    types.push("client");
  }
  if (entity.is_supplier) {
    types.push("supplier");
  }

  for (const type of types) {
    const existingAccounts = await db.selectOne(ctx, "accounting_accounts", {
      client_id: ctx.client_id,
      contact: entity.id,
      type,
    });

    if (!existingAccounts) {
      await create<AccountingAccounts>(ctx, "accounting_accounts", {
        client_id: ctx.client_id,
        contact: entity.id,
        type,
        standard_identifier: type === "client" ? "411" : "401",
        standard: "pcg",
        name: [
          entity.business_registered_name || entity.business_name,
          entity.person_first_name,
          entity.person_last_name,
        ]
          .filter(Boolean)
          .join(" "),
        notes: "",
      });
    }
  }
};
