/**
 * EN16931 Invoice Types
 * Based on SuperPDP API OpenAPI specification
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
  name?: string;
  telephone?: string;
  email?: string;
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
  description_code?: string;
}

export interface EN16931InvoiceNote {
  note: string;
  subject_code?: string;
}

export interface EN16931PrecedingInvoiceReference {
  invoice_number: string;
  issue_date?: string;
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
}

export interface EN16931PaymentInstructions {
  payment_means_type_code: string;
  payment_terms?: string;
  remittance_information?: string;
  credit_transfer?: EN16931CreditTransfer[];
  direct_debit?: EN16931DirectDebit;
  payment_card_information?: EN16931PaymentCardInformation;
}

export interface EN16931DeliveryInformation {
  actual_delivery_date?: string;
  invoicing_period?: EN16931InvoicingPeriod;
  delivery_location_identifier?: EN16931Identifier;
  postal_address?: EN16931PostalAddress;
  party_name?: string;
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
  description?: string;
  external_document_location?: string;
  attached_document?: EN16931BinaryObject;
}

export interface EN16931PriceDetails {
  item_net_price: string;
  item_price_discount?: string;
  item_gross_price?: string;
  base_quantity?: string;
  base_quantity_unit_code?: string;
}

export interface EN16931ItemAttribute {
  name?: string;
  value: string;
}

export interface EN16931ClassificationIdentifier {
  value: string;
  scheme?: string;
  version_scheme?: string;
}

export interface EN16931ItemInformation {
  name: string;
  description?: string;
  sellers_item_identification?: string;
  buyers_item_identification?: string;
  standard_item_identification?: string;
  origin_country_code?: string;
  item_classification_identifier?: EN16931ClassificationIdentifier[];
  attributes?: EN16931ItemAttribute[];
}

export interface EN16931LineVatInformation {
  invoiced_item_vat_category_code: string;
  invoiced_item_vat_rate?: string;
}

export interface EN16931InvoiceLineAllowanceOrCharge {
  amount: string;
  base_amount?: string;
  percent?: string;
  reason?: string;
  reason_code?: string;
}

export interface EN16931InvoiceLineNote {
  line_note_id?: string;
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
  vat_category_code?: string;
  vat_exemption_reason_code?: string;

  // References
  buyer_reference?: string;
  purchase_order_reference?: string;
  sales_order_reference?: string;
  contract_reference?: string;
  preceding_invoice_reference?: EN16931PrecedingInvoiceReference[];

  // Periods
  invoicing_period?: EN16931InvoicingPeriod;

  // Parties
  seller: EN16931Seller;
  buyer: EN16931Buyer;
  payee?: EN16931Payee;
  tax_representative?: any; // seller_tax_representative_party

  // Delivery
  delivery_information?: EN16931DeliveryInformation;

  // Payment
  payment_details?: EN16931PaymentInstructions;

  // Allowances and charges
  document_level_allowances?: EN16931AllowanceOrCharge[];
  document_level_charges?: EN16931AllowanceOrCharge[];

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

  // Tax point date
  tax_point_date?: string;

  // Value added tax point date code
  value_added_tax_point_date_code?: string;
}
