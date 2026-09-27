import { describe, expect, test } from "@jest/globals";
import crypto from "crypto";
import { checkApiKeyScopeOrThrow } from "../common";
import { DocumentedEntities } from "./openapi/entities";
import { generateOpenApi } from "./openapi/generate";
import { MAX_STORED_BODY, truncateBody } from "./services/api-calls";
import {
  API_KEY_PREFIX,
  hashApiKey,
  hasApiAccess,
  isApiKey,
} from "./services/api-keys";
import {
  getNextAttemptAt,
  MAX_ATTEMPTS,
  RETRY_DELAYS,
} from "./services/webhook-deliveries";
import {
  generateWebhookSecret,
  getWebhookUrlError,
  isPrivateAddress,
  signWebhookPayload,
} from "./services/webhooks-security";

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

  test("api keys require the API_ACCESS permission", () => {
    expect(hasApiAccess(["API_ACCESS", "CONTACTS_READ"])).toBe(true);
    // Company managers have every permission
    expect(hasApiAccess(["CLIENT_MANAGE"])).toBe(true);
    expect(hasApiAccess(["CONTACTS_MANAGE", "INVOICES_MANAGE"])).toBe(false);
    expect(hasApiAccess([])).toBe(false);
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

describe("webhooks", () => {
  test("private and internal addresses are refused", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
      "not-an-ip",
    ]) {
      expect(isPrivateAddress(address)).toBe(true);
    }
    for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) {
      expect(isPrivateAddress(address)).toBe(false);
    }
  });

  test("webhook urls are validated", async () => {
    const resolveTo =
      (address: string) => async (): Promise<{ address: string }[]> =>
        [{ address }];

    expect(
      await getWebhookUrlError(
        "https://example.com/hook",
        resolveTo("93.184.215.14")
      )
    ).toBeNull();
    expect(await getWebhookUrlError("ftp://example.com")).toBe(
      "The url must use https"
    );
    expect(await getWebhookUrlError("not a url")).toBe("Invalid url");
    expect(await getWebhookUrlError("https://user:pass@example.com")).toBe(
      "Credentials are not allowed in the url"
    );
    expect(await getWebhookUrlError("https://localhost/hook")).toBe(
      "The url must point to a public address"
    );
    expect(await getWebhookUrlError("https://169.254.169.254/latest")).toBe(
      "The url must point to a public address"
    );
    // A public domain resolving to a private address (DNS rebinding)
    expect(
      await getWebhookUrlError(
        "https://evil.example.com",
        resolveTo("10.0.0.5")
      )
    ).toBe("The url must point to a public address");
  });

  test("payloads are signed with HMAC SHA-256", () => {
    const secret = "whsec_test";
    const body = JSON.stringify({ id: "1", event: "ping" });
    const header = signWebhookPayload(secret, body, 1700000000);
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`1700000000.${body}`)
      .digest("hex");
    expect(header).toBe(`t=1700000000,v1=${expected}`);
    expect(generateWebhookSecret().startsWith("whsec_")).toBe(true);
  });

  test("retries back off then give up", () => {
    const now = 1000;
    expect(getNextAttemptAt(1, now)).toBe(now + RETRY_DELAYS[0]);
    expect(getNextAttemptAt(2, now)).toBe(now + RETRY_DELAYS[1]);
    expect(getNextAttemptAt(MAX_ATTEMPTS - 1, now)).toBe(
      now + RETRY_DELAYS[RETRY_DELAYS.length - 1]
    );
    expect(getNextAttemptAt(MAX_ATTEMPTS, now)).toBeNull();
  });

  test("api calls bodies are truncated", () => {
    expect(truncateBody(null)).toEqual({ value: null, size: 0 });
    expect(truncateBody({ a: 1 })).toEqual({ value: '{"a":1}', size: 7 });
    const long = truncateBody("x".repeat(MAX_STORED_BODY + 10));
    expect(long.size).toBe(MAX_STORED_BODY + 10);
    expect(long.value!.length).toBeLessThan(MAX_STORED_BODY + 20);
    expect(long.value!.endsWith("[truncated]")).toBe(true);
    expect(truncateBody(Buffer.from("pdf")).value).toBe("[binary 3 bytes]");
  });

  test("webhooks are documented", () => {
    const document = generateOpenApi({
      entities: DocumentedEntities,
      version: "1.0.0",
    });
    expect(
      document.paths["/api/developers/v1/{clientId}/webhooks"].post
    ).toBeDefined();
    expect(document.webhooks.ping).toBeDefined();
    for (const entity of DocumentedEntities) {
      expect(document.webhooks[entity.definition.name]).toBeDefined();
    }
  });
});
