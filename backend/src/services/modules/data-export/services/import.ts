import Framework from "#src/platform/index";
import { Context } from "#src/types";

export type ImportResult = {
  [tableName: string]: {
    imported: number;
    skipped: number;
    errors: string[];
  };
};

export const importData = async (
  ctx: Context,
  data: { [tableName: string]: any[] }
): Promise<ImportResult> => {
  const db = await Framework.Db.getService();
  const result: ImportResult = {};

  const entities = Framework.TriggersManager.getEntities();

  for (const tableName of Object.keys(data)) {
    result[tableName] = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    // Validate that table exists
    if (!entities[tableName]) {
      result[tableName].errors.push(`Table ${tableName} does not exist`);
      continue;
    }

    // Check if table has client_id column - required for import
    const definition = entities[tableName];
    if (!definition.columns.client_id) {
      result[tableName].errors.push(
        `Table ${tableName} does not have client_id column and cannot be imported`
      );
      continue;
    }

    const records = data[tableName];
    if (!Array.isArray(records)) {
      result[tableName].errors.push(`Data for ${tableName} is not an array`);
      continue;
    }

    // Get primary key columns for this table
    const pkColumns = definition.pk || ["id"];

    for (const record of records) {
      try {
        // Skip records that don't have the required primary key
        const hasPk = pkColumns.every(
          (col: string) => record[col] !== undefined && record[col] !== null
        );
        if (!hasPk) {
          result[tableName].errors.push(
            `Record missing primary key: ${JSON.stringify(pkColumns)}`
          );
          continue;
        }

        // Check if record already exists with this client_id + id combination
        // Always use the current client_id for the check (not the one from the imported file)
        const whereConditions = pkColumns
          .map((col: string, idx: number) => `${col}=$${idx + 1}`)
          .join(" AND ");

        // Build values array, replacing client_id with current client's id
        const values = pkColumns.map((col: string) =>
          col === "client_id" ? ctx.client_id : record[col]
        );

        let finalWhere = whereConditions;
        if (!pkColumns.includes("client_id")) {
          finalWhere = `${whereConditions} AND client_id=$${
            pkColumns.length + 1
          }`;
          values.push(ctx.client_id);
        }

        const existing = await db.select(
          { ...ctx, role: "SYSTEM" },
          tableName,
          { where: finalWhere, values },
          { limit: 1, include_deleted: true }
        );

        if (existing.length > 0) {
          // Record already exists with same client_id + id, skip it
          result[tableName].skipped++;
          continue;
        }

        // Prepare record for insertion
        // Override client_id to ensure it's the current client
        const recordToInsert = {
          ...record,
          client_id: ctx.client_id,
        };

        // Remove fields that shouldn't be imported
        delete recordToInsert.is_deleted;
        delete recordToInsert.deleted_at;
        delete recordToInsert.deleted_by;

        // Insert the record
        await db.insert({ ...ctx, role: "SYSTEM" }, tableName, recordToInsert);

        result[tableName].imported++;
      } catch (error) {
        result[tableName].errors.push(
          `Error importing record: ${error.message || error}`
        );
      }
    }
  }

  return result;
};
