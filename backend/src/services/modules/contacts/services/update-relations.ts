import Framework from "#src/platform/index";
import _ from "lodash";
import Contacts, { ContactsDefinition } from "../entities/contacts";

// This trigger will ensure both contacts have the relations set up correctly
export const setupOnContactRelationsChanged = () => {
  Framework.TriggersManager.registerTrigger<Contacts>(ContactsDefinition, {
    name: "on-contact-create-set-default-accounting-accounts",
    test: (_ctx, entity, old) => {
      return (
        !_.isEqual(entity?.parents, old?.parents) ||
        !_.isEqual(entity?.parents_roles, old?.parents_roles)
      );
    },
    callback: async (ctx, entity, old) => {
      const db = await Framework.Db.getService();
      // On relations changed, let's look up the others ones
      const added = _.difference(entity?.parents || [], old?.parents || []);
      const removed = _.difference(old?.parents || [], entity?.parents || []);
      const edited = (entity?.parents || [])
        .map((p) => ({
          id: p,
          old: old?.parents_roles?.[p],
          entity: entity?.parents_roles?.[p],
        }))
        .filter((p) => p.old && p.entity && !_.isEqual(p.old, p.entity));

      for (const parent of _.uniq([
        ...added,
        ...removed,
        ...edited.map((a) => a.id),
      ])) {
        // Add the relation to the other contact or remove it
        const contact = await db.selectOne<Contacts>(
          ctx,
          ContactsDefinition.name,
          { id: parent },
          {}
        );
        await db.update<Contacts>(
          ctx,
          ContactsDefinition.name,
          { id: parent },
          {
            parents: [
              ...(contact?.parents || []).filter((a) => a != old?.id),
              ...(entity && entity?.parents?.includes(contact.id)
                ? [entity.id]
                : []),
            ],
            parents_roles: {
              ..._.omit(contact?.parents_roles || {}, old?.id || "keep_all"),
              ...(entity && entity?.parents?.includes(contact.id)
                ? { [entity.id]: entity.parents_roles?.[parent] }
                : {}),
            },
          },
          { triggers: false }
        );
      }
    },
  });
};
