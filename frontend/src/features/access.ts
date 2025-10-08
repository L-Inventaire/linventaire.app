import { useClients } from "./clients/state/use-clients";
import { Role } from "./clients/types/clients";

export const useHasAccess = () => {
  const { client } = useClients();
  return (requested: Role) => {
    if (!client) return false;
    if (client.roles?.list?.includes("CLIENT_MANAGE")) return true;
    return (
      client.roles?.list?.includes(requested) ||
      client.roles?.list?.includes(
        requested.replace("_READ", "_MANAGE") as any
      ) ||
      client.roles?.list?.includes(
        requested.replace("_READ", "_WRITE") as any
      ) ||
      client.roles?.list?.includes(
        requested.replace("_WRITE", "_MANAGE") as any
      )
    );
  };
};

export const entityToAccessLevel = (
  entity: string,
  action: "READ" | "WRITE" | "MANAGE" = "READ"
): Role => {
  switch (entity) {
    case "clients":
      return `CLIENT_${action}`;
    case "contacts":
      return `CONTACTS_${action}`;
    case "invoices":
    case "invoices_invoices":
    case "invoices_credit_notes":
      return `INVOICES_${action}`;
    case "invoices_quotes":
      return `QUOTES_${action}`;
    case "invoices_supplier_invoices":
    case "invoices_supplier_credit_notes":
      return `SUPPLIER_INVOICES_${action}`;
    case "invoices_supplier_quotes":
      return `SUPPLIER_QUOTES_${action}`;
    case "crm_items":
      return `CRM_${action}`;
    case "stock_items":
      return `STOCK_${action}`;
    case "service_items":
      return `ONSITE_SERVICES_${action}`;
    case "articles":
      return `ARTICLES_${action}`;
    case "accounting_transactions":
    case "accounting_accounts":
      return `ACCOUNTING_${action}`;
  }
  return `CLIENT_${action}`;
};
