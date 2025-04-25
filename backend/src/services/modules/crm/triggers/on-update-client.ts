import _ from "lodash";
import platform, { default as Framework } from "../../../../platform/index";
import Contacts from "../../contacts/entities/contacts";
import CRMItems, { CRMItemsDefinition } from "../entities/crm-items";

export const setOnUpdateClientCRM = () =>
  Framework.TriggersManager.registerTrigger<CRMItems>(CRMItemsDefinition, {
    test: (_ctx, entity, prev) => {
      return (
        !!entity?.contacts?.length &&
        !_.isEqual(entity?.contacts, prev?.contacts)
      );
    },
    callback: async (ctx, entity) => {
      const db = await platform.Db.getService();

      const contactSummaries = [];
      for (const contactID of entity.contacts || []) {
        const contact = await db.selectOne<Contacts>(ctx, "contacts", {
          id: contactID,
        });

        const contactSummary = {
          person_first_name: contact?.person_first_name,
          person_last_name: contact?.person_last_name,
          business_name: contact?.business_name,
          business_registered_name: contact?.business_registered_name,
        };

        contactSummaries.push(contactSummary);
      }

      await db.update<CRMItems>(
        ctx,
        CRMItemsDefinition.name,
        { id: entity.id },
        { contact_summaries: contactSummaries }
      );
    },
    name: "on-update-client-crm",
  });
