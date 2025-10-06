import Fuse from "fuse.js";
import _, { isArray } from "lodash";
import { default as Framework, default as platform } from "../../../platform";
import { id } from "../../../platform/db/utils";
import { Context } from "../../../types";
import { RestEntity } from "../entities/entity";
import { RestSearchQuery } from "../type";
import { generateWhereClause, isTableAvailable } from "./utils";

export const schema = async (ctx: Context, table: string) => {
  if (!(await isTableAvailable(ctx, table, "READ")))
    throw new Error("Invalid object type");
  const driver = await platform.Db.getService();
  const { rest } = Framework.TriggersManager.getEntities()[table];

  const schema = { ...rest.schema };

  // Special case for customer fields
  const fields = await driver.select(ctx, "fields", {
    client_id: ctx.client_id,
    document_type: table,
  });

  schema.fields = {};
  fields.forEach(
    (a: any) =>
      (schema.fields[a.code] = a.type.match(/^\[.*\]$/)
        ? [a.type.replace(/(^\[|\]$)/gm, "")]
        : a.type)
  );
  if (Object.keys(schema.fields).length === 0) delete schema.fields;

  return _.omit(schema || {}, [
    "searchable",
    "searchable_generated",
    "comment_id",
    ...(rest.hidden || []),
  ]);
};

export const getWithRevision = async (
  ctx: Context,
  object: string,
  id: any,
  query: any
) => {
  let revision = "";
  if (id && id.includes("~")) {
    revision = id.split("~")[1];
    id = id.split("~")[0];
  }
  return await get(
    ctx,
    object,
    id
      ? {
          id,
        }
      : query,
    revision
  );
};

export const get = async (
  ctx: Context,
  table: string,
  query: any,
  historyVersion?: string
) => {
  if (!(await isTableAvailable(ctx, table, "READ", query)))
    throw new Error("Invalid object type");
  const driver = await platform.Db.getService();

  let result = await driver.selectOne<RestEntity>(
    ctx,
    table,
    {
      ..._.omit(query, "where"),
      client_id: ctx.client_id,
    },
    {
      include_deleted: true,
    }
  );

  if (historyVersion) {
    if (!(await isTableAvailable(ctx, table, "READ")))
      throw new Error("Invalid object type");
    const driver = await platform.Db.getService();
    const historyTable = table + "_history";

    const historyResult = await driver.selectOne(
      ctx,
      historyTable,
      {
        id: result.id,
        client_id: result.client_id,
        operation_timestamp: historyVersion,
      },
      {
        include_deleted: true,
      }
    );

    if (!historyResult) return null;

    result = Object.assign(
      {},
      result,
      _.omit(
        historyResult,
        "searchable",
        "searchable_generated",
        "comment_id",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "revisions",
        "is_deleted",
        "client_id",
        "id",
        "operation",
        "operation_timestamp"
      )
    );

    result.id = historyResult.id + "~" + historyResult.operation_timestamp;
  }

  const { rest } = Framework.TriggersManager.getEntities()[table];
  const res = result ? _.omit(result as any, rest?.hidden || []) : result;
  return res
    ? {
        ...res,
        _label: getLabel(table, res),
      }
    : null;
};

