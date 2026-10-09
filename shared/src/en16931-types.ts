/**
 * EN16931 Invoice Types
 * Based on SuperPDP API OpenAPI specification
 * (backend/src/platform/e-invoices/adapters/superpdp/superpdp.json, schema
 * `en_invoice`). SuperPDP silently ignores unknown keys: field names MUST match
 * the specification (checked by invoice-converter.spec.ts).
 * European standard for electronic invoicing
 */

export interface EN16931PostalAddress {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  post_code?: string;
  country_subdivision?: string;
  country_code?: string;
}

export interface EN16931ElectronicAddress {
  value: string;
  scheme: string;
}

export interface EN16931LegalRegistrationIdentifier {
  value: string;
  scheme?: string;
}

export interface EN16931Identifier {
  value: string;
  scheme?: string;
}

export interface EN16931Contact {
  contact_point?: string;
  department_name?: string;
  email_address?: string;
  phone_number?: string;
}

export interface EN16931Seller {
  name: string;
  vat_identifier?: string;
  postal_address?: EN16931PostalAddress;
  identifiers: [
    {
      value: string; // SIRENE
      scheme: string; // Default to "0225";
    },
  ];
  legal_registration_identifier: {
    value: string; // SIRENE
    scheme: string; // Default to "0002";
  };
  electronic_address: {
    value: string; // E-INVOICE ADDRESS
    scheme: string; // Ex. "0225";
  };
}

export interface EN16931Buyer {
  name: string;
  vat_identifier?: string;
  postal_address?: EN16931PostalAddress;
  identifiers: [
    {
      value: string; // SIRENE
      scheme: string; // Default to "0225";
    },
  ];
  legal_registration_identifier: {
    value: string; // SIRENE
    scheme: string; // Default to "0002";
  };
  electronic_address: {
    value: string; // E-INVOICE ADDRESS
    scheme: string; // Ex. "0225";
  };
}

export interface EN16931Payee {
  name: string;
  legal_registration_identifier?: EN16931LegalRegistrationIdentifier;
}

export interface EN16931Amount {
  value: string;
  currency_code?: string;
}

export interface EN16931Totals {
  /**
   * BT-106
   * Sum of Invoice line net amount
   */
  sum_invoice_lines_amount: string;

  /**
   * BT-107
   * Sum of allowances on document level
   */
  sum_allowances_amount?: string;

  /**
   * BT-108
   * Sum of charges on document level
   */
  sum_charges_amount?: string;

  /**
   * BT-109
   * Invoice total amount without VAT
   */
  total_without_vat: string;

  /**
   * BT-110
   * Invoice total VAT amount
   */
  total_vat_amount?: EN16931Amount;

  /**
   * BT-111
   * Invoice total VAT amount in accounting currency
   */
  total_vat_amount_accounting_currency?: EN16931Amount;

  /**
   * BT-112
   * Invoice total amount with VAT
   */
  total_with_vat: string;

  /**
   * BT-113
   * Paid amount
   */
  paid_amount?: string;

  /**
   * BT-114
   * Rounding amount
   */
  rounding_amount?: string;

  /**
   * BT-115
   * Amount due for payment
   */
  amount_due_for_payment: string;
}

export interface EN16931VatBreakDown {
  /**
   * BT-116
   * VAT category taxable amount
   */
  vat_category_taxable_amount: string;

  /**
   * BT-117
   * VAT category tax amount
   */
  vat_category_tax_amount: string;

  /**
   * BT-118
   * VAT category code
   */
  vat_category_code: string;

  /**
   * BT-119
   * VAT category rate (%)
   */
  vat_category_rate?: string;

  /**
   * BT-120
   * VAT exemption reason text
   */
  vat_exemption_reason?: string;

  /**
   * VAT exemption reason code
   */
  vat_exemption_reason_code?: string;

  /**
   * BT-118-0
   * VAT type code identifier qualifier
   */
  vat_identifier?: string;
}

