import Framework from "#src/platform/index";
import _ from "lodash";
import Contacts, { ContactsDefinition } from "../entities/contacts";
import { getFrenchDirectoryEntries } from "../services/french-directory";

// This trigger will update e-invoices fields when SIREN changes
export const setupOnSirenChanged = () => {
  Framework.TriggersManager.registerTrigger<Contacts>(ContactsDefinition, {
    name: "on-contact-siren-changed-update-e-invoices",
    test: (_ctx, entity, old) => {
      // Trigger on create (no old entity) or when SIREN changes
      if (!old) {
        return !!entity?.business_registered_id;
      }
      return (
        !!entity?.business_registered_id &&
        entity.business_registered_id !== old?.business_registered_id
      );
    },
    callback: async (ctx, entity) => {
      // Only process if we have a SIREN
      if (!entity?.business_registered_id) {
        return;
      }

      // Extract SIREN from business_registered_id (could be SIRET or SIREN)
      // SIREN is the first 9 digits
      const siren = entity.business_registered_id
        .replace(/\s/g, "")
        .slice(0, 9);

      // Validate SIREN format (9 digits)
      if (!/^\d{9}$/.test(siren)) {
        return;
      }

      try {
        const db = await Framework.Db.getService();

        // Call the French Directory to get e-invoice entries
        const entries = await getFrenchDirectoryEntries(ctx, siren);

        // Find the first active entry or fallback to first entry
        const activeEntry = entries.find((e) => e.is_active);
        const entry = activeEntry || entries[0];

        // Update the contact with e-invoicing information
        await db.update<Contacts>(
          ctx,
          ContactsDefinition.name,
          { id: entity.id },
          {
            e_invoices_identifier: entry?.identifier || "",
            e_invoices_active: entry?.is_active || false,
          },
          { triggers: false } // Prevent infinite loop
        );
      } catch (error) {
        // If the API call fails or no entries found, clear the fields
        const db = await Framework.Db.getService();
        await db.update<Contacts>(
          ctx,
          ContactsDefinition.name,
          { id: entity.id },
          {
            e_invoices_identifier: "",
            e_invoices_active: false,
          },
          { triggers: false }
        );
      }
    },
  });
};
