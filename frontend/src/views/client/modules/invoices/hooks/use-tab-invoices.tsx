import { Invoices } from "@features/invoices/types/types";
import { getDocumentName } from "@features/invoices/utils";
import {
  RestOptions,
  RestSearchQuery,
  useRestExporter,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { computePaymentDelayDate } from "@shared/invoices";
import { Pagination } from "@molecules/table/table";
import { useRef, useState } from "react";
import { buildQueryFromMap } from "../../../../../components/search-bar/utils/utils";
import { getInvoiceStatusPrettyName } from "../utils";

export type InvoiceTab = { label: string; filter: RestSearchQuery[] };
export type InvoiceTabs = Record<string, InvoiceTab>;

/**
 * Common data hook shared by every invoices list page (quotes, invoices,
 * subscriptions, ...). It owns the table options/query state, the data query
 * for the active tab and the CSV exporter. Tabs, counters and title are
 * provided by the per-page `useXxxTabs` hooks.
 */
export const useTabInvoices = ({
  types,
  activeTab,
  tabs,
}: {
  types: Invoices["type"][];
  activeTab: string;
  tabs: InvoiceTabs;
}) => {
  const isQuoteLike = types[0] === "quotes" || types[0] === "supplier_quotes";

  const [options, setOptions] = useState<RestOptions<Invoices>>({
    index: isQuoteLike
      ? activeTab === "all"
        ? "emit_date desc"
        : "state_order,emit_date desc"
      : activeTab === "all"
        ? "reference desc"
        : "state_order,reference desc",
    limit: 20,
    offset: 0,
    query: [],
  });
  const [groupBy, setGroupBy] = useState<string>(
    activeTab === "all" ? "" : "state_order",
  );
  const resetToFirstPage = useRef(() => {});

  const invoiceFilters = {
    ...options,
    query: [
      ...((options?.query as any) || []),
      ...buildQueryFromMap({ type: types }),
    ],
  };

  const invoicesQueryOptions = {
    ...invoiceFilters,
    query: [...invoiceFilters.query, ...(tabs[activeTab]?.filter || [])],
    asc: true,
    key: "main-" + types.join("+") + "_" + activeTab,
  };
  const { invoices } = useInvoices(invoicesQueryOptions);
  const schema = useRestSchema("invoices");
  const restExporter = useRestExporter<Invoices>("invoices");

  // Isolated exporter function that conditionally includes fields based on document type
  const exporter =
    (exportOptions: RestOptions<Invoices>) =>
    async (pagination: Pick<Pagination, "page" | "perPage">) => {
      const invoices = await restExporter(exportOptions)(pagination);
      return invoices.map((invoice) => {
        // Base fields included for all document types
        const baseFields = {
          id: invoice.id,
          reference: invoice.reference,
          type: getDocumentName(invoice.type),
          status: getInvoiceStatusPrettyName(invoice.state, invoice.type),
          emit_date: new Date(invoice.emit_date).toISOString().slice(0, 10),
          name: invoice.name,
          content: (invoice.content || []).map((line) => line.name).join(", "),
          partner: invoice.cache?.partner_names || "",
          partner_id: invoice.client || invoice.supplier,
          partner_recipients: (invoice.recipients || [])
            .map((r) => r.email)
            .join(", "),
          price_currency: invoice.currency,
          price_before_discounts: invoice.total?.initial || 0,
          price_discount: invoice.total?.discount || 0,
          price_taxes: invoice.total?.taxes || 0,
          price_total_ht: invoice.total?.total || 0,
          price_total_ttc: invoice.total?.total_with_taxes || 0,
        };

        // Fields specific to different document types
        const typeSpecificFields: Record<string, any> = {};

        // Due date calculation varies by document type
        typeSpecificFields.due_date =
          invoice.type === "quotes"
            ? computePaymentDelayDate(invoice)
                .toJSDate()
                .toISOString()
                .slice(0, 10)
            : new Date(invoice.payment_information.computed_date)
                .toISOString()
                .slice(0, 10);

        // Payment methods for all types that have payment_information
        if (invoice.payment_information?.mode) {
          typeSpecificFields.payment_methods = (
            invoice.payment_information.mode || []
          ).join(", ");
        }

        // Fields specific to quotes in recurring state
        if (invoice.type === "quotes" && invoice.state === "recurring") {
          typeSpecificFields.recurrence_next_invoice =
            invoice.subscription_next_invoice_date;
        }

        // Fields specific to invoices with subscription information
        if (invoice.from_subscription) {
          typeSpecificFields.recurrence_frequency =
            invoice.from_subscription.frequency || "";

          if (invoice.from_subscription.from) {
            typeSpecificFields.recurrence_period_from = new Date(
              invoice.from_subscription.from,
            )
              .toISOString()
              .slice(0, 10);
          }

          if (invoice.from_subscription.to) {
            typeSpecificFields.recurrence_period_to = new Date(
              invoice.from_subscription.to,
            )
              .toISOString()
              .slice(0, 10);
          }
        }

        // Fields specific to invoices and credit notes
        if (invoice.type === "invoices" || invoice.type === "credit_notes") {
          typeSpecificFields.paid = invoice?.transactions?.percentage >= 100;

          if (invoice.from_rel_quote && invoice.from_rel_quote.length > 0) {
            typeSpecificFields.from_quotes_id =
              invoice.from_rel_quote.join(", ");
            typeSpecificFields.from_quotes_reference =
              invoice.cache?.from_rel_quote_ref || "";
          }
        }

        // Return combined object with only the fields relevant to this document type
        return { ...baseFields, ...typeSpecificFields };
      });
    };

  return {
    options,
    setOptions,
    groupBy,
    setGroupBy,
    resetToFirstPage,
    invoiceFilters,
    invoicesQueryOptions,
    invoices,
    schema,
    exporter,
  };
};

export type TabInvoices = ReturnType<typeof useTabInvoices>;