export interface EN16931AllowanceOrCharge {
  amount: string;

  vat_category_code: string;

  base_amount?: string;
  percent?: string;

  reason?: string;
  reason_code?: string;

  vat_rate?: string;
  vat_identifier?: string;

  vat_exemption_reason?: string;
  vat_exemption_reason_code?: string;
}

export interface EN16931InvoicingPeriod {
  start_date?: string;
  end_date?: string;
}

export interface EN16931InvoiceNote {
  note: string;
  subject_code?: string;
}

export interface EN16931PrecedingInvoiceReference {
  reference: string; // BT-25
  issue_date?: string; // BT-26
  preceding_invoice_type_code?: number;
}

export interface EN16931CreditTransfer {
  payment_account_identifier: {
    value: string;
    scheme?: string;
  };
  payment_account_name?: string;
  payment_service_provider_identifier?: string;
}

export interface EN16931DirectDebit {
  mandate_reference_identifier?: string;
  bank_assigned_creditor_identifier?: string;
  debited_account_identifier?: string;
}

export interface EN16931PaymentCardInformation {
  account_number: string;
  holder_name?: string;
  network_id?: string;
}

// BG-16, the payment terms (BT-20) are at the invoice level
export interface EN16931PaymentInstructions {
  payment_means_type_code: string; // BT-81, UNTDID 4461
  payment_means_text?: string; // BT-82
  remittance_information?: string; // BT-83
  credit_transfers?: EN16931CreditTransfer[]; // BG-17
  direct_debit?: EN16931DirectDebit; // BG-19
  payment_card_information?: EN16931PaymentCardInformation; // BG-18
}

// BG-13, the deliver to address (BG-15) is at the invoice level
export interface EN16931DeliveryInformation {
  deliver_to_name?: string; // BT-70
  delivery_date?: string; // BT-72
  delivery_identifier?: EN16931Identifier[]; // BT-71
}

export interface EN16931ProcessControl {
  business_process_type?: string;
  specification_identifier?: string;
}

export interface EN16931BinaryObject {
  content: string;
  mime_code: string;
  filename: string;
}

export interface EN16931AdditionalSupportingDocument {
  key: string;
  document_reference: string;
  document_description?: string;
  external_document_location?: string;
  attached_document?: EN16931BinaryObject;
}

export interface EN16931PriceDetails {
  item_net_price: string; // BT-146
  item_price_discount?: string; // BT-147
  item_gross_price?: string; // BT-148
  item_price_base_quantity?: string; // BT-149
  quantity_unit_code?: string; // BT-150
}

export interface EN16931ItemAttribute {
  name?: string;
  value: string;
  code?: string;
  quantity?: string;
  quantity_unit?: string;
}

export interface EN16931ClassificationIdentifier {
  value: string;
  scheme?: string;
  version_scheme?: string;
}

export interface EN16931ItemInformation {
  name: string; // BT-153
  description?: string; // BT-154
  seller_identifier?: string; // BT-155
  buyer_identifier?: string; // BT-156
  standard_identifier_value?: string; // BT-157
  standard_identifier_scheme?: string; // BT-157-1
  country_of_origin?: string; // BT-159
  classification_identifier?: EN16931ClassificationIdentifier[]; // BT-158
  attributes?: EN16931ItemAttribute[]; // BG-32
}

export interface EN16931LineVatInformation {
  invoiced_item_vat_category_code: string;
  invoiced_item_vat_rate?: string;
  exemption_reason?: string;
  exemption_reason_code?: string;
  due_date_code?: string;
}

export interface EN16931InvoiceLineAllowanceOrCharge {
  amount: string;
  base_amount?: string;
  percent?: string;
  reason?: string;
  reason_code?: string;
}

export interface EN16931InvoiceLineNote {
  subject_code?: string;
  note: string;
}

