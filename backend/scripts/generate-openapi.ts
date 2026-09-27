/**
 * Generates the OpenAPI document of the public api.
 *
 *   yarn openapi [output.json]
 *
 * Properties come from the entities definitions (`rest.schema`), then enums and
 * comments are extracted from the typescript classes of the entities so the
 * documentation stays in sync with the code without extra annotations.
 */
import fs from "fs";
import path from "path";
import ts from "typescript";
import { DocumentedEntities } from "../src/services/developers/openapi/entities";
import {
  EntitiesMetadata,
  PropertyMetadata,
  generateOpenApi,
} from "../src/services/developers/openapi/generate";

const root = path.resolve(__dirname, "..");
const output = path.resolve(
  process.cwd(),
  process.argv[2] || path.join(root, "dist", "openapi.json")
);

const program = ts.createProgram(
  DocumentedEntities.map((e) => path.join(root, "src", e.source)),
  {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    strictNullChecks: true,
    skipLibCheck: true,
    baseUrl: root,
    paths: {
      "#src/*": ["src/*"],
      "@shared/*": ["../shared/src/*"],
    },
  }
);
const checker = program.getTypeChecker();

// "// comment" and "/* comment */" around a property declaration
const getComment = (declaration?: ts.Declaration) => {
  if (!declaration) return "";
  const source = declaration.getSourceFile().getFullText();
  const ranges = [
    ...(ts.getLeadingCommentRanges(source, declaration.getFullStart()) || []),
    ...(ts.getTrailingCommentRanges(source, declaration.getEnd()) || []),
    // Trailing comments are after the ";" when there is one
    ...(ts.getTrailingCommentRanges(source, declaration.getEnd() + 1) || []),
  ];
  const comments = ranges
    .map((r) =>
      source
        .slice(r.pos, r.end)
        .replace(/^\/\/\s?|^\/\*+\s?|\s?\*+\/$/g, "")
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, "").trim())
        .join(" ")
        .trim()
    )
    .filter(Boolean);
  return Array.from(new Set(comments)).join(" ");
};

const nonNullable = (type: ts.Type) => checker.getNonNullableType(type);

const getEnum = (type: ts.Type) => {
  const types = type.isUnion() ? type.types : [type];
  if (types.length < 2) return undefined;
  if (types.every((t) => t.isStringLiteral())) {
    return types.map((t) => (t as ts.StringLiteralType).value);
  }
  if (types.every((t) => t.isNumberLiteral())) {
    return types.map((t) => (t as ts.NumberLiteralType).value);
  }
  return undefined;
};

const getArrayItemType = (type: ts.Type) =>
  checker.isArrayType(type)
    ? checker.getTypeArguments(type as ts.TypeReference)[0]
    : undefined;

// Walk the schema and the typescript type side by side
const describe = (
  schema: any,
  type: ts.Type | undefined,
  location: ts.Node,
  depth = 0
): { [key: string]: PropertyMetadata } => {
  const result: { [key: string]: PropertyMetadata } = {};
  if (!type || depth > 6 || !schema || typeof schema !== "object") {
    return result;
  }
  for (const key of Object.keys(schema)) {
    const symbol = nonNullable(type).getProperty(key);
    if (!symbol) continue;
    const declaration = symbol.valueDeclaration || symbol.declarations?.[0];
    const propertyType = nonNullable(
      checker.getTypeOfSymbolAtLocation(symbol, declaration || location)
    );
    const metadata = describeProperty(
      schema[key],
      propertyType,
      declaration || location,
      depth
    );
    const description =
      getComment(declaration) ||
      ts.displayPartsToString(symbol.getDocumentationComment(checker));
    if (description) metadata.description = description;
    if (Object.keys(metadata).length) result[key] = metadata;
  }
  return result;
};

const describeProperty = (
  schema: any,
  type: ts.Type,
  location: ts.Node,
  depth: number
): PropertyMetadata => {
  const metadata: PropertyMetadata = {};
  if (Array.isArray(schema)) {
    const itemType = getArrayItemType(type);
    if (itemType) {
      const items = describeProperty(
        schema[0],
        nonNullable(itemType),
        location,
        depth + 1
      );
      if (Object.keys(items).length) metadata.items = items;
    }
  } else if (schema && typeof schema === "object") {
    const properties = describe(schema, type, location, depth + 1);
    if (Object.keys(properties).length) metadata.properties = properties;
  } else {
    const values = getEnum(type);
    if (values) metadata.enum = values;
  }
  return metadata;
};

const metadata: EntitiesMetadata = {};
for (const entity of DocumentedEntities) {
  const sourceFile = program.getSourceFile(path.join(root, "src", entity.source));
  const declaration = sourceFile?.statements.find(
    (s): s is ts.ClassDeclaration =>
      ts.isClassDeclaration(s) && s.name?.text === entity.className
  );
  if (!declaration) {
    console.warn(
      `[openapi] Class ${entity.className} not found in ${entity.source}, skipping metadata`
    );
    continue;
  }
  metadata[entity.definition.name] = describe(
    entity.definition.rest?.schema,
    checker.getTypeAtLocation(declaration),
    declaration
  );
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf-8")
);

const document = generateOpenApi({
  entities: DocumentedEntities,
  metadata,
  version: pkg.version,
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(document, null, 2));
console.log(
  `[openapi] ${Object.keys(document.paths).length} paths written to ${output}`
);
