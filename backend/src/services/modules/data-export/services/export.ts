import Framework from "#src/platform/index";
import { Context } from "#src/types";

export const exportData = async (
  ctx: Context,
  tables: string[]
): Promise<{ [tableName: string]: any[] }> => {
  const db = await Framework.Db.getService();
  const result: { [tableName: string]: any[] } = {};

  const entities = Framework.TriggersManager.getEntities();

  for (const tableName of tables) {
    // Validate that table exists
    if (!entities[tableName]) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    // Check if table has client_id column
    const definition = entities[tableName];
    const hasClientId = definition.columns.client_id;

    const allData: any[] = [];
    let offset = 0;
    const batchSize = 1000;

    // Fetch all data in batches
    let foundMore = true;
    while (foundMore) {
      const batch = await db.select(
        { ...ctx, role: "SYSTEM" },
        tableName,
        hasClientId
          ? { where: "client_id=$1", values: [ctx.client_id] }
          : { where: "1=1", values: [] },
        {
          limit: batchSize,
          offset,
          include_deleted: true, // Include soft-deleted records
        }
      );

      allData.push(...batch);

      if (batch.length < batchSize) {
        foundMore = false;
      }

      offset += batchSize;
    }

    result[tableName] = allData;
  }

  return result;
};
