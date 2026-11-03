import { TableDefinition } from "../../../../platform/db/api";

/**
 * CII XML of the Factur-X PDFs (see facturx-generator), computed once by
 * SuperPDP per document and EN16931 data (`hash`), then embedded locally each
 * time the PDF is generated.
 */
export const FacturXXmlCacheDefinition: TableDefinition = {
  name: "facturx_xml_cache",
  columns: {
    client_id: "VARCHAR(64)",
    invoice_id: "VARCHAR(64)",
    hash: "VARCHAR(64)", // sha256 of the EN16931 data
    xml: "TEXT",
    error: "TEXT", // Refused by SuperPDP (business rules): not converted again
    created_at: "BIGINT",
  },
  pk: ["client_id", "invoice_id", "hash"],
  // No "rest" configuration: this table is never exposed through the generic REST api
  auditable: false,
};

export default class FacturXXmlCache {
  public client_id: string;
  public invoice_id: string;
  public hash: string;
  public xml: string;
  public error: string | null;
  public created_at: number;
}
