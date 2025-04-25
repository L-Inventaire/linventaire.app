import Framework from "#src/platform/index";
import { Context } from "#src/types";

export const markAllAsNotDeleted = async (ctx: Context) => {
  const db = await Framework.Db.getService();
  for (const def of Object.values(db.getTablesDefinitions())) {
    if (def.columns.is_deleted) {
      await db.custom(
        ctx,
        "UPDATE " + def.name + " SET is_deleted = false",
        []
      );
    }
  }
};