export const search = async <T>(
  ctx: Context,
  table: string,
  query: RestSearchQuery[] | any,
  options?: {
    limit?: number;
    offset?: number;
    asc?: boolean;
    deleted?: boolean;
    index?: string;
    rank_query?: string;
  }
) => {
  if (!(await isTableAvailable(ctx, table, "READ", query)))
    throw new Error("Invalid object type " + table);
  const driver = await platform.Db.getService();
  const { rest, columns } = Framework.TriggersManager.getEntities()[table];
  const _schema = await schema(ctx, table);

  options = options || {};
  options.limit = Math.min(500, options.limit || 25);

  if (
    query?.id ||
    query?.find?.((a: any) => a.key === "id" && !a.not && !a.regex)
  ) {
    // If we specify ids, then we'll include the deleted ones
    options.deleted = true;
  }

  let conditions: any = {
    ..._.omit(query, "where"),
    ..._.omit(query, "sql"),
    client_id: ctx.client_id,
  };

  if (query?.length > 0) {
    conditions = generateWhereClause(ctx, query, columns, _schema);
  }

  conditions = {
    ...conditions,
    ...(!options.deleted
      ? {
          is_deleted: false,
        }
      : {}),
  };

  if (query?.length > 0) {
    conditions = generateWhereClause(
      ctx,
      [
        ...query,
        ...(!options.deleted
          ? [{ key: "is_deleted", values: [{ op: "equals", value: false }] }]
          : []),
      ],
      columns,
      _schema
    );
  }

  if (_.isArray(query) && query?.find((a: any) => a.key === "query")) {
    options.rank_query = (query as RestSearchQuery[])
      ?.filter((a: any) => a.key === "query")
      ?.map((a) => a.values.map((b) => b.value).join(" "))
      .join(" ");
  }

  const result = orderSearchResults(
    await driver.select(
      { ...ctx, role: "SYSTEM" }, // To allow "where" clause
      table,
      conditions,
      options
    ),
    isArray(query) && query.length > 0 && !options.index // If frontend require an order, we wont change it here
      ? query
          ?.find((a: any) => a.key === "query")
          ?.values?.map((a) => a.value)
          ?.join(" ")
      : false
  );

  const total = await driver.count(
    { ...ctx, role: "SYSTEM" }, // To allow "where" clause
    table,
    conditions,
    {
      include_deleted: options.deleted,
    }
  );

  return {
    total,
    list: (await Promise.all(
      result.map(async (a) => ({
        ..._.omit(a as any, [
          "searchable",
          "searchable_generated",
          "comment_id",
          ...(rest?.hidden || []),
        ]),
        _label: getLabel(table, a),
      }))
    )) as T[],
  };
};

export const create = async <T>(
  ctx: Context,
  table: string,
  document: T & RestEntity & any
) => {
  if (!(await isTableAvailable(ctx, table, "WRITE", document)))
    throw new Error("Invalid object type");
  const driver = await platform.Db.getService();
  const { rest } = Framework.TriggersManager.getEntities()[table];

  document = _.pick(document, Object.keys(rest.schema));

  document.id = id();
  document.client_id = ctx.client_id;

  delete document.searchable_generated;
  delete document.comment_id;

  document.created_at = new Date().getTime();
  document.created_by = ctx.id;
  document.updated_at = new Date().getTime();
  document.updated_by = ctx.id;
  document.revisions = 1;
  document.is_deleted = false;
  document.display_name = getLabel(table, document);

  await driver.transaction(ctx, async (ctx) => {
    return await driver.insert(ctx, table, document);
  });

  const res = await get(ctx, table, { id: document.id });
  return res
    ? ({
        ...res,
        _label: getLabel(table, res),
      } as T)
    : null;
};

export const update = async (
  ctx: Context,
  table: string,
  query: any,
  document: any & Partial<RestEntity>
) => {
  if (!(await isTableAvailable(ctx, table, "WRITE", { ...document, ...query })))
    throw new Error("Invalid object type");
  const driver = await platform.Db.getService();
  const { rest } = Framework.TriggersManager.getEntities()[table];

  document = _.pick(document, Object.keys(rest.schema));

  if (!document.id && !query.id)
    throw new Error("Missing id on document for table " + table);

  delete query.client_id;
  if (Object.values(query).length === 0)
    throw new Error("Cannot update all records");

  delete document.searchable_generated;
  delete document.comment_id;
  delete document.id;

  delete document.created_at;
  document.updated_at = new Date().getTime();
  document.updated_by = ctx.id;
  document.revisions = (document.revisions || 0) + 1;

  await driver.transaction(ctx, async (ctx) => {
    return await driver.update(
      ctx,
      table,
      {
        ..._.omit(query, "where"),
        client_id: ctx.client_id,
      },
      document
    );
  });

  return await get({ ...ctx, role: "SYSTEM" }, table, {
    id: document.id || query.id,
  });
};

