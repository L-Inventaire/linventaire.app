{
  "number": "F20260429_084605_889",
  "issue_date": "2025-06-30",
  "type_code": 380,
  "currency_code": "EUR",
  "payment_due_date": "2025-07-30",
  "notes": [
    {
      "subject_code": "PMT",
      "note": "L’indemnité forfaitaire légale pour frais de recouvrement est de 40 €."
    },
    {
      "subject_code": "PMD",
      "note": "À défaut de règlement à la date d’échéance, une pénalité de 10 % du net à payer sera applicable immédiatement."
    },
    {
      "subject_code": "AAB",
      "note": "Aucun escompte pour paiement anticipé."
    }
  ],
  "process_control": {
    "business_process_type": "M1",
    "specification_identifier": "urn:cen.eu:en16931:2017"
  },
  "seller": {
    "name": "Tricatel",
    "identifiers": [
      {
        "value": "000000001",
        "scheme": "0225"
      }
    ],
    "legal_registration_identifier": {
      "value": "000000001",
      "scheme": "0002"
    },
    "vat_identifier": "FR15000000001",
    "electronic_address": {
      "value": "315143296_3173",
      "scheme": "0225"
    },
    "postal_address": {
      "country_code": "FR"
    }
  },
  "buyer": {
    "name": "Burger Queen",
    "identifiers": [
      {
        "value": "000000002",
        "scheme": "0225"
      }
    ],
    "legal_registration_identifier": {
      "value": "000000002",
      "scheme": "0002"
    },
    "vat_identifier": "FR18000000002",
    "electronic_address": {
      "value": "315143296_3174",
      "scheme": "0225"
    },
    "postal_address": {
      "country_code": "FR"
    }
  },
  "delivery_information": {
    "delivery_date": "2025-06-30"
  },
  "deliver_to_address": {
    "country_code": "FR"
  },
  "totals": {
    "sum_invoice_lines_amount": "1560.46",
    "total_without_vat": "1560.46",
    "total_vat_amount": {
      "value": "303.33",
      "currency_code": "EUR"
    },
    "total_with_vat": "1863.79",
    "amount_due_for_payment": "1863.79"
  },
  "vat_break_down": [
    {
      "vat_category_taxable_amount": "60.46",
      "vat_category_tax_amount": "3.33",
      "vat_category_code": "S",
      "vat_identifier": "VAT",
      "vat_category_rate": "5.5"
    },
    {
      "vat_category_taxable_amount": "1500.00",
      "vat_category_tax_amount": "300.00",
      "vat_category_code": "S",
      "vat_identifier": "VAT",
      "vat_category_rate": "20.0"
    }
  ],
  "lines": [
    {
      "identifier": "001",
      "invoiced_quantity": "28.520",
      "invoiced_quantity_code": "KGM",
      "net_amount": "60.46",
      "price_details": {
        "item_net_price": "2.12"
      },
      "vat_information": {
        "invoiced_item_vat_category_code": "S",
        "invoiced_item_vat_rate": "5.5"
      },
      "item_information": {
        "name": "Poulet aux hormones"
      }
    },
    {
      "identifier": "002",
      "invoiced_quantity": "1",
      "invoiced_quantity_code": "C62",
      "net_amount": "1500",
      "price_details": {
        "item_net_price": "1500.0"
      },
      "vat_information": {
        "invoiced_item_vat_category_code": "S",
        "invoiced_item_vat_rate": "20.0"
      },
      "item_information": {
        "name": "Conseil en stratégie",
        "description": "Élaboration d’un plan de communication sur les mérites des aliments ultratransformés."
      }
    }
  ]
}