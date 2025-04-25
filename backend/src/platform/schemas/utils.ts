import Joi from "joi";
import { TableDefinition } from "../db/api";
import _ from "lodash";

export const classToSchema = (
  instance: any
): TableDefinition["rest"]["schema"] => {
  const schema: TableDefinition["rest"]["schema"] = {};

  Object.keys(instance).forEach((key) => {
    let value = instance[key];
    let isArray = false;
    let type: TableDefinition["rest"]["schema"]["key"] = "text";
    if (_.isArray(value)) {
      // We ignore arrays here
      value = value[0];
      isArray = true;
    }
    if (typeof value === "number") {
      type = "number";
    } else if (typeof value === "boolean") {
      type = "boolean";
    } else if ((value as Date)?.getDate) {
      type = "date";
    } else if (typeof value === "string" && value.match(/^type:/)) {
      type = value;
    } else if (typeof value === "string") {
      type = "text";
    } else if (value === null || value === undefined) {
      throw new Error(`Invalid value for key ${key}`);
    } else {
      type = classToSchema(value);
    }
    schema[key] = (isArray ? [type] : type) as any;
  });

  return schema;
};

export const schemaStrip = (schema: any, data: any) => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  }).value;
};

export const schemaFromEntity = <T>(entity: any) => {
  const schema = {};

  for (const [key, value] of Object.entries(entity)) {
    if ((value as string).indexOf("VARCHAR") === 0) {
      const maxLength = parseInt((value as string).match(/\((\d+)\)/)[1], 10);
      schema[key] = Joi.string().max(maxLength);
    } else {
      switch (value) {
        case "BOOLEAN":
          schema[key] = Joi.boolean();
          break;
        case "TEXT":
          schema[key] = Joi.string().allow("");
          break;
        case "INTEGER":
        case "INT":
          schema[key] = Joi.number().integer();
          break;
        case "FLOAT":
        case "REAL":
        case "DOUBLE":
          schema[key] = Joi.number();
          break;
        case "DATE":
          schema[key] = Joi.date();
          break;
        case "BIGINT":
          schema[key] = Joi.date().timestamp();
          break;
        case "JSON":
        case "JSONB":
          schema[key] = Joi.object();
          break;
        case "ARRAY":
          schema[key] = Joi.array();
          break;
        case "UUID":
          schema[key] = Joi.string().guid({ version: "uuidv4" });
          break;
        // ... add more cases as needed
        default:
          schema[key] = Joi.any();
          break;
      }
    }
  }

  return Joi.object<T>(schema);
};

export const columnsFromEntity = (classEntity: any) => {
  const instance = new classEntity();
  const columns = {};
  for (const key of Object.keys(instance)) {
    const isArray = _.isArray(instance[key]);
    const baseType = isArray ? instance[key][0] : instance[key];
    if (typeof baseType === "string") {
      columns[key] = "VARCHAR(500)";
    } else if (_.isDate(baseType)) {
      columns[key] = "BIGINT";
    } else if (_.isBoolean(baseType)) {
      columns[key] = "BOOLEAN";
    } else if (_.isNumber(baseType)) {
      columns[key] = "FLOAT";
    } else {
      columns[key] = "JSONB";
    }
    if (isArray) {
      columns[key] = columns[key] + "[]";
    }
  }
  return columns;
};