export const remove = async (ctx: Context, table: string, query: any) => {
  if (!(await isTableAvailable(ctx, table, "WRITE", query)))
    throw new Error("Invalid object type");
  const driver = await platform.Db.getService();

  delete query.client_id;
  if (Object.values(query).length === 0)
    throw new Error("Cannot delete all records");

  await driver.transaction(ctx, async (ctx) => {
    return await driver.update<RestEntity>(
      ctx,
      table,
      {
        ..._.omit(query, "where"),
        client_id: ctx.client_id,
      },
      {
        updated_by: ctx.id,
        updated_at: new Date(),
        is_deleted: true,
        comment_id: null,
      }
    );
  });

  return true;
};

export const restore = async (ctx: Context, table: string, query: any) => {
  if (!(await isTableAvailable(ctx, table, "WRITE", query)))
    throw new Error("Invalid object type");
  const driver = await platform.Db.getService();

  delete query.client_id;
  if (Object.values(query).length === 0)
    throw new Error("Cannot delete all records");

  await driver.update<RestEntity>(
    ctx,
    table,
    {
      ..._.omit(query, "where"),
      client_id: ctx.client_id,
    },
    {
      updated_by: ctx.id,
      updated_at: new Date(),
      is_deleted: false,
      comment_id: null,
    }
  );

  return true;
};

const orderSearchResults = (items: RestEntity[], query: string) => {
  if (!query) return items;
  const fuse = new Fuse(items, {
    includeScore: true,
    threshold: 1,
    keys: ["searchable"],
  });

  // Perform the fuzzy search
  const results = fuse.search(query);

  // Custom scoring logic
  return (
    results
      .map((result) => {
        const item = result.item;
        const match = item.searchable.toLowerCase();
        const queryLower = query.toLowerCase();

        let customScore = 0;

        if (match.startsWith(queryLower)) {
          // Best match: Starts with the query
          customScore = 3 * (1 - result.score); // Higher is better
        } else if (match.includes(queryLower)) {
          // Second best: Contains the query in order
          customScore = 2 * (1 - result.score);
        } else {
          // Third best: Contains query in wrong order (fuzzy match score as base)
          customScore = 1 * (1 - result.score);
        }

        return {
          ...item,
          customScore, // Add custom score to the result
        };
      })
      // Sort by customScore in descending order
      .sort((a, b) => b.customScore - a.customScore)
  );
};

// string: single priority, string[]: multiple priority with first: highest
export const expandSearchable = (searchable: string | string[]) => {
  if (_.isArray(searchable)) {
    return searchable.map((a) => expandSearchable(a)).join(",");
  }

  // If number and string attached, add all detached version as a separated searchable word, same for . , - etc
  let result = [];
  const words = searchable.split(" ");
  words.forEach((word) => {
    result.push(word);
    // Split word by special characters
    const specialCharacters = ["-", ".", ","];
    specialCharacters.forEach((char) => {
      if (word.includes(char)) {
        const parts = word.split(char);
        parts.forEach((part) => {
          if (part.length > 1) result.push(part);
        });
      }
    });

    // Separate numbers part and string part
    if (word.match(/\d+/g) && word.match(/[a-zA-Z]+/g)) {
      result = result.concat(
        // All multiple digits matches
        (word.match(/\d+/g) || []).map((a) => parseInt(a, 10)),
        // All multiple letters matches
        word.match(/[a-zA-Z]+/g) || []
      );
    }

    // Replace words like S000123 to S123 and so on
    if (word.match(/[^0-9]+0+[0-9]+/g)) {
      result.push(word.replace(/([^0-9]+)0+([0-9]+)/g, "$1$2"));
    }
  });
  return Array.from(new Set(result.join(" ").split(" ")))
    .filter(Boolean)
    .join(" ");
};

export const preHook = (
  table: string,
  document: RestEntity,
  previousDocument?: RestEntity
) => {
  const allDocument = Object.assign(previousDocument || {}, document);
  const { rest } = Framework.TriggersManager.getEntities()[table];
  if (rest?.searchable)
    document.searchable = expandSearchable(rest.searchable(allDocument));
  if (rest?.label) document.display_name = getLabel(table, allDocument);
  return document;
};

export const getLabel = (table: string, entity: any) => {
  const { rest } = Framework.TriggersManager.getEntities()[table];
  return (
    (typeof rest.label === "function"
      ? rest.label(entity)
      : entity[rest.label]) || ""
  ).slice(0, 254);
};
