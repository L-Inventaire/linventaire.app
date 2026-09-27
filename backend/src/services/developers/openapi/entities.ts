import { TableDefinition } from "../../../platform/db/api";
import { AccountingAccountsDefinition } from "../../modules/accounting/entities/accounts";
import { AccountingTransactionsDefinition } from "../../modules/accounting/entities/transactions";
import { ArticlesDefinition } from "../../modules/articles/entities/articles";
import { CommentsDefinition } from "../../modules/comments/entities/comments";
import { ContactsDefinition } from "../../modules/contacts/entities/contacts";
import { CRMItemsDefinition } from "../../modules/crm/entities/crm-items";
import { FieldsDefinition } from "../../modules/fields/entities/fields";
import { FilesDefinition } from "../../modules/files/entities/files";
import { InvoicesDefinition } from "../../modules/invoices/entities/invoices";
import { ServiceItemsDefinition } from "../../modules/service/entities/service-item";
import { ServiceTimesDefinition } from "../../modules/service/entities/service-time";
import { StockItemsDefinition } from "../../modules/stock/entities/stock-items";
import { StockLocationsDefinition } from "../../modules/stock/entities/stock-locations";
import { TagsDefinition } from "../../modules/tags/entities/tags";

export type DocumentedEntity = {
  definition: TableDefinition;
  // Entity class, used to extract enums and comments from the typescript sources
  className: string;
  // Path of the file declaring the class, relative to backend/src
  source: string;
  title: string;
  description: string;
  // Permissions needed to read / write / delete (see the roles of the user)
  permissions: { read: string; write: string; manage: string };
};

const permissions = (prefix: string) => ({
  read: `${prefix}_READ`,
  write: `${prefix}_WRITE`,
  manage: `${prefix}_MANAGE`,
});

/**
 * Entities exposed in the public API documentation. All of them are available
 * through the generic REST api (/api/rest/v1/{clientId}/{table}).
 */
export const DocumentedEntities: DocumentedEntity[] = [
  {
    definition: ContactsDefinition,
    className: "Contacts",
    source: "services/modules/contacts/entities/contacts.ts",
    title: "Contacts",
    description:
      "Clients, fournisseurs et personnes. Un contact peut être une entreprise ou une personne, et être rattaché à d'autres contacts (parents).",
    permissions: permissions("CONTACTS"),
  },
  {
    definition: ArticlesDefinition,
    className: "Articles",
    source: "services/modules/articles/entities/articles.ts",
    title: "Articles",
    description:
      "Catalogue de produits, services et consommables, avec leurs prix de vente et fournisseurs.",
    permissions: permissions("ARTICLES"),
  },
  {
    definition: InvoicesDefinition,
    className: "Invoices",
    source: "services/modules/invoices/entities/invoices.ts",
    title: "Documents (devis, factures, avoirs)",
    description:
      "Devis, factures, avoirs et leurs équivalents fournisseurs, différenciés par le champ `type`. Les permissions dépendent du type de document : `QUOTES_*`, `INVOICES_*`, `SUPPLIER_QUOTES_*`, `SUPPLIER_INVOICES_*`.",
    permissions: {
      read: "QUOTES_READ | INVOICES_READ | SUPPLIER_QUOTES_READ | SUPPLIER_INVOICES_READ",
      write:
        "QUOTES_WRITE | INVOICES_WRITE | SUPPLIER_QUOTES_WRITE | SUPPLIER_INVOICES_WRITE",
      manage:
        "QUOTES_MANAGE | INVOICES_MANAGE | SUPPLIER_QUOTES_MANAGE | SUPPLIER_INVOICES_MANAGE",
    },
  },
  {
    definition: StockItemsDefinition,
    className: "StockItems",
    source: "services/modules/stock/entities/stock-items.ts",
    title: "Stock",
    description:
      "Éléments de stock (numéros de série, lots, quantités) et leur emplacement.",
    permissions: permissions("STOCK"),
  },
  {
    definition: StockLocationsDefinition,
    className: "StockLocations",
    source: "services/modules/stock/entities/stock-locations.ts",
    title: "Emplacements de stock",
    description: "Entrepôts, étagères et autres emplacements de stock.",
    permissions: {
      read: "STOCK_READ",
      write: "CLIENT_MANAGE",
      manage: "CLIENT_MANAGE",
    },
  },
  {
    definition: ServiceItemsDefinition,
    className: "ServiceItems",
    source: "services/modules/service/entities/service-item.ts",
    title: "Services (tâches)",
    description: "Tâches et interventions à réaliser pour vos clients.",
    permissions: permissions("ONSITE_SERVICES"),
  },
  {
    definition: ServiceTimesDefinition,
    className: "ServiceTimes",
    source: "services/modules/service/entities/service-time.ts",
    title: "Temps passés",
    description: "Temps passé sur les tâches.",
    permissions: permissions("ONSITE_SERVICES"),
  },
  {
    definition: CRMItemsDefinition,
    className: "CRMItems",
    source: "services/modules/crm/entities/crm-items.ts",
    title: "CRM",
    description: "Opportunités commerciales du pipeline CRM.",
    permissions: permissions("CRM"),
  },
  {
    definition: AccountingTransactionsDefinition,
    className: "AccountingTransactions",
    source: "services/modules/accounting/entities/transactions.ts",
    title: "Transactions comptables",
    description: "Écritures et paiements.",
    permissions: permissions("ACCOUNTING"),
  },
  {
    definition: AccountingAccountsDefinition,
    className: "AccountingAccounts",
    source: "services/modules/accounting/entities/accounts.ts",
    title: "Comptes comptables",
    description: "Plan comptable et comptes bancaires.",
    permissions: {
      read: "ACCOUNTING_READ",
      write: "CLIENT_MANAGE",
      manage: "CLIENT_MANAGE",
    },
  },
  {
    definition: TagsDefinition,
    className: "Tags",
    source: "services/modules/tags/entities/tags.ts",
    title: "Étiquettes",
    description: "Étiquettes utilisables sur la plupart des documents.",
    permissions: permissions("TAGS"),
  },
  {
    definition: FieldsDefinition,
    className: "Fields",
    source: "services/modules/fields/entities/fields.ts",
    title: "Champs personnalisés",
    description:
      "Définition des champs personnalisés, leurs valeurs sont stockées dans l'attribut `fields` de chaque document.",
    permissions: permissions("FIELDS"),
  },
  {
    definition: FilesDefinition,
    className: "Files",
    source: "services/modules/files/entities/files.ts",
    title: "Fichiers",
    description: "Métadonnées des fichiers attachés aux documents.",
    permissions: permissions("FILES"),
  },
  {
    definition: CommentsDefinition,
    className: "Comments",
    source: "services/modules/comments/entities/comments.ts",
    title: "Commentaires",
    description:
      "Commentaires et événements du fil d'activité de chaque document.",
    permissions: permissions("COMMENTS"),
  },
];
