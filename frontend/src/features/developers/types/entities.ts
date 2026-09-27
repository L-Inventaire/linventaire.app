// Entities that webhooks can listen to (same as the public API documentation)
export const WEBHOOK_ENTITIES: { table: string; label: string }[] = [
  { table: "contacts", label: "Contacts" },
  { table: "articles", label: "Articles" },
  { table: "invoices", label: "Devis, factures et avoirs" },
  { table: "stock_items", label: "Stock" },
  { table: "stock_locations", label: "Emplacements de stock" },
  { table: "service_items", label: "Services (tâches)" },
  { table: "service_times", label: "Temps passés" },
  { table: "crm_items", label: "CRM" },
  { table: "accounting_transactions", label: "Transactions comptables" },
  { table: "accounting_accounts", label: "Comptes comptables" },
  { table: "tags", label: "Étiquettes" },
  { table: "fields", label: "Champs personnalisés" },
  { table: "files", label: "Fichiers" },
  { table: "comments", label: "Commentaires" },
];

export const WEBHOOK_EVENT_LABELS: Record<string, string> = {
  created: "Création",
  updated: "Modification",
  deleted: "Suppression",
};

export const entityLabel = (table: string) =>
  WEBHOOK_ENTITIES.find((e) => e.table === table)?.label || table;
