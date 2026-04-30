import { Context } from "#src/types";
import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  EN16931Invoice,
  EN16931PostalAddress,
} from "../../../../platform/e-invoices/adapters/superpdp/en16931-types";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import Invoices from "../../invoices/entities/invoices";
import {
  convertEN16931ToInternal,
  convertInternalToEN16931,
  extractReferencesFromEN16931,
  ResolvedEntities,
} from "./invoice-converter";

describe("EN16931 Invoice Converter", () => {
  let mockCtx: Context;
  let mockSupplier: Contacts;
  let mockClient: Contacts;
  let mockArticle: Articles;
  let mockArticlesMap: Map<string, Articles>;

  beforeEach(() => {
    mockCtx = {
      client_id: "test-client-123",
      user_id: "test-user-456",
      req_id: "req-123",
      client_roles: [],
      id: "test-user-456",
      role: "user",
      session_id: "session-123",
      transaction: null,
    } as unknown as Context;

    mockSupplier = {
      id: "supplier-1",
      is_supplier: true,
      type: "company",
      business_name: "ACME Corporation",
      business_registered_name: "ACME Corporation",
      business_registered_id: "ACME123",
      business_tax_id: "FR12345678901",
      email: "contact@acme.com",
      address: {
        address_line_1: "123 Main Street",
        address_line_2: "Building B",
        city: "Paris",
        zip: "75001",
        country: "FR",
        region: "",
      },
    } as unknown as Contacts;

    mockClient = {
      id: "client-1",
      is_client: true,
      type: "company",
      business_name: "Client Company",
      business_registered_name: "Client Company",
      business_registered_id: "CLIENT123",
      business_tax_id: "FR98765432109",
      email: "client@example.com",
      address: {
        address_line_1: "456 Oak Avenue",
        city: "Lyon",
        zip: "69001",
        country: "FR",
      },
    } as any;

    mockArticle = {
      id: "article-1",
      client_id: "test-client-123",
      name: "Professional Services",
      reference: "SRV-001",
      description: "Consulting services",
      type: "service",
      unit: "HUR",
      unit_price: 100,
      tva: "S:20",
    } as any;

    const mockArticle2 = {
      id: "article-2",
      client_id: "test-client-123",
      name: "Product A",
      reference: "PROD-A",
      description: "Description of Product A",
      type: "product",
      unit: "EA",
      unit_price: 50,
      tva: "S:20",
    } as any;

    mockArticlesMap = new Map();
    mockArticlesMap.set("article-1", mockArticle);
    mockArticlesMap.set("SRV-001", mockArticle);
    mockArticlesMap.set("article-2", mockArticle2);
    mockArticlesMap.set("PROD-A", mockArticle2);
  });
});

function createMockInternalInvoice(type: Invoices["type"]): Invoices {
  const invoice = new Invoices();
  invoice.id = "invoice-123";
  invoice.client_id = "test-client-123";
  invoice.type = type;
  invoice.state = "draft";
  invoice.name = "Invoice 2026-001";
  invoice.reference = "INV-2026-001";
  invoice.emit_date = new Date("2026-04-23");
  invoice.currency = "EUR";

  if (type.startsWith("supplier_")) {
    invoice.supplier = "supplier-1";
  } else {
    invoice.client = "client-1";
  }

  invoice.content = [
    {
      article: "article-1",
      type: "service",
      name: "Professional Services",
      reference: "SRV-001",
      description: "Consulting services",
      unit: "C62",
      quantity: 1,
      unit_price: 100,
      tva: "S:20",
      discount: {
        mode: null,
        value: 0,
      },
      subscription: "",
      quantity_ready: 0,
      quantity_delivered: 0,
      optional: false,
      optional_checked: false,
    },
  ] as any;

  invoice.discount = {
    mode: null,
    value: 0,
  };

  invoice.payment_information = {} as any;

  return invoice;
}
