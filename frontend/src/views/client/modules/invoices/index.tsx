import { useRouterState } from "@features/utils/hooks/use-router-state";
import { useParams } from "react-router-dom";
import { InvoicesListView } from "./components/invoices-list-view";
import {
  InvoicesTabsResult,
  useGenericInvoicesTabs,
  useQuotesTabs,
  useSubscriptionsTabs,
  useSupplierDocumentsTabs,
  useSupplierQuotesTabs,
} from "./hooks/use-invoices-tabs";
import { useTabInvoices } from "./hooks/use-tab-invoices";

export const InvoicesPage = () => {
  const type = useParams().type || "invoices";
  return <InvoicesPageRouter key={type} type={type} />;
};

// Dispatch the route :type to the right dedicated page. Each page owns its tabs
// (via a useXxxTabs hook), shares the common data hook (useTabInvoices) and the
// common rendering (InvoicesListView).
const InvoicesPageRouter = ({ type }: { type: string }) => {
  if (type === "subscriptions") return <SubscriptionsPage />;
  const types = type.split("+");
  if (types.includes("quotes")) return <QuotesPage />;
  if (types.includes("supplier_quotes")) return <SupplierQuotesPage />;
  if (types.some((t) => t.startsWith("supplier_")))
    return <SupplierGenericPage />;
  if (types.includes("credit_notes"))
    return <GenericPage documentType="credit_notes" />;
  return <GenericPage documentType="invoices" />;
};

// Common page shell: wires the active tab, the data hook and the common view
const InvoicesTabsPage = ({
  result,
  defaultTab,
  showCreate,
}: {
  result: InvoicesTabsResult;
  defaultTab: string;
  showCreate?: boolean;
}) => {
  const [activeTab, setActiveTab] = useRouterState("tab", defaultTab);
  const list = useTabInvoices({
    types: result.types,
    activeTab,
    tabs: result.tabs,
  });
  return (
    <InvoicesListView
      types={result.types}
      title={result.title}
      tabs={result.tabs}
      counters={result.counters}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      list={list}
      showCreate={showCreate}
    />
  );
};

const QuotesPage = () => {
  const result = useQuotesTabs();
  return <InvoicesTabsPage result={result} defaultTab="all" />;
};

const SubscriptionsPage = () => {
  const result = useSubscriptionsTabs();
  return (
    <InvoicesTabsPage result={result} defaultTab="active" showCreate={false} />
  );
};

const GenericPage = ({
  documentType,
}: {
  documentType: "invoices" | "credit_notes";
}) => {
  const result = useGenericInvoicesTabs(documentType);
  return <InvoicesTabsPage result={result} defaultTab="all" />;
};

const SupplierQuotesPage = () => {
  const result = useSupplierQuotesTabs();
  return <InvoicesTabsPage result={result} defaultTab="all" />;
};

const SupplierGenericPage = () => {
  const result = useSupplierDocumentsTabs();
  return <InvoicesTabsPage result={result} defaultTab="all" />;
};