export interface EN16931InvoiceLine {
  identifier: string;
  additional_reference_previous_invoice_line?: AdditionalReferencePreviousInvoiceLine;
  allowances?: EN16931InvoiceLineAllowanceOrCharge[];
  charges?: EN16931InvoiceLineAllowanceOrCharge[];
  buyer_accounting_reference?: string;
  delivery_address?: LineDeliveryAddress;
  invoiced_quantity: string;
  invoiced_quantity_code: string;
  item_information: EN16931ItemInformation;
  line_vat_accounting_currency?: string;
  line_vat_amount?: string;
  line_vat_amount_accounting_currency?: string;
  line_vat_currency?: string;
  line_with_vat_net_amount?: string;
  net_amount: string;
  notes?: EN16931InvoiceLineNote[];
  object_identifier?: EN16931Identifier[];
  parent_identifier?: string;
  parent_unit_code?: string;
  parent_unit_quantity?: string;
  period?: EN16931InvoicingPeriod;
  price_details: EN16931PriceDetails;
  purchase_order_reference_from_buyer?: string;
  real_delivery_date?: string; // ISO date
  receipt_voucher?: LineIdentifier;
  referenced_purchase_order_line_reference?: string;
  sales_order?: LineIdentifier;
  seller?: EN16931Seller;
  shipping_notice?: LineIdentifier;
  subtype?: "DETAIL" | "GROUP" | "INFORMATION";
  vat_information: EN16931LineVatInformation;
}

export interface AdditionalReferencePreviousInvoiceLine {
  previous_invoice_id: string;
  previous_invoice_issue_date: string; // ISO date (YYYY-MM-DD)
  previous_invoice_line_number: string;
  previous_invoice_type_code: number;
}

export interface LineDeliveryAddress {
  delivery_place_identifier: EN16931Identifier[];
  delivery_place_name: string;
  postal_address: EN16931PostalAddress;
}

export interface LineIdentifier {
  identifier: string;
  line_identifier: string;
}

/**
 * Main EN16931 Invoice structure
 * Following the European standard for electronic invoicing
 */
export interface EN16931Invoice {
  // Process control
  process_control?: EN16931ProcessControl;

  // Invoice metadata
  number: string;
  issue_date: string; // ISO 8601 date format
  payment_due_date?: string;
  type_code: number; // 380 for invoice, 381 for credit note, etc.
  notes?: EN16931InvoiceNote[];
  currency_code: string; // ISO 4217
  vat_accounting_currency_code?: string;

  // References
  buyer_reference?: string;
  purchase_order_reference?: string;
  sales_order_reference?: string;
  contract_reference?: string;
  preceding_invoice_references?: EN16931PrecedingInvoiceReference[];

  // Periods
  invoicing_period?: EN16931InvoicingPeriod;

  // Parties
  seller: EN16931Seller;
  buyer: EN16931Buyer;
  payee?: EN16931Payee;
  seller_tax_representative_party?: {
    name: string;
    vat_identifier: string;
    postal_address: EN16931PostalAddress;
  };

  // Delivery
  delivery_information?: EN16931DeliveryInformation;
  deliver_to_address?: EN16931PostalAddress; // BG-15

  // Payment
  payment_terms?: string; // BT-20
  payment_instructions?: EN16931PaymentInstructions;

  // Allowances and charges
  document_level_allowances?: EN16931AllowanceOrCharge[]; // BG-20
  charges?: EN16931AllowanceOrCharge[]; // BG-21

  // Totals
  totals: EN16931Totals;

  // VAT breakdown
  vat_break_down: EN16931VatBreakDown[];

  // Additional documents
  additional_supporting_documents?: EN16931AdditionalSupportingDocument[];

  // Invoice lines
  lines: EN16931InvoiceLine[];

  // Project reference
  project_reference?: string;

  // VAT point date (BT-7) and code (BT-8)
  vat_point_date?: string;
  vat_point_date_code?: string;
}
