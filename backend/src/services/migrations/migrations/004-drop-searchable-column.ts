import Framework from "#src/platform/index";
import { Context } from "#src/types";

export const dropSearchableTsVectorColumn = async (ctx: Context) => {
  // For all tables, drop column searchable_tsvector
  const db = await Framework.Db.getService();
  for (const def of Object.values(db.getTablesDefinitions())) {
    if (def.columns.is_deleted) {
      try {
        await db.custom(
          ctx,
          "ALTER TABLE " + def.name + " DROP COLUMN searchable_tsvector",
          []
        );
      } catch (e) {
        console.log(
          `Error dropping column searchable_tsvector in table ${def.name}`
        );
      }
      try {
        await db.custom(
          ctx,
          "ALTER TABLE " + def.name + " DROP COLUMN searchable_tsvector_v2",
          []
        );
      } catch (e) {
        console.log(
          `Error dropping column searchable_tsvector in table ${def.name}`
        );
      }
    }
  }
};
