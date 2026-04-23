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
      client_id: "test-client-123",
      type: "supplier",
      name: "ACME Corporation",
      company_name: "ACME Corporation",
      business_tax_id: "FR12345678901",
      email: "contact@acme.com",
      address: {
        address_line_1: "123 Main Street",
        address_line_2: "Building B",
        city: "Paris",
        zip: "75001",
        country: "FR",
      },
    } as any;

    mockClient = {
      id: "client-1",
      client_id: "test-client-123",
      type: "client",
      name: "Client Company",
      company_name: "Client Company",
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
      unit: "hour",
      unit_price: 100,
      tva: "20",
    } as any;

    mockArticlesMap = new Map();
    mockArticlesMap.set("SRV-001", mockArticle);
  });

  describe("extractReferencesFromEN16931", () => {
    it("should extract seller information correctly", () => {
      const mockEN16931: EN16931Invoice = createMockEN16931Invoice();

      const references = extractReferencesFromEN16931(mockEN16931);

      expect(references.seller.name).toBe("ACME Corporation");
      expect(references.seller.vat).toBe("FR12345678901");
      expect(references.seller.email).toBe("contact@acme.com");
    });

    it("should extract buyer information correctly", () => {
      const mockEN16931: EN16931Invoice = createMockEN16931Invoice();

      const references = extractReferencesFromEN16931(mockEN16931);

      expect(references.buyer.name).toBe("Client Company");
      expect(references.buyer.vat).toBe("FR98765432109");
    });

    it("should extract article information from invoice lines", () => {
      const mockEN16931: EN16931Invoice = createMockEN16931Invoice();

      const references = extractReferencesFromEN16931(mockEN16931);

      expect(references.articles).toHaveLength(2);
      expect(references.articles[0].name).toBe("Professional Services");
      expect(references.articles[0].sellers_item_identification).toBe(
        "SRV-001"
      );
      expect(references.articles[1].name).toBe("Product A");
    });

    it("should handle invoices without optional fields", () => {
      const minimalInvoice: EN16931Invoice = {
        invoice_number: "INV-001",
        issue_date: "2026-04-23",
        type_code: 380,
        currency_code: "EUR",
        seller: {
          name: "Seller Inc",
          postal_address: { country: "FR" },
        },
        buyer: {
          name: "Buyer Inc",
          postal_address: { country: "FR" },
        },
        totals: {
          sum_of_invoice_line_net_amounts: 100,
          invoice_total_amount_without_vat: 100,
          invoice_total_amount_with_vat: 120,
        },
        vat_break_down: [
          {
            taxable_amount: 100,
            tax_amount: 20,
            vat_category_code: "S",
          },
        ],
        lines: [
          {
            line_number: "1",
            invoiced_quantity: 1,
            invoiced_quantity_unit_code: "C62",
            line_net_amount: 100,
            line_vat_information: {
              invoiced_item_vat_category_code: "S",
              invoiced_item_vat_rate: 20,
            },
            price_details: {
              item_net_price: 100,
            },
            item_information: {
              name: "Item",
            },
          },
        ],
      };

      const references = extractReferencesFromEN16931(minimalInvoice);

      expect(references.seller.name).toBe("Seller Inc");
      expect(references.seller.vat).toBeUndefined();
      expect(references.articles).toHaveLength(1);
    });
  });

  describe("convertEN16931ToInternal", () => {
    it("should convert received invoice (direction: in) to supplier invoice", () => {
      const mockEN16931 = createMockEN16931Invoice();
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.type).toBe("supplier_invoices");
      expect(result.supplier).toBe("supplier-1");
      expect(result.client_id).toBe("test-client-123");
      expect(result.reference).toBe("INV-2026-001");
      expect(result.state).toBe("draft");
    });

    it("should convert credit note (type_code 381) correctly", () => {
      const mockEN16931 = createMockEN16931Invoice();
      mockEN16931.type_code = 381; // Credit note
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.type).toBe("supplier_credit_notes");
    });

    it("should convert sent invoice (direction: out) to client invoice", () => {
      const mockEN16931 = createMockEN16931Invoice();
      const resolvedEntities: ResolvedEntities = {
        client: mockClient,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "out",
        mockCtx
      );

      expect(result.type).toBe("invoices");
      expect(result.client).toBe("client-1");
    });

    it("should convert invoice lines correctly", () => {
      const mockEN16931 = createMockEN16931Invoice();
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.content).toHaveLength(2);
      expect(result.content![0].name).toBe("Professional Services");
      expect(result.content![0].quantity).toBe(10);
      expect(result.content![0].unit_price).toBe(100);
      expect(result.content![0].tva).toBe("20");
      expect(result.content![0].article).toBe("article-1");
    });

    it("should convert document-level discount correctly", () => {
      const mockEN16931 = createMockEN16931Invoice();
      mockEN16931.allowances_charges = [
        {
          amount: 50,
          kind: "allowance",
          percentage: 5,
          base_amount: 1000,
        },
      ];
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.discount?.mode).toBe("percentage");
      expect(result.discount?.value).toBe(5);
    });

    it("should convert line-level allowances correctly", () => {
      const mockEN16931 = createMockEN16931Invoice();
      mockEN16931.lines[0].allowances_charges = [
        {
          amount: 10,
          kind: "allowance",
          percentage: 10,
        },
      ];
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.content![0].discount.mode).toBe("percentage");
      expect(result.content![0].discount.value).toBe(10);
    });

    it("should parse payment information correctly", () => {
      const mockEN16931 = createMockEN16931Invoice();
      mockEN16931.payment_details = {
        payment_means_type_code: "30", // Bank transfer
        payment_terms: "Payment within 30 days",
        credit_transfer: [
          {
            payment_account_identifier: {
              value: "FR7630006000011234567890189",
              scheme: "IBAN",
            },
          },
        ],
      };
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.payment_information?.mode).toContain("bank_transfer");
      expect(result.payment_information?.delay).toBe(30);
      expect(result.payment_information?.bank_iban).toBe(
        "FR7630006000011234567890189"
      );
    });

    it("should convert delivery information correctly", () => {
      const mockEN16931 = createMockEN16931Invoice();
      mockEN16931.delivery_information = {
        actual_delivery_date: "2026-04-30",
        postal_address: {
          street_name: "789 Delivery St",
          city_name: "Marseille",
          postal_zone: "13001",
          country: "FR",
        },
      };
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.delivery_date).toEqual(new Date("2026-04-30"));
      expect(result.delivery_address?.address_line_1).toBe("789 Delivery St");
      expect(result.delivery_address?.city).toBe("Marseille");
    });

    it("should throw error if supplier is missing for received invoice", () => {
      const mockEN16931 = createMockEN16931Invoice();
      const resolvedEntities: ResolvedEntities = {
        articles: mockArticlesMap,
      };

      expect(() =>
        convertEN16931ToInternal(mockEN16931, resolvedEntities, "in", mockCtx)
      ).toThrow("Supplier contact not found");
    });

    it("should throw error if article is missing", () => {
      const mockEN16931 = createMockEN16931Invoice();
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: new Map(), // Empty map
      };

      expect(() =>
        convertEN16931ToInternal(mockEN16931, resolvedEntities, "in", mockCtx)
      ).toThrow("Article not found");
    });

    it("should convert invoice notes correctly", () => {
      const mockEN16931 = createMockEN16931Invoice();
      mockEN16931.invoice_note = [
        { note: "First note" },
        { note: "Second note", subject_code: "AAI" },
      ];
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertEN16931ToInternal(
        mockEN16931,
        resolvedEntities,
        "in",
        mockCtx
      );

      expect(result.notes).toBe("First note\n\nSecond note");
    });
  });

  describe("convertInternalToEN16931", () => {
    it("should convert internal supplier invoice to EN16931", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.invoice_number).toBe("INV-2026-001");
      expect(result.type_code).toBe(380);
      expect(result.currency_code).toBe("EUR");
      expect(result.seller.name).toBe("ACME Corporation");
      expect(result.lines).toHaveLength(1);
    });

    it("should convert internal credit note correctly", () => {
      const mockInvoice = createMockInternalInvoice("supplier_credit_notes");
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.type_code).toBe(381);
    });

    it("should convert quote correctly", () => {
      const mockInvoice = createMockInternalInvoice("quotes");
      const resolvedEntities: ResolvedEntities = {
        client: mockClient,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.type_code).toBe(325);
    });

    it("should calculate totals correctly", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      mockInvoice.content[0].quantity = 10;
      mockInvoice.content[0].unit_price = 100;
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.totals.sum_of_invoice_line_net_amounts).toBe(1000);
      expect(result.totals.invoice_total_amount_without_vat).toBe(1000);
      // VAT at 20%
      expect(result.totals.invoice_total_vat_amount).toBeCloseTo(200, 0);
      expect(result.totals.invoice_total_amount_with_vat).toBeCloseTo(1200, 0);
    });

    it("should apply document-level discount", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      mockInvoice.content[0].quantity = 10;
      mockInvoice.content[0].unit_price = 100; // 1000 total
      mockInvoice.discount = {
        mode: "percentage",
        value: 10,
      };
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.totals.sum_of_allowances_on_document_level).toBe(100);
      expect(result.totals.invoice_total_amount_without_vat).toBe(900);
      expect(result.allowances_charges).toHaveLength(1);
      expect(result.allowances_charges![0].percentage).toBe(10);
    });

    it("should calculate VAT breakdown correctly", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      mockInvoice.content[0].quantity = 10;
      mockInvoice.content[0].unit_price = 100;
      mockInvoice.content[0].tva = "20";
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.vat_break_down).toHaveLength(1);
      expect(result.vat_break_down[0].vat_category_rate).toBe(20);
      expect(result.vat_break_down[0].taxable_amount).toBe(1000);
      expect(result.vat_break_down[0].tax_amount).toBeCloseTo(200, 0);
    });

    it("should convert payment information", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      mockInvoice.payment_information = {
        mode: ["bank_transfer"],
        delay: 30,
        iban: "FR7630006000011234567890189",
      } as any;
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.payment_details?.payment_means_type_code).toBe("30");
      expect(result.payment_details?.payment_terms).toContain("30 days");
      expect(
        result.payment_details?.credit_transfer?.[0].payment_account_identifier
          .value
      ).toBe("FR7630006000011234567890189");
    });

    it("should convert delivery information", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      mockInvoice.delivery_date = new Date("2026-05-01");
      mockInvoice.delivery_address = {
        address_line_1: "789 Delivery St",
        city: "Marseille",
        zip: "13001",
        country: "FR",
      } as any;
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      const result = convertInternalToEN16931(mockInvoice, resolvedEntities);

      expect(result.delivery_information?.actual_delivery_date).toBe(
        "2026-05-01"
      );
      expect(result.delivery_information?.postal_address?.street_name).toBe(
        "789 Delivery St"
      );
      expect(result.delivery_information?.postal_address?.city_name).toBe(
        "Marseille"
      );
    });

    it("should throw error if contact is missing", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      const resolvedEntities: ResolvedEntities = {
        articles: mockArticlesMap,
      };

      expect(() =>
        convertInternalToEN16931(mockInvoice, resolvedEntities)
      ).toThrow("Contact not found");
    });

    it("should throw error if article is missing", () => {
      const mockInvoice = createMockInternalInvoice("supplier_invoices");
      const resolvedEntities: ResolvedEntities = {
        supplier: mockSupplier,
        articles: new Map(),
      };

      expect(() =>
        convertInternalToEN16931(mockInvoice, resolvedEntities)
      ).toThrow("Article not found");
    });
  });

  describe("Bidirectional conversion", () => {
    it("should maintain data integrity through round-trip conversion", () => {
      // Start with EN16931
      const originalEN16931 = createMockEN16931Invoice();
      const resolvedEntitiesIN: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };

      // Convert to internal
      const internal = convertEN16931ToInternal(
        originalEN16931,
        resolvedEntitiesIN,
        "in",
        mockCtx
      );

      // Convert back to EN16931
      const resolvedEntitiesOUT: ResolvedEntities = {
        supplier: mockSupplier,
        articles: mockArticlesMap,
      };
      const backToEN16931 = convertInternalToEN16931(
        internal as Invoices,
        resolvedEntitiesOUT
      );

      // Check key fields are preserved
      expect(backToEN16931.invoice_number).toBe(originalEN16931.invoice_number);
      expect(backToEN16931.currency_code).toBe(originalEN16931.currency_code);
      expect(backToEN16931.lines).toHaveLength(originalEN16931.lines.length);
    });
  });
});

