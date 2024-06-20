import { Invoices } from "./types/types";

export const getDocumentName = (type: Invoices["type"]) => {
  return (
    (
      {
        quotes: "Devis",
        invoices: "Facture",
        credit_notes: "Avoir",
        supplier_quotes: "Commande",
        supplier_invoices: "Facture fournisseur",
        supplier_credit_notes: "Avoir fournisseur",
      } as any
    )[type] || "Document"
  );
};


export const getDocumentNamePlurial = (type: Invoices["type"]) => {
  return (
    (
      {
        quotes: "Devis",
        invoices: "Factures",
        credit_notes: "Avoirs",
        supplier_quotes: "Commandes",
        supplier_invoices: "Factures fournisseur",
        supplier_credit_notes: "Avoirs fournisseur",
      } as any
    )[type] || "Document"
  );
};
