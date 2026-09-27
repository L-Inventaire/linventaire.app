import { describe, expect, test } from "@jest/globals";
import { checkApiKeyScopeOrThrow } from "../common";
import { DocumentedEntities } from "./openapi/entities";
import { generateOpenApi } from "./openapi/generate";
import { API_KEY_PREFIX, hashApiKey, isApiKey } from "./services/api-keys";

describe("api keys", () => {
  test("recognise api keys from jwt tokens", () => {
    expect(isApiKey(API_KEY_PREFIX + "abc")).toBe(true);
    expect(isApiKey("eyJhbGciOiJIUzI1NiJ9.e30.abc")).toBe(false);
    expect(isApiKey(undefined)).toBe(false);
  });

  test("hash is stable and does not contain the key", () => {
    const key = API_KEY_PREFIX + "secret";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).not.toContain("secret");
    expect(hashApiKey(key)).toHaveLength(64);
  });

  test("api keys are restricted to their company", () => {
    const ctx = {
      role: "API",
      api_key: { id: "key", client_id: "client-a" },
    } as any;
    const req = (clientId?: string) => ({ params: { clientId } } as any);

    expect(() => checkApiKeyScopeOrThrow(req("client-a"), ctx)).not.toThrow();
    expect(() => checkApiKeyScopeOrThrow(req(), ctx)).not.toThrow();
    expect(() => checkApiKeyScopeOrThrow(req("client-b"), ctx)).toThrow();

    // Regular sessions are not affected
    expect(() =>
      checkApiKeyScopeOrThrow(req("client-b"), { role: "USER" } as any)
    ).not.toThrow();
  });
});

describe("openapi", () => {
  const document = generateOpenApi({
    entities: DocumentedEntities,
    metadata: {
      invoices: { state: { enum: ["draft", "sent"], description: "State" } },
    },
    version: "1.0.0",
  });

  test("documents every entity", () => {
    for (const entity of DocumentedEntities) {
      const table = entity.definition.name;
      expect(document.paths[`/api/rest/v1/{clientId}/${table}`]).toBeDefined();
      expect(
        document.paths[`/api/rest/v1/{clientId}/${table}/search`]
      ).toBeDefined();
      expect(
        document.paths[`/api/rest/v1/{clientId}/${table}/{id}`]
      ).toBeDefined();
    }
  });

  test("builds schemas from the entities definitions", () => {
    const invoices = document.components.schemas.Invoices;
    expect(invoices.properties.state.enum).toEqual(["draft", "sent"]);
    expect(invoices.properties.emit_date.type).toBe("integer");
    expect(invoices.properties.content.type).toBe("array");
    expect(invoices.properties.client["x-reference"]).toBe("contacts");
    expect(invoices.properties.id.readOnly).toBe(true);
    // Internal columns are never exposed
    expect(invoices.properties.searchable).toBeUndefined();
    expect(invoices.properties.searchable_generated).toBeUndefined();

    const input = document.components.schemas.InvoicesInput;
    expect(input.properties.id).toBeUndefined();
    expect(input.properties.state).toBeDefined();
  });

  test("only references existing schemas", () => {
    const refs = JSON.stringify(document).match(/#\/components\/[^"]+/g) || [];
    for (const ref of refs) {
      const [, , group, name] = ref.split("/");
      expect((document.components as any)[group]?.[name]).toBeDefined();
    }
  });
});