// Helper functions

function createMockEN16931Invoice(): EN16931Invoice {
  const sellerAddress: EN16931PostalAddress = {
    street_name: "123 Main Street",
    additional_street_name: "Building B",
    city_name: "Paris",
    postal_zone: "75001",
    country: "FR",
  };

  const buyerAddress: EN16931PostalAddress = {
    street_name: "456 Oak Avenue",
    city_name: "Lyon",
    postal_zone: "69001",
    country: "FR",
  };

  return {
    invoice_number: "INV-2026-001",
    issue_date: "2026-04-23",
    type_code: 380,
    currency_code: "EUR",
    seller: {
      name: "ACME Corporation",
      vat: "FR12345678901",
      postal_address: sellerAddress,
      contact: {
        email: "contact@acme.com",
      },
    },
    buyer: {
      name: "Client Company",
      vat: "FR98765432109",
      postal_address: buyerAddress,
    },
    totals: {
      sum_of_invoice_line_net_amounts: 1100,
      invoice_total_amount_without_vat: 1100,
      invoice_total_vat_amount: 220,
      invoice_total_amount_with_vat: 1320,
    },
    vat_break_down: [
      {
        taxable_amount: 1100,
        tax_amount: 220,
        vat_category_code: "S",
        vat_category_rate: 20,
      },
    ],
    lines: [
      {
        line_number: "1",
        invoiced_quantity: 10,
        invoiced_quantity_unit_code: "C62",
        line_net_amount: 1000,
        line_vat_information: {
          invoiced_item_vat_category_code: "S",
          invoiced_item_vat_rate: 20,
        },
        price_details: {
          item_net_price: 100,
          base_quantity: 1,
        },
        item_information: {
          name: "Professional Services",
          description: "Consulting services",
          sellers_item_identification: "SRV-001",
        },
      },
      {
        line_number: "2",
        invoiced_quantity: 5,
        invoiced_quantity_unit_code: "C62",
        line_net_amount: 100,
        line_vat_information: {
          invoiced_item_vat_category_code: "S",
          invoiced_item_vat_rate: 20,
        },
        price_details: {
          item_net_price: 20,
          base_quantity: 1,
        },
        item_information: {
          name: "Product A",
          sellers_item_identification: "PROD-A",
        },
      },
    ],
  };
}

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
      tva: "20",
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
